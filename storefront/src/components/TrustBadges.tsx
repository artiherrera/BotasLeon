/**
 * TrustBadges — 4 promesas clave de BotasLeón.
 *
 * Patrón estándar de ecommerce: barra horizontal con 4 columnas,
 * cada una con icono + título + subtítulo corto. Refuerza confianza
 * sin gritar. Fondo cream para separarla de las secciones blancas.
 */

const BADGES = [
  {
    Icon: HeritageIcon,
    title: "380 años de experiencia",
    sub: "León, capital mundial del cuero",
  },
  {
    Icon: CurationIcon,
    title: "Curado y verificado",
    sub: "Cada marca pasa nuestro filtro",
  },
  {
    Icon: ShippingIcon,
    title: "Envío MX y USA",
    sub: "Directo desde León",
  },
  {
    Icon: ExchangeIcon,
    title: "Cambio de talla",
    sub: "Sin preguntas, sin costo",
  },
]

export function TrustBadges() {
  return (
    <section className="bg-bg-alt border-y border-border">
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-6">
          {BADGES.map(({ Icon, title, sub }, idx) => (
            <div
              key={idx}
              className="flex flex-col items-center text-center"
            >
              <div className="text-leather mb-3">
                <Icon />
              </div>
              <h3 className="font-heading text-base md:text-lg text-text mb-1 leading-tight">
                {title}
              </h3>
              <p className="text-sm text-text-muted leading-relaxed">{sub}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function HeritageIcon() {
  return (
    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 21h18" />
      <path d="M5 21V8l7-5 7 5v13" />
      <path d="M9 21v-6h6v6" />
      <path d="M10 11h4" />
    </svg>
  )
}

function CurationIcon() {
  return (
    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  )
}

function ShippingIcon() {
  return (
    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 17h14a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2-3H8L6 7H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2Z" />
      <circle cx="8" cy="17" r="2" />
      <circle cx="16" cy="17" r="2" />
    </svg>
  )
}

function ExchangeIcon() {
  return (
    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
      <path d="M21 3v5h-5" />
      <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
      <path d="M3 21v-5h5" />
    </svg>
  )
}
