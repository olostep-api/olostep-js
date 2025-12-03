import fetch, {HeadersInit} from 'node-fetch';

import {RetryOptions} from '../config.js';
import {
  OlostepAPIConnectionError,
  OlostepServerAuthFailed,
  OlostepServerBlacklistedDomain,
  OlostepServerCreditsExhausted,
  OlostepServerFeatureApprovalRequired,
  OlostepServerInternalNetworkIssue,
  OlostepServerInvalidEndpointCalled,
  OlostepServerNetworkBusy,
  OlostepServerNoResultInResponse,
  OlostepServerOutOfResources,
  OlostepServerParserNotFound,
  OlostepServerRequestUnprocessable,
  OlostepServerResourceNotFound,
  OlostepServerTemporaryIssue,
  OlostepServerUnknownIssue
} from '../errors.js';

import {RequestMetadata, ResponseMetadata} from '../errors.js';

export type QueryValue = string | number | boolean | undefined | Array<string | number | boolean>;

export interface HttpRequest<TBody = unknown> {
  method: 'GET' | 'POST';
  path: string;
  query?: Record<string, QueryValue>;
  headers?: HeadersInit;
  body?: TBody;
}

export interface HttpResponse<TData = unknown> {
  status: number;
  headers: Record<string, string>;
  data: TData;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const buildQueryString = (query?: HttpRequest['query']) => {
  if (!query) {
    return '';
  }
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value === undefined || value === null) {
      return;
    }
    if (Array.isArray(value)) {
      value.forEach((entry) => {
        if (entry !== undefined && entry !== null) {
          params.append(key, String(entry));
        }
      });
    } else {
      params.append(key, String(value));
    }
  });
  const serialized = params.toString();
  return serialized.length ? `?${serialized}` : '';
};

const toRequestMetadata = (request: HttpRequest, url: string): RequestMetadata => ({
  method: request.method,
  url,
  body: request.body,
  query: request.query
});

const toResponseMetadata = (
  status: number,
  headers: Record<string, string>,
  body: unknown
): ResponseMetadata => ({
  status,
  headers,
  body
});

const parseJson = (text: string) => {
  if (!text) {
    return undefined;
  }
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
};

const extractMessage = (body: unknown): string | undefined => {
  if (typeof body === 'string') {
    return body;
  }
  if (body && typeof body === 'object') {
    const record = body as Record<string, unknown>;
    if (record.error && typeof record.error === 'object' && record.error !== null) {
      const err = record.error as Record<string, unknown>;
      if (typeof err.message === 'string') {
        return err.message;
      }
    }
    if (typeof record.message === 'string') {
      return record.message;
    }
  }
  return undefined;
};

const bodyContains = (text: string | undefined, needle: string) => {
  if (!text) {
    return false;
  }
  return text.toLowerCase().includes(needle.toLowerCase());
};

// Accept any polyfillable object with .forEach
const normalizeHeaders = (headers: {forEach(cb: (value: string, key: string) => void): void}): Record<string, string> => {
  const result: Record<string, string> = {};
  headers.forEach((value, key) => {
    result[key.toLowerCase()] = value;
  });
  return result;
};

interface ErrorContext {
  status: number;
  body: unknown;
  rawBody: string | undefined;
  headers: Record<string, string>;
  request: RequestMetadata;
  apiKey: string;
}

const handleErrorResponse = (context: ErrorContext): never => {
  const {status, body, rawBody, headers, request, apiKey} = context;
  const response = toResponseMetadata(status, headers, body ?? rawBody);
  const details = {request, response};
  const message = extractMessage(body) ?? rawBody;
  const bodyRecord = body && typeof body === 'object' ? (body as Record<string, unknown>) : undefined;

  const isNotEnoughResources =
    bodyRecord?.malformed_request === false &&
    typeof bodyRecord?.message === 'string' &&
    (bodyRecord?.message as string).toLowerCase() === 'not enough resources available for the batch execution.';

  switch (status) {
    case 400:
    case 500: {
      if (message && message.toLowerCase().includes('no parser with this name')) {
        throw new OlostepServerParserNotFound(details);
      }
      throw new OlostepServerRequestUnprocessable(details);
    }
    case 401:
      throw new OlostepServerBlacklistedDomain(details);
    case 402: {
      const usageLimitReached = bodyRecord?.usage_limit_reached === true;
      if (usageLimitReached) {
        throw new OlostepServerCreditsExhausted(message, details);
      }
      throw new OlostepServerAuthFailed(apiKey, details);
    }
    case 403: {
      const errType = headers['x-amzn-errortype'];
      if (errType === 'IncompleteSignatureException' && bodyContains(rawBody, 'Invalid key=value pair')) {
        throw new OlostepServerInvalidEndpointCalled(request, response);
      }
      throw new OlostepServerFeatureApprovalRequired(details);
    }
    case 404:
      if (isNotEnoughResources) {
        throw new OlostepServerOutOfResources(details);
      }
      throw new OlostepServerResourceNotFound(response);
    case 501: {
      const isCapacityReached = bodyRecord?.max_capacity_reached === true || bodyContains(rawBody, '"max_capacity_reached":true');
      if (isCapacityReached) {
        throw new OlostepServerNetworkBusy(details);
      }
      throw new OlostepServerTemporaryIssue(details);
    }
    case 502:
      throw new OlostepServerRequestUnprocessable(details);
    case 503:
      if (isNotEnoughResources) {
        throw new OlostepServerRequestUnprocessable(details);
      }
      throw new OlostepServerTemporaryIssue(details);
    case 504:
      if (bodyContains(rawBody, 'Network error communicating with endpoint')) {
        throw new OlostepServerInternalNetworkIssue(details);
      }
      throw new OlostepServerNoResultInResponse(details);
    default:
      throw new OlostepServerUnknownIssue(status, response);
  }
};

export class OlostepTransport {
  constructor(
    private readonly baseUrl: string,
    private readonly apiKey: string,
    private readonly timeoutMs: number,
    private readonly retry: RetryOptions,
    private readonly userAgent: string
  ) {}

  async request<TData>(input: HttpRequest): Promise<HttpResponse<TData>> {
    let attempts = 0;
    let error: Error | undefined;

    while (attempts <= this.retry.retries) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), this.timeoutMs);
        const url = `${this.baseUrl}${input.path}${buildQueryString(input.query)}`;

        const response = await fetch(url, {
          method: input.method,
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
            'User-Agent': this.userAgent,
            ...input.headers
          },
          body: input.body ? JSON.stringify(input.body) : undefined,
          signal: controller.signal
        });

        clearTimeout(timeout);

        const responseText = await response.text();
        const parsedBody = parseJson(responseText);
        const headers = normalizeHeaders(response.headers);

        if (!response.ok) {
          handleErrorResponse({
            status: response.status,
            body: parsedBody ?? responseText,
            rawBody: responseText,
            headers,
            request: toRequestMetadata(input, url),
            apiKey: this.apiKey
          });
        }

        const data = (parsedBody ?? ({} as TData)) as TData;

        return {
          status: response.status,
          headers,
          data
        };
      } catch (err) {
        error = err as Error;
        const isLastAttempt = attempts === this.retry.retries;

        if (isLastAttempt) {
          if (error.name === 'AbortError') {
            throw new OlostepAPIConnectionError('Request timed out', {cause: error});
          }
          throw new OlostepAPIConnectionError('Failed to reach Olostep API', {cause: error});
        }

        const delay = Math.pow(this.retry.backoffFactor, attempts) * 250;
        await sleep(delay);
        attempts += 1;
      }
    }

    throw error ?? new OlostepAPIConnectionError('Unknown transport failure');
  }
}

