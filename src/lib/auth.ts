import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { db } from "./db";
import { env } from "./env";

const SESSION_COOKIE = "mt_session";
const SESSION_TTL_DAYS = 30;
const BCRYPT_ROUNDS = 12;
const secret = new TextEncoder().encode(env.JWT_SECRET);

export interface SessionPayload {
  sub: string; // user id
  sid: string; // id записи Session в БД
  email: string;
}

/** Хэширование пароля bcrypt (12 раундов). */
export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, BCRYPT_ROUNDS);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

/** Создаёт запись сессии в БД, выпускает JWT (sub + sid) и кладёт в http-only cookie. */
export async function createSession(userId: string, email: string, userAgent?: string): Promise<void> {
  const expiresAt = new Date(Date.now() + SESSION_TTL_DAYS * 24 * 60 * 60 * 1000);
  const session = await db.session.create({
    data: { userId, expiresAt, userAgent: userAgent?.slice(0, 256) },
  });

  const token = await new SignJWT({ email, sid: session.id })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_DAYS}d`)
    .sign(secret);

  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_DAYS * 24 * 60 * 60,
  });
}

/** Отзывает текущую сессию (revokedAt) и удаляет cookie. */
export async function destroySession(): Promise<void> {
  const session = await getSession();
  if (session) {
    await db.session.updateMany({
      where: { id: session.sid, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

/** Отзывает все активные сессии пользователя, кроме exceptSessionId. */
export async function revokeAllUserSessions(userId: string, exceptSessionId?: string): Promise<void> {
  await db.session.updateMany({
    where: { userId, revokedAt: null, ...(exceptSessionId ? { id: { not: exceptSessionId } } : {}) },
    data: { revokedAt: new Date() },
  });
}

/** Возвращает payload сессии или null. JWT без валидной записи Session в БД не принимается. */
export async function getSession(): Promise<SessionPayload | null> {
  try {
    const store = await cookies();
    const token = store.get(SESSION_COOKIE)?.value;
    if (!token) return null;
    const { payload } = await jwtVerify(token, secret);
    if (!payload.sub || typeof payload.sid !== "string") return null;

    const session = await db.session.findUnique({ where: { id: payload.sid } });
    if (!session || session.revokedAt || session.expiresAt <= new Date()) return null;

    return { sub: payload.sub, sid: payload.sid, email: (payload.email as string) ?? "" };
  } catch {
    return null;
  }
}

/** Текущий пользователь из БД или null. */
export async function getCurrentUser() {
  const session = await getSession();
  if (!session) return null;
  const user = await db.user.findUnique({
    where: { id: session.sub },
    select: {
      id: true,
      email: true,
      timezone: true,
      consentAcceptedAt: true,
      onboardingCompleted: true,
      createdAt: true,
    },
  });
  return user;
}

/** Требует аутентификации — иначе 401. Возвращает пользователя и id сессии. */
export async function requireUser() {
  const session = await getSession();
  if (!session) {
    throw new UnauthorizedError();
  }
  const user = await db.user.findUnique({
    where: { id: session.sub },
    select: {
      id: true,
      email: true,
      timezone: true,
      consentAcceptedAt: true,
      onboardingCompleted: true,
      createdAt: true,
    },
  });
  if (!user) {
    throw new UnauthorizedError();
  }
  return { ...user, sessionId: session.sid };
}

export class UnauthorizedError extends Error {
  status = 401;
  constructor() {
    super("Не авторизован");
  }
}
