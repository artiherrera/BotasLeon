import Link from "next/link"
import { Header } from "@/components/Header"
import { Footer } from "@/components/Footer"

/**
 * /cart — placeholder. La funcionalidad real del carrito (líneas,
 * subtotales, checkout link) llega en el siguiente push con cart
 * client-side. Por ahora muestra estado vacío + link al catálogo,
 * para que el link del header no rompa.
 */
export default function CartPage() {
  return (
    <>
      <Header />
      <main className="flex-1">
        <div className="mx-auto max-w-2xl px-6 py-20 md:py-28 text-center">
          <div className="w-20 h-20 mx-auto mb-6 text-text-subtle">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
              <path d="M3 6h18" />
              <path d="M16 10a4 4 0 0 1-8 0" />
            </svg>
          </div>
          <p className="eyebrow text-leather mb-3">Tu carrito</p>
          <h1 className="font-display text-3xl md:text-4xl text-text mb-3">
            Tu carrito está vacío
          </h1>
          <p className="text-text-muted mb-10 max-w-md mx-auto">
            Cuando agregues botas las verás aquí. Estamos finalizando la
            experiencia de carrito — pronto podrás agregar, ajustar tallas y
            proceder al pago.
          </p>
          <Link
            href="/products"
            className="inline-flex px-8 py-4 bg-leather text-bg text-sm uppercase tracking-widest hover:bg-text transition-colors"
          >
            Ver catálogo
          </Link>
        </div>
      </main>
      <Footer />
    </>
  )
}

export const metadata = {
  title: "Carrito — BotasLeón",
}
