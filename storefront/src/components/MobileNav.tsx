"use client"

import { useEffect, useState } from "react"
import Link from "next/link"

/**
 * MobileNav — hamburger + drawer lateral para navegación mobile.
 *
 * Solo se ve en mobile (md:hidden). Desktop usa MegaMenu.
 *
 * Drawer entra desde la izquierda (85vw, max 24rem). Categorías
 * con sub-items expandibles (acordeón, una abierta a la vez).
 * Footer pegado abajo con Buscar y Mi cuenta.
 *
 * Click backdrop, ESC, o click en link cierran el drawer.
 */

type MenuItem = {
  label: string
  href: string
  highlight?: boolean
  sublinks?: Array<{ label: string; href: string }>
}

const MENU: MenuItem[] = [
  {
    label: "Hombre",
    href: "/hombre",
    sublinks: [
      { label: "Vaqueras", href: "/hombre" },
      { label: "Clásicas", href: "/hombre" },
      { label: "Rancho", href: "/hombre" },
      { label: "Exóticas", href: "/hombre" },
    ],
  },
  {
    label: "Mujer",
    href: "/mujer",
    sublinks: [
      { label: "Vaqueras", href: "/mujer" },
      { label: "Clásicas", href: "/mujer" },
      { label: "Largas", href: "/mujer" },
      { label: "Exóticas", href: "/mujer" },
    ],
  },
  {
    label: "Niños",
    href: "/nino",
    sublinks: [
      { label: "Vaqueras", href: "/nino" },
      { label: "Clásicas", href: "/nino" },
    ],
  },
  { label: "Marcas", href: "/marcas" },
  { label: "Outlet", href: "/outlet", highlight: true },
]

export function MobileNav() {
  const [open, setOpen] = useState(false)
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null)

  // Body scroll lock
  useEffect(() => {
    if (open) document.body.style.overflow = "hidden"
    else document.body.style.overflow = ""
    return () => {
      document.body.style.overflow = ""
    }
  }, [open])

  // ESC cierra
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
      {/* Hamburger button — solo mobile */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Abrir menú"
        aria-expanded={open}
        className="md:hidden p-2 -ml-2 hover:bg-bg-alt rounded transition-colors"
      >
        <HamburgerIcon />
      </button>

      {/* Backdrop */}
      <div
        onClick={close}
        aria-hidden={!open}
        className={`md:hidden fixed inset-0 bg-black/50 z-50 transition-opacity duration-300 ${
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      />

      {/* Drawer */}
      <aside
        aria-label="Navegación"
        aria-hidden={!open}
        className={`md:hidden fixed top-0 left-0 h-full w-[88%] max-w-sm bg-bg/95 backdrop-blur-2xl backdrop-saturate-200 z-50 shadow-2xl flex flex-col transition-transform duration-300 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Header drawer */}
        <div className="flex items-center justify-between px-5 py-5 border-b border-border/50">
          <span className="font-display text-lg text-leather tracking-tight">
            BotasLeón
          </span>
          <button
            type="button"
            onClick={close}
            aria-label="Cerrar menú"
            className="p-2 -mr-2 hover:bg-bg-alt rounded transition-colors"
          >
            <CloseIcon />
          </button>
        </div>

        {/* Nav items */}
        <nav className="flex-1 overflow-y-auto px-5 py-2">
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
                      className="px-4 hover:bg-bg-alt transition-colors flex items-center"
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
                      isExpanded ? "grid-rows-[1fr] pb-3" : "grid-rows-[0fr]"
                    }`}
                  >
                    <ul className="overflow-hidden pl-4 space-y-2">
                      {item.sublinks!.map((sub) => (
                        <li key={sub.label}>
                          <Link
                            href={sub.href}
                            onClick={close}
                            className="block py-1.5 text-sm text-text-muted hover:text-leather transition-colors"
                          >
                            {sub.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )
          })}
        </nav>

        {/* Footer drawer — accesos */}
        <div className="border-t border-border/50 bg-bg-alt/60 px-5 py-4 space-y-1">
          <Link
            href="/search"
            onClick={close}
            className="flex items-center gap-3 py-2.5 text-sm text-text hover:text-leather transition-colors"
          >
            <SearchIcon />
            <span>Buscar</span>
          </Link>
          <Link
            href="/cuenta"
            onClick={close}
            className="flex items-center gap-3 py-2.5 text-sm text-text hover:text-leather transition-colors"
          >
            <UserIcon />
            <span>Mi cuenta</span>
          </Link>
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

function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  )
}

function UserIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  )
}
