import { Header } from "@/components/Header"
import { Footer } from "@/components/Footer"

/**
 * /cuenta — landing de cuenta.
 *
 * Por ahora link a Shopify hosted login (botas-leon-3.myshopify.com/account)
 * que maneja registro, login y "Mis pedidos" sin que tengamos que
 * implementar OAuth. Cuando el sitio crezca, migramos a Customer Account
 * API headless para experiencia integrada.
 */

const SHOPIFY_ACCOUNT_BASE = "https://botas-leon-3.myshopify.com/account"

export default function CuentaPage() {
  return (
    <>
      <Header />
      <main className="flex-1">
        <div className="mx-auto max-w-md px-6 py-20 md:py-28">
          <div className="text-center mb-10">
            <p className="eyebrow text-leather mb-3">Mi cuenta</p>
            <h1 className="font-display text-4xl text-text mb-3">Bienvenido</h1>
            <p className="text-text-muted">
              Inicia sesión para ver tus pedidos, tu dirección de envío y tu
              historial.
            </p>
          </div>

          <div className="space-y-3">
            <a
              href={`${SHOPIFY_ACCOUNT_BASE}/login`}
              className="block w-full py-4 bg-leather text-bg text-center text-sm uppercase tracking-widest hover:bg-text transition-colors"
            >
              Iniciar sesión
            </a>
            <a
              href={`${SHOPIFY_ACCOUNT_BASE}/register`}
              className="block w-full py-4 border border-leather text-leather text-center text-sm uppercase tracking-widest hover:bg-leather hover:text-bg transition-colors"
            >
              Crear cuenta
            </a>
          </div>

          <p className="text-center text-xs text-text-subtle mt-8">
            Tu cuenta es gestionada de forma segura por Shopify, nuestro
            proveedor de pagos y pedidos.
          </p>
        </div>
      </main>
      <Footer />
    </>
  )
}

export const metadata = {
  title: "Mi cuenta — BotasLeón",
}
