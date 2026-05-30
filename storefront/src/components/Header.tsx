"use client"

import Link from "next/link"
import Image from "next/image"
import { useCart } from "./CartProvider"
import { MegaMenu } from "./MegaMenu"

/**
 * Header del storefront. Sticky con logo, navegación principal,
 * search, cuenta y carrito. Es client component porque el badge del
 * carrito se hidrata desde localStorage en el navegador.
 */
export function Header() {
  const { itemCount, openCart } = useCart()

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-bg/95 backdrop-blur supports-[backdrop-filter]:bg-bg/80 relative">
      <div className="px-4 md:px-6 lg:px-8 py-4 flex items-center gap-6 md:gap-8">
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
            priority
            className="h-12 md:h-14 w-auto"
          />
        </Link>

        {/* Mega menu — desktop. Mobile usa fallback inline (futuro hamburger) */}
        <MegaMenu />

        {/* Spacer */}
        <div className="flex-1" />

        {/* Search + Cuenta + Cart */}
        <div className="flex items-center gap-2">
          <Link
            href="/search"
            aria-label="Buscar"
            className="p-2 hover:bg-bg-alt rounded transition-colors"
          >
            <SearchIcon />
          </Link>
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
