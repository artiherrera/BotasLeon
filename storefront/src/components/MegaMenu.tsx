"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"

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
 * Las sub-categorías (Vaqueras, Clásicas, etc.) aún no tienen ruta
 * propia (/hombre/vaqueras no existe), así que todos apuntan al
 * padre /hombre por ahora. Cuando construyamos las rutas hijas
 * solo actualizamos hrefs en MENU.
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

const MENU: MenuItem[] = [
  {
    label: "Hombre",
    href: "/hombre",
    sections: [
      {
        title: "Por estilo",
        links: [
          { label: "Vaqueras", href: "/hombre", description: "Caña alta, silueta tradicional" },
          { label: "Clásicas", href: "/hombre", description: "Caña media, lisas, sin grabado" },
          { label: "Rancho", href: "/hombre", description: "Faena y campo" },
          { label: "Exóticas", href: "/hombre", description: "Avestruz, cocodrilo, pitón" },
        ],
      },
    ],
    ctaHref: "/hombre",
    ctaLabel: "Ver todas las botas de hombre",
  },
  {
    label: "Mujer",
    href: "/mujer",
    sections: [
      {
        title: "Por estilo",
        links: [
          { label: "Vaqueras", href: "/mujer", description: "Caña alta, silueta tradicional" },
          { label: "Clásicas", href: "/mujer", description: "Caña media, lisas, sin grabado" },
          { label: "Largas", href: "/mujer", description: "Sobre la rodilla, fashion" },
          { label: "Exóticas", href: "/mujer", description: "Avestruz, cocodrilo, pitón" },
        ],
      },
    ],
    ctaHref: "/mujer",
    ctaLabel: "Ver todas las botas de mujer",
  },
  {
    label: "Niños",
    href: "/nino",
    sections: [
      {
        title: "Por estilo",
        links: [
          { label: "Vaqueras", href: "/nino", description: "Mini-vaqueras" },
          { label: "Clásicas", href: "/nino", description: "Caña media, casual" },
        ],
      },
    ],
    ctaHref: "/nino",
    ctaLabel: "Ver todas las botas de niños",
  },
  {
    label: "Marcas",
    href: "/marcas",
    sections: [
      {
        title: "Curaduría",
        links: [
          {
            label: "Ver todas las marcas",
            href: "/marcas",
            description: "Casas de calzado de León que comercializamos",
          },
        ],
      },
    ],
  },
  {
    label: "Outlet",
    href: "/outlet",
    highlight: true,
  },
]

const CLOSE_DELAY_MS = 150

export function MegaMenu() {
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
        className="hidden md:flex items-center gap-1 text-sm font-medium"
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
              className={`block px-3 py-2 transition-colors ${
                item.highlight
                  ? "text-terracotta hover:text-terracotta-dark"
                  : "hover:text-leather"
              } ${openIdx === idx ? "text-leather" : ""}`}
              aria-expanded={openIdx === idx && !!item.sections}
              aria-haspopup={item.sections ? "true" : undefined}
            >
              {item.label}
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

      {/* Panel desplegable — full-width debajo del header */}
      {showPanel && activeItem && (
        <div
          className="absolute left-0 right-0 top-full bg-bg/85 backdrop-blur-xl backdrop-saturate-150 border-b border-border/50 shadow-xl z-30"
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
                            {link.label}
                          </span>
                          {link.description && (
                            <span className="block text-xs text-text-muted mt-0.5">
                              {link.description}
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
                  {activeItem.label}
                </p>
                <div className="relative">
                  <p className="font-display text-2xl mb-2 leading-tight">
                    {activeItem.ctaLabel ?? "Explorar"}
                  </p>
                  <span className="inline-flex items-center text-bg/80 text-sm group-hover:text-bg transition-colors">
                    Ver todo
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
