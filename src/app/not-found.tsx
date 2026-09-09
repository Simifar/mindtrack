import Link from "next/link";
export default function NotFound() { return <section className="container section empty-page"><p className="eyebrow">404</p><h1>Страница не найдена</h1><p className="lead narrow">Возможно, адрес устарел или был введён с ошибкой.</p><Link className="button button-primary" href="/">Вернуться в каталог</Link></section>; }
