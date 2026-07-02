"use client"

import { useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import Link from "next/link"
import Image from "next/image"
import { SocialIcons } from "./SocialIcons"

/**
 * MobileNav — hamburger + drawer lateral para navegación mobile.
 *
 * Solo se ve en mobile (md:hidden). Desktop usa MegaMenu.
 *
 * Estructura: TODO desplegado, sin acordeón. Cada categoría grande
 * (HOMBRE / MUJER / NIÑOS) actúa como header de sección, con sus
 * subcategorías visibles debajo. El usuario ve toda la navegación
 * de un vistazo sin tener que hacer tap para expandir nada.
 *
 * Liquid frost: bg-bg/80 + backdrop-blur-3xl + saturate-200
 * (mismo patrón que el Header desktop).
 *
 * No duplicamos accesos que ya viven en el Header (Buscar, Mi
 * cuenta, Carrito están como íconos a la derecha del hamburger).
 */

type SubLink = {
  label: string
  href: string
  description?: string
}

type Category = {
  label: string
  href: string
  sublinks: SubLink[]
  ctaLabel: string
}

const CATEGORIES: Category[] = [
  {
    label: "Hombre",
    href: "/hombre",
    sublinks: [
      { label: "Vaqueras", href: "/hombre/vaqueras", description: "Caña alta, silueta tradicional" },
      { label: "Botines", href: "/hombre/botines", description: "Caña corta, tobillera" },
      { label: "Clásicas", href: "/hombre/clasicas", description: "Caña media, lisas, sin grabado" },
      { label: "Rancho", href: "/hombre/rancho", description: "Faena y campo" },
      { label: "Exóticas", href: "/hombre/exoticas", description: "Avestruz, cocodrilo, pitón" },
    ],
    ctaLabel: "Ver todas las botas de hombre",
  },
  {
    label: "Mujer",
    href: "/mujer",
    sublinks: [
      { label: "Vaqueras", href: "/mujer/vaqueras", description: "Caña alta, silueta tradicional" },
      { label: "Botines", href: "/mujer/botines", description: "Caña corta, tobillera" },
      { label: "Clásicas", href: "/mujer/clasicas", description: "Caña media, lisas, sin grabado" },
      { label: "Largas", href: "/mujer/largas", description: "Sobre la rodilla, fashion" },
      { label: "Exóticas", href: "/mujer/exoticas", description: "Avestruz, cocodrilo, pitón" },
    ],
    ctaLabel: "Ver todas las botas de mujer",
  },
  {
    label: "Accesorios",
    href: "/accesorios",
    sublinks: [
      { label: "Cinturones", href: "/accesorios/cinturones", description: "Piteados, herrajes, hebillas" },
      { label: "Sombreros", href: "/accesorios/sombreros", description: "Vaqueros tradicionales" },
      { label: "Carteras", href: "/accesorios/carteras", description: "Piel grabada y lisa" },
      { label: "Cuidado del cuero", href: "/accesorios/cuidado-del-cuero", description: "Cremas, ceras, betunes" },
    ],
    ctaLabel: "Ver todos los accesorios",
  },
]

const QUICK_LINKS: Array<{ label: string; href: string; highlight?: boolean }> = [
  { label: "Marcas", href: "/marcas" },
  // Outlet oculto hasta que haya productos con compareAtPrice.
  // Para reactivar: { label: "Outlet", href: "/outlet", highlight: true }
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
  const [mounted, setMounted] = useState(false)
  const hamburgerRef = useRef<HTMLButtonElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)

  // El drawer se monta vía portal en document.body para escapar el
  // backdrop-filter del Header. Cualquier ancestro con backdrop-filter,
  // transform, filter, perspective o contain se vuelve containing
  // block de los descendientes `position: fixed`, lo que rompía
  // `h-full` del drawer (medía la altura del Header, no del viewport).
  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = prev
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

  const wasOpenRef = useRef(false)
  useEffect(() => {
    if (!mounted) return
    if (open) {
      wasOpenRef.current = true
      closeButtonRef.current?.focus()
      return
    }
    if (wasOpenRef.current) {
      wasOpenRef.current = false
      hamburgerRef.current?.focus()
    }
  }, [open, mounted])

  const close = () => setOpen(false)

  const drawer = (
    <>
      <div
        onClick={close}
        aria-hidden={!open}
        className={`md:hidden fixed inset-0 bg-black/50 z-50 transition-opacity duration-300 ${
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Navegación"
        inert={!open}
        className={`md:hidden fixed inset-y-0 left-0 w-[90%] max-w-sm bg-bg/85 backdrop-blur-2xl backdrop-saturate-200 supports-[backdrop-filter]:bg-bg/75
          border-r border-leather/15 shadow-2xl
          z-50 flex flex-col transition-transform duration-300 ${
            open ? "translate-x-0" : "-translate-x-full"
          }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border/40">
          <Link
            href="/"
            onClick={close}
            aria-label="BotasLeón — Inicio"
            className="block transition-opacity hover:opacity-80"
          >
            <Image
              src="/logo_botasleon.png"
              alt="BotasLeón"
              width={800}
              height={220}
              className="h-9 w-auto"
            />
          </Link>
          <button
            ref={closeButtonRef}
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
          {/* Categorías — TODO desplegado */}
          <div className="px-5 pt-6 pb-2 space-y-7">
            {CATEGORIES.map((cat) => (
              <section key={cat.label}>
                {/* Header de categoría grande */}
                <Link
                  href={cat.href}
                  onClick={close}
                  className="block mb-3 group"
                >
                  <h3 className="font-display text-2xl text-text group-hover:text-leather transition-colors leading-none">
                    {cat.label}
                  </h3>
                </Link>

                {/* Sublinks visibles siempre */}
                <ul className="space-y-2.5 border-l-2 border-leather/20 pl-4">
                  {cat.sublinks.map((sub) => (
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
                          <span className="block text-[11px] text-text-muted mt-0.5 leading-snug">
                            {sub.description}
                          </span>
                        )}
                      </Link>
                    </li>
                  ))}
                </ul>

                {/* CTA "Ver todas" */}
                <Link
                  href={cat.href}
                  onClick={close}
                  className="mt-3 ml-4 inline-flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-leather hover:text-text transition-colors"
                >
                  <span>{cat.ctaLabel}</span>
                  <span>→</span>
                </Link>
              </section>
            ))}
          </div>

          {/* Quick links: Marcas + Outlet */}
          <div className="px-5 pt-6 pb-2 border-t border-border/40 mt-2">
            {QUICK_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={close}
                className={`block py-3.5 font-display text-xl border-b border-border/30 transition-colors ${
                  link.highlight
                    ? "text-terracotta hover:text-terracotta-dark"
                    : "text-text hover:text-leather"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Ayuda */}
          <div className="px-5 pt-6 pb-2">
            <p className="eyebrow text-text-subtle mb-3 text-[10px]">Ayuda</p>
            <ul className="space-y-0">
              {HELP_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    onClick={close}
                    className="block py-2.5 border-b border-border/25 text-sm text-text-muted hover:text-leather transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Empresa */}
          <div className="px-5 pt-6 pb-8">
            <p className="eyebrow text-text-subtle mb-3 text-[10px]">Empresa</p>
            <ul className="space-y-0">
              {COMPANY_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    onClick={close}
                    className="block py-2.5 border-b border-border/25 text-sm text-text-muted hover:text-leather transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Footer: contacto + redes sociales + branding */}
        <div className="border-t border-border/40 bg-bg-alt/40 px-5 py-5 space-y-3">
          <a
            href="mailto:hola@botasleon.com"
            className="flex items-center gap-3 text-sm text-text hover:text-leather transition-colors"
          >
            <MailIcon />
            <span>hola@botasleon.com</span>
          </a>

          {/* Redes sociales */}
          <div className="text-text-muted hover:[&_a]:text-leather">
            <SocialIcons size="md" />
          </div>

          <p className="text-[11px] text-text-subtle pt-1">
            380 años de tradición · León, Gto.
          </p>
        </div>
      </aside>
    </>
  )

  return (
    <>
      <button
        ref={hamburgerRef}
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Abrir menú"
        aria-expanded={open}
        className="md:hidden p-2 -ml-2 hover:bg-bg-alt rounded transition-colors"
      >
        <HamburgerIcon />
      </button>
      {mounted ? createPortal(drawer, document.body) : null}
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

function MailIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="16" x="2" y="4" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  )
}
