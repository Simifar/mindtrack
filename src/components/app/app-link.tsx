"use client";

import * as React from "react";
import { navigate } from "@/lib/routes";

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || "";

/** Канонический вид адреса: проект собран с trailingSlash: true. */
export function canonicalPath(path: string): string {
  const [pathname, search] = path.split("?");
  const base = pathname === "/" || pathname === "" ? "/" : `${pathname.replace(/\/+$/, "")}/`;
  return search ? `${base}?${search}` : base;
}

/**
 * Переход внутри приложения без перезагрузки документа. Модифицированные клики
 * (новая вкладка, копирование ссылки) остаются на усмотрение браузера.
 */
export function handleInternalNav(event: React.MouseEvent<HTMLAnchorElement>, path: string) {
  if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  event.preventDefault();
  navigate(canonicalPath(path));
}

/**
 * Внутренняя ссылка. Остаётся настоящим `<a>` с честным href, но обычный клик
 * идёт через history.pushState. `next/link` здесь не подходит: в статическом
 * экспорте он запрашивает RSC-пейлоады, которых в `out/` нет, и каждая
 * ссылка в зоне видимости получает 404 в консоли.
 */
export function AppLink({
  path,
  onClick,
  ...props
}: Omit<React.ComponentProps<"a">, "href"> & { path: string }) {
  return (
    <a
      href={`${BASE_PATH}${path}`}
      onClick={(event) => {
        onClick?.(event);
        handleInternalNav(event, path);
      }}
      {...props}
    />
  );
}
