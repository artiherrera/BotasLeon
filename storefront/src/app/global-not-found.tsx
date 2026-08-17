/* eslint-disable @next/next/no-html-link-for-pages -- Next sirve esta página
   fuera del router (sin layout ni contexto de navegación), así que los enlaces
   tienen que ser <a> de toda la vida: una navegación dura de vuelta al sitio. */
import type { Metadata } from "next"
import { Fraunces, Inter } from "next/font/google"
import "./globals.css"

/**
 * global-not-found.tsx — 404 para URLs que no hacen match con NINGUNA ruta
 * (p.ej. /en/pagina-inventada). Antes caían en el 404 interno de Next: página
 * blanca, sin header ni camino de vuelta.
 *
 * Va aparte de [lang]/not-found.tsx porque Next resuelve estas URLs a nivel de
 * router, sin renderizar layout: este archivo debe traer su propio <html>,
 * <body>, estilos y tipografías. Requiere `experimental.globalNotFound` en
 * next.config.ts.
 *
 * Sin LocaleProvider (no hay layout) → el copy va bilingüe y los links apuntan a
 * /en, que es el idioma por defecto del sitio. Next inyecta noindex y responde
 * 404 automáticamente.
 */

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
})
const inter = Inter({
  variable: "--font-inter",
  weight: ["400", "500", "600"],
  subsets: ["latin"],
  display: "swap",
})

export const metadata: Metadata = {
  title: "404 · BotasLeón",
  description: "This page doesn't exist. / Esta página no existe.",
}

const LINKS = [
  { href: "/en/products", en: "Browse the catalog", es: "Ver el catálogo" },
  { href: "/en/hombre", en: "Men's boots", es: "Botas hombre" },
  { href: "/en/mujer", en: "Women's boots", es: "Botas mujer" },
  { href: "/en/outlet", en: "Outlet", es: "Outlet" },
]

export default function GlobalNotFound() {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-bg text-text">
        <main className="flex-1 mx-auto w-full max-w-3xl px-6 py-20 md:py-28">
          <a href="/en" className="inline-block mb-12">
            {/* eslint-disable-next-line @next/next/no-img-element -- sin layout:
                esta página se sirve suelta y el <img> plano evita depender del
                optimizador de imágenes para un 404. */}
            <img
              src="/logo_botasleon.png"
              alt="BotasLeón"
              width={240}
              height={66}
              className="h-10 w-auto md:h-12"
            />
          </a>

          <p className="eyebrow text-leather mb-3">Error 404</p>
          <h1 className="font-display text-4xl md:text-5xl text-text mb-4">
            This page doesn&apos;t exist
          </h1>
          <p className="text-text-muted max-w-xl mb-2">
            The link you followed has a typo, or the page is no longer available.
          </p>
          <p lang="es" className="text-text-muted max-w-xl mb-10">
            El link que seguiste tiene un typo, o la página ya no está disponible.{" "}
            <a href="/es" className="text-leather underline underline-offset-4">
              Ver el sitio en español
            </a>
            .
          </p>

          <div className="flex flex-col sm:flex-row flex-wrap gap-3">
            {LINKS.map((link, i) => (
              <a
                key={link.href}
                href={link.href}
                className={
                  i === 0
                    ? "inline-flex items-center justify-center px-6 py-3 bg-text text-bg text-sm hover:bg-leather-light transition-colors"
                    : "inline-flex items-center justify-center px-6 py-3 border border-leather text-leather text-sm hover:bg-text hover:text-bg transition-colors"
                }
              >
                {link.en}
              </a>
            ))}
          </div>

          <p className="mt-8 text-sm text-text-muted">
            Looking for a specific pair?{" "}
            <a href="/en/search" className="text-leather underline underline-offset-4">
              Search by name
            </a>
            . Or message us on WhatsApp:{" "}
            <a
              href="https://wa.me/524793032457"
              className="text-leather underline underline-offset-4"
            >
              +52 479 303 2457
            </a>
          </p>
        </main>
      </body>
    </html>
  )
}
