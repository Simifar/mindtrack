import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { db } from "./db";
import { env } from "./env";

const SESSION_COOKIE = "mt_session";
const SESSION_TTL_DAYS = 30;
const secret = new TextEncoder().encode(env.JWT_SECRET);

export interface SessionPayload {
  sub: string; // user id
  email: string;
}

/** Хэширование пароля bcrypt (10 раундов). */
export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

/** Создаёт JWT и кладёт в http-only cookie. */
export async function createSession(userId: string, email: string): Promise<void> {
  const token = await new SignJWT({ email })
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

/** Удаляет сессионную cookie. */
export async function destroySession(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

/** Возвращает payload сессии или null. */
export async function getSession(): Promise<SessionPayload | null> {
  try {
    const store = await cookies();
    const token = store.get(SESSION_COOKIE)?.value;
    if (!token) return null;
    const { payload } = await jwtVerify(token, secret);
    if (!payload.sub) return null;
    return { sub: payload.sub, email: (payload.email as string) ?? "" };
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

/** Требует аутентификации — иначе 401. */
export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) {
    throw new UnauthorizedError();
  }
  return user;
}

export class UnauthorizedError extends Error {
  status = 401;
  constructor() {
    super("Не авторизован");
  }
}
