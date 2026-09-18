import { Prisma } from "@prisma/client";
import { clientIp } from "@/lib/rate-limit";
import { logger, type Logger } from "@/lib/logger";
import { ApiError, UnauthorizedError, ValidationError, errorResponse } from "@/lib/errors";
import { randomUUID } from "crypto";

export interface ApiContext {
  logger: Logger;
  requestId: string;
  ip: string;
  params: Promise<Record<string, string>>;
}

/**
 * Обёртка для API route handlers.
 *
 * Делает три вещи:
 * 1. Логирует входящий запрос: method, pathname, ip, requestId.
 * 2. Ловит и централизованно обрабатывает ошибки (Prisma, ApiError, непредвиденные).
 * 3. Логирует результат: status, duration, requestId.
 *
 * Использование:
 *   export const POST = withApiHandler("auth/login", async (req, { logger }) => { ... });
 *   export const GET = withApiHandler("diary.getByDate", async (req, { logger, params }) => { ... });
 */
export function withApiHandler(
  routeName: string,
  handler: (req: Request, ctx: ApiContext) => Promise<Response> | Response
): (req: Request, routeCtx?: { params?: Promise<Record<string, string>> }) => Promise<Response> {
  return async (req: Request, routeCtx?: { params?: Promise<Record<string, string>> }) => {
    const requestId = randomUUID();
    const url = new URL(req.url);
    const ip = clientIp(req);
    const reqLogger = logger.child({ requestId, route: routeName, ip, method: req.method, path: url.pathname });

    const start = performance.now();
    reqLogger.info("api.request.start", {
      query: url.searchParams.toString() || undefined,
      userAgent: req.headers.get("user-agent") ?? undefined,
    });

    try {
      const res = await handler(req, { logger: reqLogger, requestId, ip, params: routeCtx?.params ?? Promise.resolve({}) });
      const duration = Math.round(performance.now() - start);
      reqLogger.info("api.request.done", { status: res.status, durationMs: duration });
      return res;
    } catch (err) {
      const duration = Math.round(performance.now() - start);

      if (err instanceof ApiError || err instanceof UnauthorizedError || err instanceof ValidationError) {
        reqLogger.warn("api.request.clientError", {
          status: err.status,
          durationMs: duration,
          message: err.message,
        });
        return errorResponse(err);
      }

      if (err instanceof Prisma.PrismaClientInitializationError) {
        reqLogger.error("api.request.dbUnavailable", {
          durationMs: duration,
          message: err.message,
        });
        return Response.json(
          { error: "База данных временно недоступна. Проверьте, что PostgreSQL запущен." },
          { status: 503 }
        );
      }

      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        const { status, message } = mapPrismaError(err);
        reqLogger.error("api.request.dbError", {
          code: err.code,
          durationMs: duration,
          message: err.message,
        });
        return Response.json({ error: message }, { status });
      }

      const message = err instanceof Error ? err.message : "Внутренняя ошибка сервера";
      const stack = err instanceof Error ? err.stack : undefined;
      reqLogger.error("api.request.unexpectedError", {
        durationMs: duration,
        message,
        stack,
        errorName: err instanceof Error ? err.name : typeof err,
      });
      return Response.json({ error: "Внутренняя ошибка сервера" }, { status: 500 });
    }
  };
}

function mapPrismaError(err: Prisma.PrismaClientKnownRequestError): { status: number; message: string } {
  switch (err.code) {
    case "P2002":
      return { status: 409, message: "Запись с такими данными уже существует" };
    case "P2025":
      return { status: 404, message: "Запись не найдена" };
    case "P2003":
      return { status: 400, message: "Некорректная ссылка на связанную запись" };
    case "P2014":
      return { status: 400, message: "Нарушение целостности данных" };
    default:
      return { status: 500, message: "Ошибка базы данных" };
  }
}
