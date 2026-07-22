import { Header } from "@/components/Header"
import { PasswordGate } from "@/components/cotizador/PasswordGate"
import { QuoteBuilder } from "@/components/cotizador/QuoteBuilder"
import { pageMetadata } from "@/lib/seo"

/**
 * /cotizador — herramienta INTERNA de cotización de mayoreo (protegida por
 * contraseña compartida). Estática: el candado + el builder corren en cliente,
 * así la ruta se prerenderiza y Amplify la sirve sin 500. No se enlaza en el
 * nav y va noindex (no debe aparecer en Google).
 */
export default function CotizadorPage() {
  return (
    <>
      <Header />
      <main id="contenido" tabIndex={-1} className="flex-1">
        <PasswordGate>
          <QuoteBuilder />
        </PasswordGate>
      </main>
    </>
  )
}

export const metadata = pageMetadata({
  path: "/cotizador",
  title: "Cotizador de mayoreo",
  description: "Sección interna de BotasLeón.",
  noindex: true,
})
