"use client"

import { LocalizedLink as Link } from "@/components/LocalizedLink"
import { Header } from "@/components/Header"
import { Footer } from "@/components/Footer"
import { useLocale } from "@/lib/i18n/context"

/**
 * not-found.tsx — 404 branded global.
 *
 * Renderizado cuando ninguna ruta hace match (o cuando un page llama
 * notFound()). Mantiene Header + Footer para que el usuario nunca quede
 * "perdido" sin navegación, y ofrece 3 entradas principales al catálogo.
 *
 * Client component: lee el idioma del contexto (LocaleProvider del layout)
 * para mostrar el 404 en el idioma de la URL (/es o /en).
 */
export default function NotFound() {
  const { locale } = useLocale()
  const isEn = locale === "en"
  return (
    <>
      <Header />
      <main id="contenido" tabIndex={-1} className="flex-1">
        <div className="mx-auto max-w-3xl px-6 py-20 md:py-28">
          <p className="eyebrow text-leather mb-3">Error 404</p>
          <h1 className="font-display text-4xl md:text-5xl text-text mb-4">
            {isEn ? "This page doesn't exist" : "Esta página no existe"}
          </h1>
          <p className="text-text-muted max-w-xl mb-10">
            {isEn
              ? "The link you followed has a typo or is no longer available."
              : "El link que seguiste tiene un typo o ya no está disponible."}
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href="/products"
              className="inline-flex items-center justify-center px-6 py-3 rounded-full bg-leather text-bg text-sm uppercase tracking-wider hover:bg-leather-light transition-colors"
            >
              {isEn ? "Browse the catalog" : "Ver todo el catálogo"}
            </Link>
            <Link
              href="/hombre"
              className="inline-flex items-center justify-center px-6 py-3 rounded-full border border-leather text-leather text-sm uppercase tracking-wider hover:bg-leather hover:text-bg transition-colors"
            >
              {isEn ? "Men's boots" : "Botas hombre"}
            </Link>
            <Link
              href="/mujer"
              className="inline-flex items-center justify-center px-6 py-3 rounded-full border border-leather text-leather text-sm uppercase tracking-wider hover:bg-leather hover:text-bg transition-colors"
            >
              {isEn ? "Women's boots" : "Botas mujer"}
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
