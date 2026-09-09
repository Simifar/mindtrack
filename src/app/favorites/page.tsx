import type { Metadata } from "next";
import { FavoritesList } from "@/components/favorites-list";
export const metadata: Metadata = { title: "Избранное", robots: { index: false, follow: false } };
export default function FavoritesPage() { return <section className="container section"><p className="eyebrow">Личная подборка</p><h1>Избранное</h1><p className="lead narrow">Список хранится только в localStorage этого браузера и не отправляется на сервер.</p><FavoritesList /></section>; }
