import Link from "next/link"
import { Header } from "@/components/Header"
import { Footer } from "@/components/Footer"

/**
 * not-found.tsx — 404 branded global.
 *
 * Renderizado cuando ninguna ruta hace match (o cuando un page llama
 * notFound()). Mantiene Header + Footer para que el usuario nunca quede
 * "perdido" sin navegación, y ofrece 3 entradas principales al catálogo.
 *
 * Server component: 100% static, ningún hook ni handler.
 */
export default function NotFound() {
  return (
    <>
      <Header />
      <main id="contenido" tabIndex={-1} className="flex-1">
        <div className="mx-auto max-w-3xl px-6 py-20 md:py-28">
          <p className="eyebrow text-leather mb-3">Error 404</p>
          <h1 className="font-display text-4xl md:text-5xl text-text mb-4">
            Esta página no existe
          </h1>
          <p className="text-text-muted max-w-xl mb-10">
            El link que seguiste tiene un typo o ya no está disponible.
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href="/products"
              className="inline-flex items-center justify-center px-6 py-3 bg-leather text-bg text-sm uppercase tracking-wider hover:bg-leather-light transition-colors"
            >
              Ver todo el catálogo
            </Link>
            <Link
              href="/hombre"
              className="inline-flex items-center justify-center px-6 py-3 border border-leather text-leather text-sm uppercase tracking-wider hover:bg-leather hover:text-bg transition-colors"
            >
              Botas hombre
            </Link>
            <Link
              href="/mujer"
              className="inline-flex items-center justify-center px-6 py-3 border border-leather text-leather text-sm uppercase tracking-wider hover:bg-leather hover:text-bg transition-colors"
            >
              Botas mujer
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
