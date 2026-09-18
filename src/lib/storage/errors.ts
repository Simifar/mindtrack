export type StorageErrorCode = "unavailable" | "read" | "write" | "quota" | "parse";

export class StorageError extends Error {
  constructor(
    message: string,
    public readonly code: StorageErrorCode,
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = "StorageError";
  }
}

export function isStorageError(error: unknown): error is StorageError {
  return error instanceof StorageError;
}
