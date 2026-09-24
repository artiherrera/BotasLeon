"use client"

import { useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { LocalizedLink as Link } from "@/components/LocalizedLink"
import Image from "next/image"
import { SocialIcons } from "./SocialIcons"
import { useLocale } from "@/lib/i18n/context"
import { isMX } from "@/lib/market"

/**
 * MobileNav — hamburger + drawer lateral para navegación mobile.
 *
 * Se ve hasta 1100px: de ahí para arriba manda MegaMenu. El corte estaba en
 * md (768px) y luego en lg (1024px), pero medido con la fuente real la fila
 * de la cabecera pide ~977px y a 1024 solo hay 944 (el .contenedor come 40px
 * de aire por lado, no 24). El número exacto y su cuenta están en Header.tsx.
 *
 * Estructura: TODO desplegado, sin acordeón. Cada categoría grande
 * (HOMBRE / MUJER / NIÑOS) actúa como header de sección, con sus
 * subcategorías visibles debajo. El usuario ve toda la navegación
 * de un vistazo sin tener que hacer tap para expandir nada.
 *
 * Panel OPACO + scrim oscuro (bg-black/50) detrás: la versión translúcida
 * se confundía con la página, y el blur creaba un containing block que ya
 * obligó una vez a portar este drawer a document.body.
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

// Los `label`/`description`/`ctaLabel` son LLAVES del diccionario i18n
// (@/lib/i18n/dictionary) — se resuelven con t() al render.
const CATEGORIES: Category[] = [
  {
    label: "nav.men",
    href: "/hombre",
    sublinks: [
      { label: "style.western", href: "/hombre/vaqueras", description: "style.western.desc" },
      { label: "style.booties", href: "/hombre/botines", description: "style.booties.desc" },
      { label: "style.classic", href: "/hombre/clasicas", description: "style.classic.desc" },
      { label: "style.ranch", href: "/hombre/rancho", description: "style.ranch.desc" },
      { label: "style.exotic", href: "/hombre/exoticas", description: "style.exotic.desc" },
    ],
    ctaLabel: "nav.cta.men",
  },
  {
    label: "nav.women",
    href: "/mujer",
    sublinks: [
      { label: "style.western", href: "/mujer/vaqueras", description: "style.western.desc" },
      { label: "style.booties", href: "/mujer/botines", description: "style.booties.desc" },
      { label: "style.classic", href: "/mujer/clasicas", description: "style.classic.desc" },
      { label: "style.tall", href: "/mujer/largas", description: "style.tall.desc" },
      { label: "style.exotic", href: "/mujer/exoticas", description: "style.exotic.desc" },
    ],
    ctaLabel: "nav.cta.women",
  },
  // Solo las sub-categorías CON producto — ver la nota en MegaMenu.
  {
    label: "nav.accessories",
    href: "/accesorios",
    sublinks: [
      { label: "nav.belts", href: "/accesorios/cinturones", description: "nav.belts.desc" },
    ],
    ctaLabel: "nav.cta.accessories",
  },
]

const QUICK_LINKS: Array<{ label: string; href: string }> = [
  { label: "nav.brands", href: "/marcas" },
  { label: "nav.outlet", href: "/outlet" },
  { label: "nav.visit", href: "/visitanos" },
]

const HELP_LINKS = [
  { label: "help.sizeGuide", href: "/guia-tallas" },
  { label: "help.shipping", href: "/envios" },
  { label: "help.returns", href: "/devoluciones" },
  { label: "help.faq", href: "/faq" },
  { label: "help.contact", href: "/contacto" },
]

const COMPANY_LINKS = [
  { label: "company.about", href: "/nosotros" },
  { label: "company.suppliers", href: "/proveedores" },
]

export function MobileNav() {
  const { t } = useLocale()
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const hamburgerRef = useRef<HTMLButtonElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)

  // El drawer se monta vía portal en document.body. Cualquier ancestro con
  // backdrop-filter, transform, filter, perspective o contain se vuelve
  // containing block de los descendientes `position: fixed`, y entonces el
  // alto del drawer mide la cabecera y no el viewport. La cabecera ya no lleva
  // blur, pero el portal es lo que garantiza que no vuelva a pasar.
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
        className={`min-[1100px]:hidden fixed inset-0 bg-black/50 z-50 transition-opacity duration-[180ms] ${
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-label={t("a11y.nav")}
        inert={!open}
        className={`min-[1100px]:hidden fixed inset-y-0 left-0 w-[90%] max-w-sm bg-bg
          border-r border-border
          z-50 flex flex-col transition-transform duration-[180ms] ${
            open ? "translate-x-0" : "-translate-x-full"
          }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <Link
            href="/"
            onClick={close}
            aria-label={t("a11y.home")}
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
            aria-label={t("a11y.closeMenu")}
            className="p-3 -mr-3 hover:bg-plate transition-colors duration-[180ms]"
          >
            <CloseIcon />
          </button>
        </div>

        {/* Value prop band */}
        <div className="bg-plate text-text px-5 py-3 nav-label leading-relaxed">
          <p>{t(isMX ? "promo.shippingMx" : "promo.shipping")}</p>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto">
          {/* Categorías — TODO desplegado */}
          <div className="px-5 pt-6 pb-2 space-y-7">
            {CATEGORIES.map((cat) => (
              <section key={cat.label}>
                {/* Header de categoría grande. font-body NO es decorativo: la
                    regla base de globals.css pone la serif en todo h1–h4, así
                    que sin esta clase el nombre de la categoría sale en
                    Instrument Serif — serif en el menú, justo lo que el
                    sistema prohíbe. */}
                <Link
                  href={cat.href}
                  onClick={close}
                  className="block mb-3 group"
                >
                  <h3 className="font-body text-[18px] font-medium uppercase tracking-[0.08em] text-text leading-none underline-offset-4 group-hover:underline">
                    {t(cat.label)}
                  </h3>
                </Link>

                {/* Sublinks visibles siempre */}
                <ul className="space-y-2.5 border-l border-border pl-4">
                  {cat.sublinks.map((sub) => (
                    <li key={sub.label}>
                      <Link
                        href={sub.href}
                        onClick={close}
                        className="block group"
                      >
                        <span className="block text-sm font-medium text-text underline-offset-4 group-hover:underline">
                          {t(sub.label)}
                        </span>
                        {sub.description && (
                          <span className="block text-xs text-text-muted mt-0.5 leading-snug">
                            {t(sub.description)}
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
                  className="nav-label mt-3 ml-4 inline-flex items-center gap-1.5 text-leather transition-colors duration-[180ms] hover:text-text"
                >
                  <span>{t(cat.ctaLabel)}</span>
                  <span>→</span>
                </Link>
              </section>
            ))}
          </div>

          {/* Quick links: Marcas + Outlet */}
          <div className="px-5 pt-6 pb-2 border-t border-border mt-2">
            {QUICK_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={close}
                className="block py-3.5 text-base font-medium uppercase tracking-[0.08em] text-text border-b border-border underline-offset-4 hover:underline"
              >
                {t(link.label)}
              </Link>
            ))}
            {/* Catálogo — visor HTML (abre en todos los navegadores, no descarga) */}
            <a
              href={isMX ? "/catalogo-es.html" : "/catalogo-en.html"}
              target="_blank"
              rel="noopener noreferrer"
              onClick={close}
              className="block py-3.5 text-base font-medium uppercase tracking-[0.08em] text-text border-b border-border underline-offset-4 hover:underline"
            >
              {t("catalog.nav")}
            </a>
          </div>

          {/* Ayuda */}
          <div className="px-5 pt-6 pb-2">
            <p className="eyebrow text-text-muted mb-3">{t("nav.help")}</p>
            <ul className="space-y-0">
              {HELP_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    onClick={close}
                    className="cuerpo block py-2.5 border-b border-border text-text-muted underline-offset-4 hover:text-text hover:underline"
                  >
                    {t(link.label)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Empresa */}
          <div className="px-5 pt-6 pb-8">
            <p className="eyebrow text-text-muted mb-3">{t("nav.company")}</p>
            <ul className="space-y-0">
              {COMPANY_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    onClick={close}
                    className="cuerpo block py-2.5 border-b border-border text-text-muted underline-offset-4 hover:text-text hover:underline"
                  >
                    {t(link.label)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Footer: contacto + redes sociales + branding */}
        <div className="border-t border-border bg-plate px-5 py-5 space-y-3">
          <a
            href="mailto:contacto@botasleon.com"
            className="cuerpo flex items-center gap-3 text-text underline-offset-4 hover:underline"
          >
            <MailIcon />
            <span>contacto@botasleon.com</span>
          </a>

          {/* Redes sociales */}
          <div className="text-text-muted">
            <SocialIcons size="md" />
          </div>

          <p className="nota pt-1">
            {t("brand.taglineShort")}
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
        aria-label={t("a11y.openMenu")}
        aria-expanded={open}
        className="min-[1100px]:hidden p-3 -ml-3 hover:bg-plate transition-colors duration-[180ms]"
      >
        <HamburgerIcon />
      </button>
      {mounted ? createPortal(drawer, document.body) : null}
    </>
  )
}

function HamburgerIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="4" y1="6" x2="20" y2="6" />
      <line x1="4" y1="12" x2="20" y2="12" />
      <line x1="4" y1="18" x2="20" y2="18" />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  )
}

function MailIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="16" x="2" y="4" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  )
}
