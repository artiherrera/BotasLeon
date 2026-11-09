"use client"

import { useRef, useState } from "react"
import { LocalizedLink as Link } from "@/components/LocalizedLink"
import Image from "next/image"
import { useCart } from "./CartProvider"
import { BarraAvisos } from "./BarraAvisos"
import { MegaMenu } from "./MegaMenu"
import { MobileNav } from "./MobileNav"
import { BarraInferior } from "./BarraInferior"
import { SearchOverlay } from "./SearchOverlay"
import { LocaleToggle } from "./LocaleToggle"
import { useLocale } from "@/lib/i18n/context"

/**
 * Cabecera del storefront: barra de avisos, logo, navegación, buscador,
 * idioma, cuenta y bolsa. Client component porque el contador de la bolsa se
 * hidrata desde localStorage.
 *
 * Alto FIJO de 72px. Antes oscilaba entre 89 y 57px al hacer scroll (py-4→py-2
 * y logo h-14→h-10) y encima se escondía al bajar: la página daba un salto en
 * cada scroll y el buscador desaparecía justo cuando el comprador lo buscaba.
 * Ahora se queda quieta, pegada arriba, separada por una línea de 1px.
 *
 * La barra de avisos vive AQUÍ y no en el layout porque <Header/> lo monta
 * cada página (15 archivos bajo src/app), no el layout: metida aquí sale en
 * las quince y no hay que tocarlas una por una.
 *
 * ANCHOS, medidos en el navegador con la fuente real (Instrument Sans Medium
 * 13px, tracking .08em) y no estimados a ojo. Última medición: 2026-11-09, al
 * añadir Josepha al menú.
 *
 *   logo 116 · menú ES en mayúsculas 728 (Hombre 95 · Mujer 80 · Accesorios
 *   127 · Marcas 94 · Josepha 83 · Combos 81 · Outlet 74 · Visítanos 94) ·
 *   grupo derecho 140 sin buscador, 340 con él · dos gaps de 16.
 *
 * El .contenedor deja ancho−80 (2,5rem de aire por lado desde 768px). Sin
 * buscador la fila pide 1016, así que a 1100 sobran 4px: demasiado poco para
 * un ítem más o para una fuente que cargue distinta. El menú entra en 1150,
 * donde sobran 54. Con buscador pide 1216 y a 1280 sobran CERO, así que el
 * campo escrito espera hasta 1340 (sobran 44); por debajo queda la lupa, que
 * abre el mismo buscador.
 *
 * ES es el caso peor: en inglés el menú mide unos 30px menos ("Men" contra
 * "Hombre" se come lo que crece "Accessories").
 *
 * Si se añade un ítem al menú o se ensancha el campo, REHACER ESTA CUENTA:
 * los dos números de arriba (1150 y 1340) salen de ella y viven, además de
 * aquí, en MegaMenu, MobileNav, BarraInferior y globals.css.
 */
export function Header() {
  const { itemCount, openCart } = useCart()
  const { locale, t } = useLocale()
  const [searchOpen, setSearchOpen] = useState(false)
  const searchBtnRef = useRef<HTMLButtonElement>(null)
  const searchFieldRef = useRef<HTMLInputElement>(null)

  // Quién abrió el overlay, para devolverle el foco al cerrar (a11y: quien
  // navega con teclado espera volver al control que tocó).
  const origen = useRef<"campo" | "boton">("boton")
  // Al cerrar devolvemos el foco al campo, y ese foco volvería a abrir el
  // overlay: esta bandera se come exactamente ese primer evento.
  const omitirFoco = useRef(false)

  const abrirDesdeCampo = () => {
    if (omitirFoco.current) {
      omitirFoco.current = false
      return
    }
    // El overlay tiene su propio input y se autoenfoca; dejar el foco también
    // aquí atrapado detrás del modal confunde al lector de pantalla.
    searchFieldRef.current?.blur()
    origen.current = "campo"
    setSearchOpen(true)
  }

  const closeSearch = () => {
    setSearchOpen(false)
    if (origen.current === "campo") {
      omitirFoco.current = true
      searchFieldRef.current?.focus()
    } else {
      searchBtnRef.current?.focus()
    }
  }

  return (
    <header className="sticky top-0 z-40 bg-bg border-b border-border">
      <BarraAvisos />

      {/* px-3 en el teléfono más angosto que se usa hoy (360px): con los 16px de
          px-4, la bolsa se salía 6px de la pantalla y aparecía barra horizontal.
          El resto de la página conserva los 24px de aire del contenedor. */}
      {/* 56px de alto en el teléfono, 72 desde tablet. Con la navegación abajo,
          aquí solo quedan el logo y el buscador: 72 era alto de cabecera con
          seis controles, no con dos. Se recuperan 16px de bota a la vista. */}
      <div className="contenedor flex h-14 md:h-[72px] items-center gap-1.5 px-3 sm:px-4 md:gap-2 md:px-10 lg:gap-4">
        {/* Hamburguesa — cubre hasta 1150px. Ver la cuenta de anchos en el
            comentario de arriba. */}
        <MobileNav />

        <Link
          href="/"
          aria-label={t("a11y.home")}
          className="block flex-shrink-0 transition-opacity duration-[180ms] hover:opacity-80"
        >
          <Image
            src="/logo_botasleon.png"
            alt="BotasLeón"
            width={800}
            height={220}
            loading="eager"
            className="h-[26px] md:h-8 w-auto"
          />
        </Link>

        {/* Navegación pegada al logo. Deja de estar centrada a propósito: el
            grid de tres columnas gastaba en la columna izquierda el mismo
            ancho que en la derecha, y con eso el buscador visible no cabía en
            ninguna pantalla. */}
        <div className="hidden min-[1150px]:flex min-w-0">
          <MegaMenu />
        </div>

        <div className="ml-auto flex items-center gap-0.5 md:gap-1">
          {/* Buscador visible. Solo desde 1340px: con Josepha en el menú, a
              1280 la fila queda exactamente a cero y el campo empujaría la
              bolsa fuera de la pantalla. Por debajo se vuelve a la lupa, que
              abre el mismo overlay.
              La predicción se queda en el overlay: searchProducts descarga el
              catálogo completo en la primera tecla, y un campo siempre visible
              invitaría a esa descarga en cualquier página. */}
          <form
            role="search"
            action={`/${locale}/search`}
            method="get"
            className="relative mr-1 hidden min-[1340px]:block"
          >
            <input
              ref={searchFieldRef}
              type="search"
              name="q"
              onFocus={abrirDesdeCampo}
              placeholder={t("search.headerPlaceholder")}
              aria-label={t("a11y.search")}
              autoComplete="off"
              className="campo h-10 w-60 pr-9"
            />
            {/* La lupa va DENTRO del campo, a la derecha, como en la referencia:
                sin ella la caja se lee como un campo de correo cualquiera. Es
                decorativa —el campo ya tiene su aria-label y su role de
                búsqueda—, así que no recibe foco ni se anuncia dos veces. */}
            <span
              aria-hidden
              className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-text-muted"
            >
              <SearchIcon />
            </span>
          </form>

          {/* El cambio de idioma se queda en la barra: en botasleon.com es la
              única puerta para la diáspora que entra en inglés y compra en
              español. En la .mx no se pinta (IS_MULTILINGUAL). */}
          <LocaleToggle className="mr-0.5 md:mr-1" />

          <button
            ref={searchBtnRef}
            type="button"
            aria-label={t("a11y.search")}
            onClick={() => {
              origen.current = "boton"
              setSearchOpen(true)
            }}
            className="min-[1340px]:hidden p-3 hover:bg-plate transition-colors duration-[180ms] cursor-pointer"
          >
            <SearchIcon />
          </button>
          {/* Cuenta y bolsa solo en escritorio: en el teléfono viven en la
              barra de abajo, y repetirlas arriba era ruido y confusión sobre
              cuál es "la de verdad". */}
          <Link
            href="/cuenta"
            aria-label={t("a11y.account")}
            className="hidden min-[1150px]:block p-3 hover:bg-plate transition-colors duration-[180ms]"
          >
            <UserIcon />
          </Link>
          <button
            type="button"
            onClick={openCart}
            aria-label={itemCount > 0 ? `${t("a11y.cart")}: ${itemCount}` : t("a11y.cart")}
            className="hidden min-[1150px]:flex p-3 hover:bg-plate transition-colors duration-[180ms] relative cursor-pointer"
          >
            <BagIcon />
            {itemCount > 0 && (
              <span className="absolute top-1 right-1 bg-text text-bg text-xs font-medium min-w-5 h-5 px-1 rounded-full flex items-center justify-center">
                {itemCount > 99 ? "99+" : itemCount}
              </span>
            )}
          </button>
        </div>
      </div>
      <SearchOverlay open={searchOpen} onClose={closeSearch} />
      {/* La navegación del teléfono. Va aquí porque la cabecera ya es cliente y
          tiene el carrito a mano; al ser `fixed`, su sitio en el árbol da igual. */}
      <BarraInferior />
    </header>
  )
}

// Un solo set de íconos: trazo de 20px a 1.5. Antes convivían seis grosores.
function SearchIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  )
}

function UserIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  )
}

function BagIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
      <path d="M3 6h18" />
      <path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
  )
}
