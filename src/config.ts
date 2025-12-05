export interface RetryOptions {
  retries: number;
  backoffFactor: number;
}

export interface OlostepClientOptions {
  apiKey?: string;
  apiBaseUrl?: string;
  timeoutMs?: number;
  retry?: RetryOptions;
  validateRequests?: boolean;
  userAgent?: string;
  logPath?: string | null;
  logger?: Pick<Console, 'debug' | 'info' | 'warn' | 'error'>;
}

export const SDK_VERSION = process.env.npm_package_version ?? '0.1.0';

const envBaseUrl = process.env.OLOSTEP_BASE_API_URL;
export const DEFAULT_BASE_URL = envBaseUrl && envBaseUrl.trim().length > 0 ? envBaseUrl.trim() : 'https://api.olostep.com/v1';

const envTimeout = Number(process.env.OLOSTEP_API_TIMEOUT);
export const DEFAULT_TIMEOUT_MS = Number.isFinite(envTimeout) && envTimeout > 0 ? envTimeout * 1000 : 150_000;

export const DEFAULT_USER_AGENT =
  process.env.OLOSTEP_USER_AGENT ?? `olostep-sdk/${SDK_VERSION}`;

export const DEFAULT_LOG_PATH = process.env.OLOSTEP_IO_LOG_PATH ?? null;

export const DEFAULT_CLIENT_OPTIONS: Required<
  Pick<
    OlostepClientOptions,
    'apiBaseUrl' | 'timeoutMs' | 'retry' | 'validateRequests' | 'userAgent' | 'logPath'
  >
> = {
  apiBaseUrl: DEFAULT_BASE_URL,
  timeoutMs: DEFAULT_TIMEOUT_MS,
  retry: {
    retries: 3,
    backoffFactor: 2
  },
  validateRequests: true,
  userAgent: DEFAULT_USER_AGENT,
  logPath: DEFAULT_LOG_PATH
};

export const resolveClientOptions = (
  options: OlostepClientOptions = {}
): Required<Omit<OlostepClientOptions, 'logger'>> & { logger?: OlostepClientOptions['logger'] } => {
  const apiKey = options.apiKey ?? process.env.OLOSTEP_API_KEY;

  if (!apiKey) {
    throw new Error(
      'No API key provided. Set the OLOSTEP_API_KEY environment variable or pass apiKey to OlostepClient.'
    );
  }

  return {
    apiKey,
    apiBaseUrl: options.apiBaseUrl ?? DEFAULT_CLIENT_OPTIONS.apiBaseUrl,
    timeoutMs: options.timeoutMs ?? DEFAULT_CLIENT_OPTIONS.timeoutMs,
    retry: options.retry ?? DEFAULT_CLIENT_OPTIONS.retry,
    validateRequests: options.validateRequests ?? DEFAULT_CLIENT_OPTIONS.validateRequests,
    userAgent: options.userAgent ?? DEFAULT_CLIENT_OPTIONS.userAgent,
    logPath: options.logPath ?? DEFAULT_CLIENT_OPTIONS.logPath,
    logger: options.logger
  };
};

