"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { useLocale } from "@/lib/i18n/context"

/**
 * MegaMenu — navegación principal con dropdowns full-width.
 *
 * Desktop: hover sobre un item con `sections` abre panel debajo del
 * header. ESC cierra. Mouse leave del panel cierra (con pequeño delay
 * para no cerrarse al cruzar el gap).
 *
 * Mobile: el nav se oculta (hidden md:flex) — futuro hamburger menu
 * va a tomar este rol en otro sprint.
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
  href: string
  highlight?: boolean // estilo terracota para "Outlet"
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
        ],
      },
    ],
    ctaHref: "/mujer",
    ctaLabel: "nav.cta.women",
  },
  // Accesorios oculto del nav — aún sin productos dados de alta. Para
  // reactivar cuando los haya, restaurar este item (rutas /accesorios siguen
  // existiendo, solo sin enlazar).
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
        ],
      },
    ],
  },
  {
    label: "nav.outlet",
    href: "/outlet",
    highlight: true, // estilo terracota — resalta como sección de ofertas
  },
  {
    label: "nav.visit",
    href: "/visitanos",
  },
]

const CLOSE_DELAY_MS = 200

export function MegaMenu() {
  const { locale, t } = useLocale()
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
        className="hidden md:flex items-center gap-1 lg:gap-2 font-medium"
        onMouseLeave={scheduleClose}
      >
        {MENU.map((item, idx) => (
          <div
            key={item.label}
            onMouseEnter={() => open(idx)}
            className="relative"
          >
            <Link
              href={item.href}
              className={`relative block px-3.5 py-2 text-[15px] uppercase tracking-[0.1em] transition-colors after:pointer-events-none after:absolute after:inset-x-3.5 after:bottom-1 after:h-[2px] after:origin-left after:scale-x-0 after:bg-leather after:transition-transform after:duration-300 hover:after:scale-x-100 ${
                item.highlight
                  ? "text-terracotta hover:text-terracotta-dark"
                  : "hover:text-leather"
              } ${openIdx === idx ? "text-leather after:scale-x-100" : ""}`}
              aria-expanded={openIdx === idx && !!item.sections}
              aria-haspopup={item.sections ? "true" : undefined}
            >
              {t(item.label)}
            </Link>
            {openIdx === idx && item.sections && (
              <div
                aria-hidden
                className="absolute left-1/2 -translate-x-1/2 -bottom-1 w-2 h-2 rotate-45 bg-bg border-l border-t border-border"
              />
            )}
          </div>
        ))}
        <a
          href={locale === "en" ? "/catalogo-en.pdf" : "/catalogo-es.pdf"}
          target="_blank"
          rel="noopener noreferrer"
          className="relative block px-3.5 py-2 text-[15px] uppercase tracking-[0.1em] transition-colors hover:text-leather"
        >
          {t("catalog.nav")}
        </a>
      </nav>

      {/* Panel desplegable — full-width debajo del header.
          Frost denso: bg-bg/95 SIEMPRE (sin override transparente del
          supports-) + blur para el efecto vidrio esmerilado. Panel
          se ve sólido, solo con un toque de blur del contenido detrás
          en los bordes. Header sí baja a /55 porque es sticky chico,
          el MegaMenu es panel grande y necesita más cuerpo visual. */}
      {showPanel && activeItem && (
        <div
          className="absolute left-0 right-0 top-full
            bg-bg border-b border-border shadow-2xl z-30"
          onMouseEnter={cancelClose}
          onMouseLeave={scheduleClose}
        >
          <div className="mx-auto max-w-7xl px-6 py-8 grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-10">
            {/* Sections — el title del section ("Por estilo") se omite
                porque es redundante con los sub-items que claramente son
                estilos. Si en el futuro hay sections distintas (ej.
                "Por color" / "Por marca" en el mismo dropdown), se puede
                reactivar el título por section. */}
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
                          <span className="text-base font-medium text-text group-hover:text-leather transition-colors">
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

            {/* CTA visual */}
            {activeItem.ctaHref && (
              <Link
                href={activeItem.ctaHref}
                onClick={() => setOpenIdx(null)}
                className="relative group bg-leather text-bg p-8 flex flex-col justify-between min-h-[180px] overflow-hidden"
              >
                <div
                  className="absolute inset-0 opacity-20 mix-blend-overlay pointer-events-none"
                  style={{
                    backgroundImage: `
                      radial-gradient(circle at 30% 20%, rgba(255,255,255,0.4) 0%, transparent 55%),
                      radial-gradient(circle at 70% 80%, rgba(0,0,0,0.4) 0%, transparent 60%)
                    `,
                  }}
                />
                <p className="eyebrow text-gold text-xs relative">
                  {t(activeItem.label)}
                </p>
                <div className="relative">
                  <p className="font-display text-2xl mb-2 leading-tight">
                    {activeItem.ctaLabel ? t(activeItem.ctaLabel) : t("nav.explore")}
                  </p>
                  <span className="inline-flex items-center text-bg/80 text-sm group-hover:text-bg transition-colors">
                    {t("nav.seeAll")}
                    <span className="ml-2 transition-transform group-hover:translate-x-1">
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
