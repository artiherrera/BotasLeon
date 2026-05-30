"use client"

import Link from "next/link"
import { useCart } from "./CartProvider"

/**
 * Header del storefront. Sticky con logo, navegación principal,
 * search y carrito. Diseño minimalista premium — la marca brilla
 * con el wordmark, no con elementos decorativos.
 *
 * Es client component porque el badge de cart count se actualiza
 * cuando el usuario agrega items.
 */
export function Header() {
  const { cart, openCart } = useCart()
  const count = cart?.totalQuantity ?? 0

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-bg/95 backdrop-blur supports-[backdrop-filter]:bg-bg/80">
      <div className="mx-auto max-w-7xl px-6 py-4 flex items-center gap-8">
        {/* Logo / wordmark */}
        <Link
          href="/"
          className="font-display text-2xl tracking-tight text-leather hover:text-text transition-colors"
        >
          BotasLeón
        </Link>

        {/* Navegación principal */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          <Link href="/hombre" className="hover:text-leather transition-colors">
            Hombre
          </Link>
          <Link href="/mujer" className="hover:text-leather transition-colors">
            Mujer
          </Link>
          <Link href="/ninos" className="hover:text-leather transition-colors">
            Niños
          </Link>
          <Link
            href="/marcas"
            className="hover:text-leather transition-colors"
          >
            Marcas
          </Link>
          <Link
            href="/outlet"
            className="hover:text-terracotta transition-colors"
          >
            Outlet
          </Link>
        </nav>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Search + Cart */}
        <div className="flex items-center gap-3">
          <Link
            href="/search"
            aria-label="Buscar"
            className="p-2 hover:bg-bg-alt rounded transition-colors"
          >
            <SearchIcon />
          </Link>
          <button
            type="button"
            onClick={openCart}
            aria-label={`Carrito${count > 0 ? `: ${count} artículo${count > 1 ? "s" : ""}` : ""}`}
            className="p-2 hover:bg-bg-alt rounded transition-colors relative"
          >
            <BagIcon />
            {count > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-leather text-bg text-[10px] font-medium min-w-[1.125rem] h-[1.125rem] px-1 rounded-full flex items-center justify-center">
                {count > 99 ? "99+" : count}
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

function BagIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
      <path d="M3 6h18" />
      <path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
  )
}
