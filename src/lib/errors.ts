/**
 * Единые ошибки приложения. API-роуты могут использовать status из ошибки
 * для формирования корректного HTTP-ответа.
 */

export class ApiError extends Error {
  status: number;
  details?: unknown;

  constructor(message: string, status = 400, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

export class UnauthorizedError extends Error {
  status = 401;
  constructor() {
    super("Не авторизован");
    this.name = "UnauthorizedError";
  }
}

export class ValidationError extends ApiError {
  constructor(message: string, details?: unknown) {
    super(message, 400, details);
    this.name = "ValidationError";
  }
}

export function isApiError(err: unknown): err is ApiError | UnauthorizedError {
  return err instanceof ApiError || err instanceof UnauthorizedError;
}

export function errorResponse(err: unknown): Response {
  if (isApiError(err)) {
    return Response.json(
      { error: err.message, details: (err as ApiError).details },
      { status: (err as ApiError).status }
    );
  }

  const message = err instanceof Error ? err.message : "Внутренняя ошибка сервера";
  // В продакшене не раскрываем детали непредвиденных ошибок.
  return Response.json({ error: message }, { status: 500 });
}
