import { LocalizedLink as Link } from "@/components/LocalizedLink"
import { Header } from "@/components/Header"
import { Footer } from "@/components/Footer"
import { Localized } from "@/components/Localized"

/**
 * not-found.tsx — 404 branded para todo lo que cuelga de /[lang].
 *
 * Se renderiza cuando un page llama notFound(): producto despublicado, marca
 * inexistente, estilo que ya no existe… Mantiene Header + Footer para que el
 * visitante nunca quede "perdido" sin navegación y ofrece caminos de vuelta al
 * catálogo (Google llega aquí desde URLs viejas indexadas).
 *
 * OJO — este archivo NO puede ser client component ("use client"): en Next 16 el
 * boundary de not-found se resuelve en el servidor, y si el módulo es cliente el
 * SSR se cae al 404 pelón interno de Next (sin header, sin marca). Por eso el
 * idioma se resuelve con <Localized>, que es la isla cliente que sí lee el
 * LocaleProvider del layout.
 *
 * Las URLs que no hacen match con NINGUNA ruta (p.ej. /en/pagina-inventada) no
 * pasan por aquí — esas las atiende app/global-not-found.tsx.
 */
export default function NotFound() {
  return (
    <>
      <Header />
      <main id="contenido" tabIndex={-1} className="flex-1">
        <div className="mx-auto max-w-3xl px-6 py-20 md:py-28">
          <p className="eyebrow text-leather mb-3">Error 404</p>
          <h1 className="font-display text-4xl md:text-5xl text-text mb-4">
            <Localized
              es={<>Esta página no existe</>}
              en={<>This page doesn&apos;t exist</>}
            />
          </h1>
          <p className="text-text-muted max-w-xl mb-10">
            <Localized
              es={
                <>
                  El link que seguiste tiene un typo, o el modelo que buscabas ya
                  no está disponible. Estas botas sí:
                </>
              }
              en={
                <>
                  The link you followed has a typo, or the boot you were looking
                  for is no longer available. These are:
                </>
              }
            />
          </p>

          <div className="flex flex-col sm:flex-row flex-wrap gap-3">
            <Link
              href="/products"
              className="inline-flex items-center justify-center px-6 py-3 bg-text text-bg text-sm hover:bg-leather-light transition-colors"
            >
              <Localized es={<>Ver todo el catálogo</>} en={<>Browse the catalog</>} />
            </Link>
            <Link
              href="/hombre"
              className="inline-flex items-center justify-center px-6 py-3 border border-leather text-leather text-sm hover:bg-text hover:text-bg transition-colors"
            >
              <Localized es={<>Botas hombre</>} en={<>Men&apos;s boots</>} />
            </Link>
            <Link
              href="/mujer"
              className="inline-flex items-center justify-center px-6 py-3 border border-leather text-leather text-sm hover:bg-text hover:text-bg transition-colors"
            >
              <Localized es={<>Botas mujer</>} en={<>Women&apos;s boots</>} />
            </Link>
            <Link
              href="/outlet"
              className="inline-flex items-center justify-center px-6 py-3 border border-leather text-leather text-sm hover:bg-text hover:text-bg transition-colors"
            >
              Outlet
            </Link>
          </div>

          <p className="mt-8 text-sm text-text-muted">
            <Localized
              es={
                <>
                  ¿Buscabas un modelo en particular?{" "}
                  <Link href="/search" className="text-leather underline underline-offset-4">
                    Búscalo por nombre
                  </Link>
                  .
                </>
              }
              en={
                <>
                  Looking for a specific pair?{" "}
                  <Link href="/search" className="text-leather underline underline-offset-4">
                    Search by name
                  </Link>
                  .
                </>
              }
            />
          </p>
        </div>
      </main>
      <Footer />
    </>
  )
}
