import { Entrar } from "@/components/notas/Entrar"
import { NotaEditor } from "@/components/notas/NotaEditor"
import { pageMetadata } from "@/lib/seo"

/**
 * Sección interna: notas de venta. No se enlaza desde el sitio ni se indexa
 * (robots.ts ya excluye estas rutas); se llega escribiendo la dirección.
 */
export default function NotasPage() {
  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-12">
      <Entrar>
        <h1 className="font-display text-3xl text-text mb-1">Notas de venta</h1>
        <p className="text-sm text-text-muted mb-8">
          Todo es modificable mientras la nota siga en borrador. Al emitirla se
          congela: si algo queda mal, se cancela y se emite otra.
        </p>
        <NotaEditor />
      </Entrar>
    </main>
  )
}

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  return {
    ...pageMetadata({
      locale: lang,
      path: "/notas",
      title: "Notas de venta",
      description: "Sección interna.",
    }),
    robots: { index: false, follow: false },
  }
}
