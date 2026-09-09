import { Header } from "./Header"
import { Footer } from "./Footer"
import { T } from "./T"

/**
 * ContentPage — layout compartido para páginas de contenido/política.
 *
 * Usado por /envios, /devoluciones, /nosotros, /terminos, /faq,
 * /guia-tallas, /privacidad, /proveedores y /contacto: nueve páginas que
 * comparten este chrome (header/footer/título/eyebrow) y sólo inyectan su
 * contenido como children.
 *
 * SE QUEDA EN max-w-3xl A PROPÓSITO: así lo pidió el encargo. El resto del
 * sitio pasó a un contenedor de 1440px, y una política a ese ancho daría
 * renglones de más de 200 caracteres.
 *
 * OJO, sin maquillarlo: 48rem NO son los 62 caracteres de `.medida-lectura`.
 * A 15px de cuerpo, 768px dan ~100 caracteres por renglón — sigue por encima
 * de la medida del sistema, aunque muy por debajo del 1440. Solo el intro
 * lleva `.medida-lectura`. Estrechar la columna de las nueve páginas legales
 * mueve la maqueta de todas a la vez, así que se deja como decisión del dueño,
 * no como algo que se cuela en un lote de tipografía.
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
      <main id="contenido" tabIndex={-1} className="flex-1">
        <div className="mx-auto max-w-3xl px-6 py-12 md:py-20">
          <header className="mb-10 pb-8 border-b border-border">
            {eyebrow && (
              <p className="eyebrow text-text-muted mb-3">
                <T k={eyebrow} />
              </p>
            )}
            <h1 className="display-l text-text mb-4">
              <T k={title} />
            </h1>
            {intro && (
              <p className="cuerpo-l medida-lectura text-text-muted">
                <T k={intro} />
              </p>
            )}
          </header>

          {/* Los h2 se quedan en la serif (la hereda la regla base) al tamaño de
              Display M; los h3 bajan a sans 500 de 15px, porque un subtítulo de
              tercer nivel es rótulo de interfaz, no titular. Los ~120 h3 de estas
              nueve páginas eran serif a 18px y competían con sus propios h2.
              El hover de los enlaces era `text-terracotta`, que el tema remapea al
              MISMO #6B4A2E del cuero: no pasaba nada al pasar el cursor. Ahora la
              señal es quitar el subrayado. */}
          <div className="cuerpo max-w-none text-text-muted [&_h2]:text-text [&_h2]:text-[clamp(1.625rem,2.6vw,2rem)] [&_h2]:leading-[1.1] [&_h2]:mt-12 [&_h2]:mb-4 [&_h3]:font-body [&_h3]:font-medium [&_h3]:text-[15px] [&_h3]:leading-snug [&_h3]:text-text [&_h3]:mt-8 [&_h3]:mb-2 [&_p]:mb-4 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-4 [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:mb-4 [&_li]:mb-1 [&_a]:text-leather [&_a]:underline [&_a]:underline-offset-4 [&_a:hover]:no-underline [&_strong]:text-text [&_strong]:font-medium">
            {children}
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
