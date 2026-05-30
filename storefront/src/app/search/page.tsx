import Link from "next/link"
import { Header } from "@/components/Header"
import { Footer } from "@/components/Footer"

export default function SearchPage() {
  return (
    <>
      <Header />
      <main className="flex-1">
        <div className="mx-auto max-w-2xl px-6 py-20 md:py-28 text-center">
          <p className="eyebrow text-leather mb-3">Búsqueda</p>
          <h1 className="font-display text-4xl md:text-5xl text-text mb-4">
            ¿Qué buscas?
          </h1>
          <p className="text-text-muted mb-10">
            La búsqueda inteligente estará disponible pronto. Mientras tanto,
            navega el catálogo completo o explora por categoría.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-10">
            {[
              { label: "Hombre", href: "/hombre" },
              { label: "Mujer", href: "/mujer" },
              { label: "Niños", href: "/nino" },
              { label: "Marcas", href: "/marcas" },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="border border-border py-4 text-sm uppercase tracking-wider hover:border-leather hover:text-leather transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </div>

          <Link
            href="/products"
            className="inline-flex px-8 py-4 bg-leather text-bg text-sm uppercase tracking-widest hover:bg-text transition-colors"
          >
            Ver todas las botas
          </Link>
        </div>
      </main>
      <Footer />
    </>
  )
}

export const metadata = {
  title: "Buscar — BotasLeón",
}
