import Link from "next/link"
import { Header } from "@/components/Header"
import { Footer } from "@/components/Footer"
import { pageMetadata } from "@/lib/seo"

export default function OutletPage() {
  return (
    <>
      <Header />
      <main id="contenido" tabIndex={-1} className="flex-1">
        <div className="mx-auto max-w-3xl px-6 py-20 md:py-28 text-center">
          <p className="eyebrow text-terracotta mb-3">Outlet</p>
          <h1 className="font-display text-4xl md:text-5xl text-text mb-4">
            Ofertas y liquidación
          </h1>
          <p className="text-text-muted text-lg mb-10 max-w-xl mx-auto">
            Aún no hay productos en outlet. Cuando rotemos colecciones de
            temporada o tengamos pares con descuento, aparecerán aquí.
          </p>
          <Link
            href="/products"
            className="inline-flex px-8 py-4 bg-leather text-bg text-sm uppercase tracking-widest hover:bg-text transition-colors"
          >
            Ver catálogo completo
          </Link>
        </div>
      </main>
      <Footer />
    </>
  )
}

export const metadata = pageMetadata({
  path: "/outlet",
  title: "Outlet",
  description: "Botas con descuento y ofertas especiales en BotasLeón.",
})
