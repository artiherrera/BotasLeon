"use client"

import { useEffect, useRef, useState } from "react"
import { LocalizedLink as Link } from "@/components/LocalizedLink"
import { useLocale } from "@/lib/i18n/context"
import { ROJO_OFERTA, RUTA_OFERTAS, llaveVitrina, hayVitrina } from "@/lib/ofertas/config"
import { DESCUENTO_MAXIMO_REAL } from "@/lib/ofertas/maximo"

/**
 * MegaMenu — navegación principal con dropdowns full-width.
 *
 * Desktop: hover sobre un item con `sections` abre panel debajo del
 * header. ESC cierra. Mouse leave del panel cierra (con pequeño delay
 * para no cerrarse al cruzar el gap).
 *
 * Hasta 1150px el nav se oculta y manda MobileNav. El número está medido, no
 * elegido: con Instrument Sans Medium a 13px y tracking .08em las OCHO
 * etiquetas en mayúsculas miden 728px en español, que es el caso peor, con el
 * padding px-2 y los chevrones. La cuenta entera —logo, gaps y grupo derecho,
 * y por qué el buscador escrito espera hasta 1340— está en Header.tsx, y hay
 * que rehacerla si se añade otro ítem.
 *
 * El padding se queda en px-2 y no px-3: con px-3 la fila pedía 1225 y a 1280
 * solo hay 1200.
 *
 * Las sub-categorías (Vaqueras, Clásicas, etc.) viven en sub-rutas
 * estáticas /hombre/[estilo], /mujer/[estilo], /nino/[estilo] —
 * URLs limpias indexables (sin ?estilo=). El padre /hombre sigue
 * siendo el listado general.
 */

type Section = {
  title: string
  links: Array<{ label: string; href: string; description?: string }>
}

type MenuItem = {
  label: string
  /** Se pinta en el rojo de la temporada y el nombre lo decide la fecha. */
  temporada?: boolean
  href: string
  sections?: Section[]
  ctaHref?: string
  ctaLabel?: string
}

// Los `label`/`description`/`ctaLabel` son LLAVES del diccionario i18n
// (@/lib/i18n/dictionary), no texto literal — se resuelven con t() al render.
const MENU: MenuItem[] = [
  {
    label: "nav.men",
    href: "/hombre",
    sections: [
      {
        title: "nav.byStyle",
        links: [
          { label: "style.western", href: "/hombre/vaqueras", description: "style.western.desc" },
          { label: "style.booties", href: "/hombre/botines", description: "style.booties.desc" },
          { label: "style.classic", href: "/hombre/clasicas", description: "style.classic.desc" },
          { label: "style.ranch", href: "/hombre/rancho", description: "style.ranch.desc" },
          { label: "style.exotic", href: "/hombre/exoticas", description: "style.exotic.desc" },
        ],
      },
    ],
    ctaHref: "/hombre",
    ctaLabel: "nav.cta.men",
  },
  {
    label: "nav.women",
    href: "/mujer",
    sections: [
      {
        title: "nav.byStyle",
        links: [
          { label: "style.western", href: "/mujer/vaqueras", description: "style.western.desc" },
          { label: "style.booties", href: "/mujer/botines", description: "style.booties.desc" },
          { label: "style.classic", href: "/mujer/clasicas", description: "style.classic.desc" },
          { label: "style.tall", href: "/mujer/largas", description: "style.tall.desc" },
          { label: "style.exotic", href: "/mujer/exoticas", description: "style.exotic.desc" },
          // Josepha no es un estilo, es una casa, y va aquí porque sus tres
          // piezas son de mujer: quien abre este menú es a quien le sirve.
          { label: "nav.josepha", href: "/josepha", description: "nav.josepha.desc" },
        ],
      },
    ],
    ctaHref: "/mujer",
    ctaLabel: "nav.cta.women",
  },
  // Solo se enlazan las sub-categorías CON producto. Sombreros, Carteras y
  // Cuidado del cuero existen como ruta pero están vacías: enlazarlas sería
  // mandar al comprador a una página en blanco.
  {
    label: "nav.accessories",
    href: "/accesorios",
    sections: [
      {
        title: "nav.explore",
        links: [
          { label: "nav.belts", href: "/accesorios/cinturones", description: "nav.belts.desc" },
        ],
      },
    ],
    ctaHref: "/accesorios",
    ctaLabel: "nav.cta.accessories",
  },
  {
    label: "nav.brands",
    href: "/marcas",
    sections: [
      {
        title: "nav.brands",
        links: [
          {
            label: "nav.brands.all",
            href: "/marcas",
            description: "nav.brands.desc",
          },
          // La única casa con página propia. Desde aquí se llega a ella y no
          // a /marcas/josepha, que enseña las mismas tres botas con la
          // plantilla de siempre.
          {
            label: "nav.josepha",
            href: "/josepha",
            description: "nav.josepha.desc",
          },
        ],
      },
    ],
  },
  // JOSEPHA, PESTAÑA PROPIA. Lo pidió el dueño el 2026-11-09 —"integra
  // Josepha en la navbar, con la landing que hicimos"— y eligió que además
  // de los dos enlaces de arriba tuviera su propio lugar en la barra. Cuesta
  // ancho: ver la cuenta en el comentario de arriba, que se rehízo al
  // añadirla. Va después de Marcas porque es una casa, no una categoría.
  {
    label: "nav.josepha",
    href: "/josepha",
  },
  {
    label: "nav.combos",
    href: "/combos",
  },
  /**
   * LA PESTAÑA DE TEMPORADA, EN ROJO, EN EL SITIO QUE OCUPABA OUTLET.
   *
   * El dueño lo pidió así (2026-11-10): "en la nav bar quita outlet y ponlo
   * como Buen Fin, incluye el color rojo que ya usamos". Y Outlet no se echa
   * de menos: filtra por precio de comparación, que está vacío en los 110
   * productos, así que llevaba meses enseñando "sin ofertas por ahora". La
   * página sigue existiendo; lo que se va es el enlace que no llevaba a nada.
   *
   * El nombre lo pone llaveVitrina(): "El Buen Fin" hasta que cierre la
   * campaña y después el de la temporada que toque, para que la pestaña no se
   * quede anunciando en enero algo de noviembre.
   */
  {
    label: "nav.outlet",
    href: RUTA_OFERTAS,
    temporada: true,
  },
  {
    label: "nav.visit",
    href: "/visitanos",
  },
]

const CLOSE_DELAY_MS = 200

export function MegaMenu() {
  const { t } = useLocale()
  const [openIdx, setOpenIdx] = useState<number | null>(null)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const cancelClose = () => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current)
      closeTimer.current = null
    }
  }
  const scheduleClose = () => {
    cancelClose()
    closeTimer.current = setTimeout(() => setOpenIdx(null), CLOSE_DELAY_MS)
  }
  const open = (idx: number) => {
    cancelClose()
    setOpenIdx(idx)
  }

  // ESC cierra
  useEffect(() => {
    if (openIdx === null) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenIdx(null)
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [openIdx])

  const activeItem = openIdx !== null ? MENU[openIdx] : null
  const showPanel = activeItem?.sections && activeItem.sections.length > 0

  return (
    <>
      <nav
        className="hidden min-[1150px]:flex items-center"
        onMouseLeave={scheduleClose}
      >
        {MENU.filter((item) => !item.temporada || hayVitrina(DESCUENTO_MAXIMO_REAL)).map((item, idx) => (
          <div
            key={item.label}
            onMouseEnter={() => open(idx)}
            className="relative"
          >
            <Link
              href={item.href}
              onClick={() => setOpenIdx(null)}
              className={`nav-label relative flex items-center gap-1 whitespace-nowrap px-2 py-2 after:pointer-events-none after:absolute after:inset-x-2 after:bottom-1 after:h-px after:origin-left after:scale-x-0 after:transition-transform after:duration-[180ms] hover:after:scale-x-100 ${
                item.temporada ? "font-bold after:bg-current" : "text-text after:bg-text"
              } ${openIdx === idx ? "after:scale-x-100" : ""}`}
              /* El subrayado usa bg-current, así hereda el rojo del propio
                 enlace en vez de llevarlo escrito dos veces. */
              style={item.temporada ? { color: ROJO_OFERTA } : undefined}
              aria-expanded={openIdx === idx && !!item.sections}
              aria-haspopup={item.sections ? "true" : undefined}
            >
              {t(item.temporada ? llaveVitrina() : item.label)}
              {item.sections && (
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                  className={`opacity-60 transition-transform duration-[180ms] ${openIdx === idx ? "rotate-180" : ""}`}
                >
                  <path d="M6 9l6 6 6-6" />
                </svg>
              )}
            </Link>
            {openIdx === idx && item.sections && (
              <div
                aria-hidden
                className="absolute left-1/2 -translate-x-1/2 -bottom-1 w-2 h-2 rotate-45 bg-bg border-l border-t border-border"
              />
            )}
          </div>
        ))}
      </nav>

      {/* Panel desplegable — full-width debajo de la cabecera. Fondo sólido y
          una línea de 1px, sin sombra: la sombra era la única del sistema y
          servía para despegar el panel de un fondo que ya es distinto. */}
      {showPanel && activeItem && (
        <div
          className="absolute left-0 right-0 top-full
            bg-bg border-b border-border z-30"
          onMouseEnter={cancelClose}
          onMouseLeave={scheduleClose}
        >
          <div className="contenedor py-8 grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-10">
            {/* Sections — el title del section ("Por estilo") se omite
                porque es redundante con los sub-items que claramente son
                estilos. Si en el futuro hay sections distintas (ej.
                "Por color" / "Por marca" en el mismo dropdown), se puede
                reactivar el título por section. */}
            <div>
              {/* Enlace destacado al listado completo (ver TODO lo de Hombre /
                  Mujer). Redundante con el CTA de la derecha a propósito: es el
                  target obvio para quien solo quiere el listado general. */}
              <Link
                href={activeItem.href}
                onClick={() => setOpenIdx(null)}
                className="nav-label group mb-6 inline-flex items-center gap-1.5 text-leather transition-colors duration-[180ms] hover:text-text"
              >
                {t(activeItem.ctaLabel ?? "nav.seeAll")}
                <span aria-hidden className="transition-transform group-hover:translate-x-1">→</span>
              </Link>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              {activeItem.sections!.map((section) => (
                <div key={section.title}>
                  <ul className="space-y-3">
                    {section.links.map((link) => (
                      <li key={link.label}>
                        <Link
                          href={link.href}
                          onClick={() => setOpenIdx(null)}
                          className="group block"
                        >
                          <span className="text-base font-medium text-text underline-offset-4 group-hover:underline">
                            {t(link.label)}
                          </span>
                          {link.description && (
                            <span className="block text-xs text-text-muted mt-0.5">
                              {t(link.description)}
                            </span>
                          )}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
              </div>
            </div>

            {/* CTA visual. Era una tarjeta oscura con dos degradados radiales
                encima: segunda superficie oscura del sitio y el único
                degradado que quedaba. Ahora es plato con tinta, que es la
                misma superficie de la foto de producto. */}
            {activeItem.ctaHref && (
              <Link
                href={activeItem.ctaHref}
                onClick={() => setOpenIdx(null)}
                className="group bg-plate text-text p-8 flex flex-col justify-between min-h-[180px]"
              >
                <p className="eyebrow text-text-muted">
                  {t(activeItem.label)}
                </p>
                <div>
                  <p className="text-base font-medium mb-2 leading-tight">
                    {activeItem.ctaLabel ? t(activeItem.ctaLabel) : t("nav.explore")}
                  </p>
                  <span className="nav-label inline-flex items-center text-leather">
                    {t("nav.seeAll")}
                    <span className="ml-2 transition-transform duration-[180ms] group-hover:translate-x-1">
                      →
                    </span>
                  </span>
                </div>
              </Link>
            )}
          </div>
        </div>
      )}
    </>
  )
}
