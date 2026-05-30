import { Header } from "./Header"
import { Footer } from "./Footer"

/**
 * ContentPage — layout compartido para páginas de contenido/política.
 *
 * Centra contenido legible (max-w-3xl), tipografía heading + body,
 * usado por /envios, /devoluciones, /nosotros, /terminos, etc.
 *
 * Recibe children React para que cada página inyecte su contenido
 * concreto, manteniendo el chrome (header/footer/título/eyebrow)
 * consistente.
 */

type Props = {
  eyebrow?: string
  title: string
  intro?: string
  children: React.ReactNode
}

export function ContentPage({ eyebrow, title, intro, children }: Props) {
  return (
    <>
      <Header />
      <main className="flex-1">
        <div className="mx-auto max-w-3xl px-6 py-12 md:py-20">
          <header className="mb-10 pb-8 border-b border-border">
            {eyebrow && <p className="eyebrow text-leather mb-3">{eyebrow}</p>}
            <h1 className="font-display text-4xl md:text-5xl text-text mb-4">
              {title}
            </h1>
            {intro && (
              <p className="text-lg text-text-muted leading-relaxed">{intro}</p>
            )}
          </header>

          <div className="prose prose-stone max-w-none text-text-muted leading-relaxed [&_h2]:font-heading [&_h2]:text-text [&_h2]:text-2xl [&_h2]:mt-10 [&_h2]:mb-4 [&_h3]:font-heading [&_h3]:text-text [&_h3]:text-lg [&_h3]:mt-6 [&_h3]:mb-2 [&_p]:mb-4 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-4 [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:mb-4 [&_a]:text-leather [&_a:hover]:text-terracotta [&_strong]:text-text">
            {children}
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
