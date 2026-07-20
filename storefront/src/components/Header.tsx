"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { useCart } from "./CartProvider"
import { MegaMenu } from "./MegaMenu"
import { MobileNav } from "./MobileNav"
import { SearchOverlay } from "./SearchOverlay"

/**
 * Header del storefront. Sticky con logo, navegación principal,
 * search, cuenta y carrito. Es client component porque el badge del
 * carrito se hidrata desde localStorage en el navegador.
 */
export function Header() {
  const { itemCount, openCart } = useCart()
  const [searchOpen, setSearchOpen] = useState(false)
  const searchBtnRef = useRef<HTMLButtonElement>(null)

  // Estado de scroll: `scrolled` compacta el header + agrega sombra; `hidden`
  // lo oculta al bajar y lo revela al subir (auto-hide). Corre en el navegador;
  // setState con el mismo valor no re-renderiza (bail-out de React).
  const [scrolled, setScrolled] = useState(false)
  const [hidden, setHidden] = useState(false)
  const lastY = useRef(0)

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY
      setScrolled(y > 4)
      setHidden(y > lastY.current && y > 120)
      lastY.current = y
    }
    window.addEventListener("scroll", onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  // Al cerrar, devolvemos focus al botón que abrió el overlay
  // (a11y: keyboard users esperan que el focus vuelva al trigger).
  const closeSearch = () => {
    setSearchOpen(false)
    searchBtnRef.current?.focus()
  }

  return (
    <header
      className={`sticky top-0 z-40 border-b bg-bg/95 backdrop-blur-md transition-transform duration-300 ${
        hidden ? "-translate-y-full" : "translate-y-0"
      } ${scrolled ? "border-border/60 shadow-sm" : "border-border/30"}`}
    >
      <div
        className={`px-4 md:px-6 lg:px-8 flex items-center gap-3 md:gap-8 transition-all duration-300 ${
          scrolled ? "py-2" : "py-4"
        }`}
      >
        {/* Hamburger — solo mobile (md:hidden internamente) */}
        <MobileNav />

        {/* Logo */}
        <Link
          href="/"
          aria-label="BotasLeón — Inicio"
          className="block flex-shrink-0 transition-opacity hover:opacity-80"
        >
          <Image
            src="/logo_botasleon.png"
            alt="BotasLeón"
            width={800}
            height={220}
            loading="eager"
            className={`w-auto transition-all duration-300 ${
              scrolled ? "h-8 md:h-10" : "h-10 md:h-14"
            }`}
          />
        </Link>

        {/* Mega menu — desktop. Mobile usa fallback inline (futuro hamburger) */}
        <MegaMenu />

        {/* Spacer */}
        <div className="flex-1" />

        {/* Search + Cuenta + Cart */}
        <div className="flex items-center gap-2">
          <button
            ref={searchBtnRef}
            type="button"
            aria-label="Buscar"
            onClick={() => setSearchOpen(true)}
            className="p-2 hover:bg-bg-alt rounded transition-colors cursor-pointer"
          >
            <SearchIcon />
          </button>
          <Link
            href="/cuenta"
            aria-label="Mi cuenta"
            className="p-2 hover:bg-bg-alt rounded transition-colors"
          >
            <UserIcon />
          </Link>
          <button
            type="button"
            onClick={openCart}
            aria-label={`Carrito${itemCount > 0 ? `: ${itemCount} artículo${itemCount > 1 ? "s" : ""}` : ""}`}
            className="p-2 hover:bg-bg-alt rounded transition-colors relative cursor-pointer"
          >
            <BagIcon />
            {itemCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-leather text-bg text-[10px] font-medium min-w-[1.125rem] h-[1.125rem] px-1 rounded-full flex items-center justify-center">
                {itemCount > 99 ? "99+" : itemCount}
              </span>
            )}
          </button>
        </div>
      </div>
      <SearchOverlay open={searchOpen} onClose={closeSearch} />
    </header>
  )
}

function SearchIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  )
}

function UserIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  )
}

function BagIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
      <path d="M3 6h18" />
      <path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
  )
}
