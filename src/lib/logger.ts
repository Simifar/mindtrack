/* eslint-disable no-console */

type LogLevel = "debug" | "info" | "warn" | "error";

function isStructuredMode(): boolean {
  // В тестах и production логируем структурированно (JSON).
  return process.env.NODE_ENV === "production" || process.env.NODE_ENV === "test";
}

function format(level: LogLevel, message: string, meta?: Record<string, unknown>): string {
  const time = new Date().toISOString();
  if (isStructuredMode()) {
    const entry: Record<string, unknown> = { level, time, message };
    if (meta && Object.keys(meta).length > 0) entry.meta = meta;
    return JSON.stringify(entry);
  }
  const color =
    level === "error" ? "\x1b[31m" :
    level === "warn" ? "\x1b[33m" :
    level === "debug" ? "\x1b[36m" :
    "\x1b[32m";
  const reset = "\x1b[0m";
  const metaStr = meta && Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : "";
  return `${color}[${level.toUpperCase()}] ${time}${reset} ${message}${metaStr}`;
}

function log(level: LogLevel, message: string, meta?: Record<string, unknown>) {
  if (process.env.NODE_ENV === "test" && level === "debug") return;
  const line = format(level, message, meta);
  if (level === "error") {
    console.error(line);
  } else if (level === "warn") {
    console.warn(line);
  } else {
    console.log(line);
  }
}

export interface Logger {
  debug: (message: string, meta?: Record<string, unknown>) => void;
  info: (message: string, meta?: Record<string, unknown>) => void;
  warn: (message: string, meta?: Record<string, unknown>) => void;
  error: (message: string, meta?: Record<string, unknown>) => void;
  child: (extraMeta: Record<string, unknown>) => Logger;
}

function createLogger(baseMeta?: Record<string, unknown>): Logger {
  const child = (extraMeta: Record<string, unknown>): Logger =>
    createLogger({ ...baseMeta, ...extraMeta });

  return {
    debug: (message, meta) => log("debug", message, mergeMeta(baseMeta, meta)),
    info: (message, meta) => log("info", message, mergeMeta(baseMeta, meta)),
    warn: (message, meta) => log("warn", message, mergeMeta(baseMeta, meta)),
    error: (message, meta) => log("error", message, mergeMeta(baseMeta, meta)),
    child,
  };
}

function mergeMeta(
  base?: Record<string, unknown>,
  meta?: Record<string, unknown>
): Record<string, unknown> | undefined {
  if (!base && !meta) return undefined;
  if (!meta) return base;
  if (!base) return meta;
  return { ...base, ...meta };
}

export const logger = createLogger();
