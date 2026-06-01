"use client"

import { useEffect, useState } from "react"
import Link from "next/link"

/**
 * MobileNav — hamburger + drawer lateral para navegación mobile.
 *
 * Solo se ve en mobile (md:hidden). Desktop usa MegaMenu.
 *
 * Espeja la estructura del MegaMenu (mismos sections, mismas
 * descriptions, mismo CTA "Ver todas las botas de X") para que la
 * experiencia mobile y desktop sean equivalentes. No duplicamos
 * accesos que ya viven en el Header desktop (Buscar, Mi cuenta,
 * Carrito) — sus íconos están a la derecha del hamburger.
 *
 * Liquid frost: bg-bg/80 + backdrop-blur-3xl + saturate-200. Con
 * supports-[backdrop-filter] bajamos a /65 para que el frosted se
 * note más cuando el navegador soporta blur; sin soporte queda en
 * /80 más opaco para que siga siendo legible.
 *
 * Estructura del drawer (de arriba a abajo):
 *  1. Header con wordmark + close
 *  2. Value prop band (MSI · envío)
 *  3. Catálogo (mismo que MegaMenu — acordeón con descriptions + CTA)
 *  4. Ayuda
 *  5. Empresa
 *  6. Footer contacto
 */

type SubLink = {
  label: string
  href: string
  description?: string
}

type MenuItem = {
  label: string
  href: string
  highlight?: boolean
  sublinks?: SubLink[]
  ctaLabel?: string
  ctaHref?: string
}

const MENU: MenuItem[] = [
  {
    label: "Hombre",
    href: "/hombre",
    sublinks: [
      { label: "Vaqueras", href: "/hombre", description: "Caña alta, silueta tradicional" },
      { label: "Clásicas", href: "/hombre", description: "Caña media, lisas, sin grabado" },
      { label: "Rancho", href: "/hombre", description: "Faena y campo" },
      { label: "Exóticas", href: "/hombre", description: "Avestruz, cocodrilo, pitón" },
    ],
    ctaLabel: "Ver todas las botas de hombre",
    ctaHref: "/hombre",
  },
  {
    label: "Mujer",
    href: "/mujer",
    sublinks: [
      { label: "Vaqueras", href: "/mujer", description: "Caña alta, silueta tradicional" },
      { label: "Clásicas", href: "/mujer", description: "Caña media, lisas, sin grabado" },
      { label: "Largas", href: "/mujer", description: "Sobre la rodilla, fashion" },
      { label: "Exóticas", href: "/mujer", description: "Avestruz, cocodrilo, pitón" },
    ],
    ctaLabel: "Ver todas las botas de mujer",
    ctaHref: "/mujer",
  },
  {
    label: "Niños",
    href: "/nino",
    sublinks: [
      { label: "Vaqueras", href: "/nino", description: "Mini-vaqueras" },
      { label: "Clásicas", href: "/nino", description: "Caña media, casual" },
    ],
    ctaLabel: "Ver todas las botas de niños",
    ctaHref: "/nino",
  },
  { label: "Marcas", href: "/marcas" },
  { label: "Outlet", href: "/outlet", highlight: true },
]

const HELP_LINKS = [
  { label: "Guía de tallas", href: "/guia-tallas" },
  { label: "Envíos", href: "/envios" },
  { label: "Devoluciones", href: "/devoluciones" },
  { label: "Preguntas frecuentes", href: "/faq" },
  { label: "Contacto", href: "/contacto" },
]

const COMPANY_LINKS = [
  { label: "Nosotros", href: "/nosotros" },
  { label: "Proveedores", href: "/proveedores" },
]

export function MobileNav() {
  const [open, setOpen] = useState(false)
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null)

  useEffect(() => {
    if (open) document.body.style.overflow = "hidden"
    else document.body.style.overflow = ""
    return () => {
      document.body.style.overflow = ""
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false)
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [open])

  const close = () => {
    setOpen(false)
    setExpandedIdx(null)
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Abrir menú"
        aria-expanded={open}
        className="md:hidden p-2 -ml-2 hover:bg-bg-alt rounded transition-colors"
      >
        <HamburgerIcon />
      </button>

      <div
        onClick={close}
        aria-hidden={!open}
        className={`md:hidden fixed inset-0 bg-black/50 z-50 transition-opacity duration-300 ${
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      />

      <aside
        aria-label="Navegación"
        aria-hidden={!open}
        className={`md:hidden fixed top-0 left-0 h-full w-[88%] max-w-sm
          bg-bg/80 backdrop-blur-3xl backdrop-saturate-200
          supports-[backdrop-filter]:bg-bg/65
          border-r border-leather/15 shadow-2xl
          z-50 flex flex-col transition-transform duration-300 ${
            open ? "translate-x-0" : "-translate-x-full"
          }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border/40">
          <span className="font-display text-xl text-leather tracking-tight">
            BotasLeón
          </span>
          <button
            type="button"
            onClick={close}
            aria-label="Cerrar menú"
            className="p-2 -mr-2 hover:bg-bg-alt/70 rounded transition-colors"
          >
            <CloseIcon />
          </button>
        </div>

        {/* Value prop band */}
        <div className="bg-leather text-bg px-5 py-3 text-[11px] uppercase tracking-wider leading-relaxed">
          <p>3, 6 y 9 meses sin intereses</p>
          <p className="text-bg/70">Envío a todo MX y USA</p>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto">
          {/* Catálogo — espeja MegaMenu */}
          <nav className="px-5 pt-5 pb-2">
            <p className="eyebrow text-text-subtle mb-2 text-[10px]">Catálogo</p>
            {MENU.map((item, idx) => {
              const isExpanded = expandedIdx === idx
              const hasSubs = item.sublinks && item.sublinks.length > 0
              return (
                <div key={item.label} className="border-b border-border/40">
                  <div className="flex items-stretch">
                    <Link
                      href={item.href}
                      onClick={close}
                      className={`flex-1 py-4 text-base font-medium ${
                        item.highlight
                          ? "text-terracotta"
                          : "text-text hover:text-leather"
                      } transition-colors`}
                    >
                      {item.label}
                    </Link>
                    {hasSubs && (
                      <button
                        type="button"
                        onClick={() => setExpandedIdx(isExpanded ? null : idx)}
                        aria-label={`${isExpanded ? "Contraer" : "Expandir"} ${item.label}`}
                        aria-expanded={isExpanded}
                        className="px-4 hover:bg-bg-alt/60 transition-colors flex items-center"
                      >
                        <ChevronIcon
                          className={`transition-transform ${isExpanded ? "rotate-180" : ""}`}
                        />
                      </button>
                    )}
                  </div>
                  {hasSubs && (
                    <div
                      className={`grid overflow-hidden transition-all duration-300 ${
                        isExpanded ? "grid-rows-[1fr] pb-4" : "grid-rows-[0fr]"
                      }`}
                    >
                      <div className="overflow-hidden">
                        <ul className="pl-1 space-y-3 pt-1">
                          {item.sublinks!.map((sub) => (
                            <li key={sub.label}>
                              <Link
                                href={sub.href}
                                onClick={close}
                                className="block group"
                              >
                                <span className="block text-sm font-medium text-text group-hover:text-leather transition-colors">
                                  {sub.label}
                                </span>
                                {sub.description && (
                                  <span className="block text-xs text-text-muted mt-0.5">
                                    {sub.description}
                                  </span>
                                )}
                              </Link>
                            </li>
                          ))}
                        </ul>
                        {item.ctaHref && item.ctaLabel && (
                          <Link
                            href={item.ctaHref}
                            onClick={close}
                            className="mt-4 inline-flex items-center gap-2 text-xs uppercase tracking-wider text-leather hover:text-text transition-colors"
                          >
                            <span>{item.ctaLabel}</span>
                            <span className="transition-transform group-hover:translate-x-0.5">→</span>
                          </Link>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </nav>

          {/* Ayuda */}
          <div className="px-5 pt-6 pb-2">
            <p className="eyebrow text-text-subtle mb-2 text-[10px]">Ayuda</p>
            {HELP_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={close}
                className="block py-2.5 border-b border-border/30 text-sm text-text-muted hover:text-leather transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Empresa */}
          <div className="px-5 pt-6 pb-6">
            <p className="eyebrow text-text-subtle mb-2 text-[10px]">Empresa</p>
            {COMPANY_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={close}
                className="block py-2.5 border-b border-border/30 text-sm text-text-muted hover:text-leather transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Footer: contacto + branding */}
        <div className="border-t border-border/40 bg-bg-alt/40 px-5 py-5 space-y-3">
          <a
            href="mailto:hola@botasleon.com"
            className="flex items-center gap-3 text-sm text-text hover:text-leather transition-colors"
          >
            <MailIcon />
            <span>hola@botasleon.com</span>
          </a>
          <p className="text-[11px] text-text-subtle pt-1">
            380 años de tradición · León, Gto.
          </p>
        </div>
      </aside>
    </>
  )
}

function HamburgerIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="4" y1="6" x2="20" y2="6" />
      <line x1="4" y1="12" x2="20" y2="12" />
      <line x1="4" y1="18" x2="20" y2="18" />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  )
}

function ChevronIcon({ className = "" }: { className?: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="m6 9 6 6 6-6" />
    </svg>
  )
}

function MailIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="16" x="2" y="4" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  )
}
