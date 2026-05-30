import Link from "next/link"

/**
 * Hero principal de la home. Imagen full-width + texto superpuesto
 * a la izquierda. Identidad western/cuero — tono editorial premium,
 * NO gritón. La tipografía Bevan en H1 hace el trabajo de personalidad.
 *
 * Imagen de fondo placeholder mientras el usuario sube la real. El
 * patrón con CSS gradient sobre color base mantiene look profesional
 * sin foto.
 */
export function Hero() {
  return (
    <section className="relative w-full h-[70vh] min-h-[500px] max-h-[720px] overflow-hidden bg-leather">
      {/* Background pattern — sustituir con foto real cuando esté */}
      <div
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage: `
            radial-gradient(circle at 20% 50%, rgba(139, 58, 36, 0.4) 0%, transparent 50%),
            radial-gradient(circle at 80% 30%, rgba(188, 123, 60, 0.3) 0%, transparent 50%),
            radial-gradient(circle at 50% 80%, rgba(75, 46, 31, 0.6) 0%, transparent 60%)
          `,
        }}
      />

      <div className="absolute inset-0 bg-gradient-to-r from-leather/90 via-leather/60 to-transparent" />

      {/* Contenido */}
      <div className="relative h-full mx-auto max-w-7xl px-6 flex items-center">
        <div className="max-w-xl">
          <p className="eyebrow text-gold mb-4">León, Guanajuato · Desde 1950</p>
          <h1 className="font-display text-bg text-5xl md:text-6xl lg:text-7xl mb-6 leading-[1.05]">
            El western<br />
            también se<br />
            viste en la ciudad.
          </h1>
          <p className="text-bg-alt text-lg leading-relaxed mb-8 max-w-md">
            Botas premium fabricadas a mano en León. Tradición artesanal mexicana
            con calidad de exportación. Envíos a todo México y Estados Unidos.
          </p>
          <div className="flex gap-3">
            <Link
              href="/products"
              className="inline-flex items-center px-8 py-4 bg-bg text-leather font-medium rounded-sm hover:bg-bg-alt transition-colors"
            >
              Ver colección
            </Link>
            <Link
              href="/marcas"
              className="inline-flex items-center px-8 py-4 border border-bg/40 text-bg font-medium rounded-sm hover:bg-bg/10 transition-colors"
            >
              Nuestras marcas
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
