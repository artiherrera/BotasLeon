"use client"

import { useRef, useState } from "react"
import { LocalizedLink as Link } from "@/components/LocalizedLink"
import Image from "next/image"
import { useCart } from "./CartProvider"
import { MarqueeBar } from "./MarqueeBar"
import { MegaMenu } from "./MegaMenu"
import { MobileNav } from "./MobileNav"
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
 * ANCHOS, medidos con la fuente real (Instrument Sans Medium 13px, tracking
 * .08em) y no estimados a ojo:
 *   menú ES en mayúsculas 564 · logo (h-8, 800×220) 116 · conmutador de idioma
 *   117 · botón de 44px ×3 132 · gaps 32+16 · buscador 240.
 * Sin buscador la fila pide 977px y el .contenedor solo deja ancho−80 (2,5rem
 * de aire por lado desde 768px, no 1,5): por eso el menú no aparece hasta
 * 1100px y no a 1024, donde se salía 33px y se montaba sobre el idioma.
 * Con buscador pide 1173 y aparece en xl (1280), que deja 1200. Si se añade
 * un ítem al menú o se ensancha el campo, rehacer esta cuenta.
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
      <MarqueeBar />

      {/* px-3 en el teléfono más angosto que se usa hoy (360px): con los 16px de
          px-4, la bolsa se salía 6px de la pantalla y aparecía barra horizontal.
          El resto de la página conserva los 24px de aire del contenedor. */}
      <div className="contenedor flex h-[72px] items-center gap-1.5 px-3 sm:px-4 md:gap-2 md:px-10 lg:gap-4">
        {/* Hamburguesa — cubre hasta 1100px. Ver la cuenta de anchos en el
            comentario de arriba: a 1024 la fila no cabe. */}
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
        <div className="hidden min-[1100px]:flex min-w-0">
          <MegaMenu />
        </div>

        <div className="ml-auto flex items-center gap-0.5 md:gap-1">
          {/* Buscador visible. Solo desde xl (1280px): a 1100 la fila ya va
              con 43px de holgura y no caben 240 más. Por debajo de xl se
              vuelve a la lupa, que abre el mismo overlay.
              La predicción se queda en el overlay: searchProducts descarga el
              catálogo completo en la primera tecla, y un campo siempre visible
              invitaría a esa descarga en cualquier página. */}
          <form
            role="search"
            action={`/${locale}/search`}
            method="get"
            className="relative mr-1 hidden xl:block"
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
            className="xl:hidden p-3 hover:bg-plate transition-colors duration-[180ms] cursor-pointer"
          >
            <SearchIcon />
          </button>
          <Link
            href="/cuenta"
            aria-label={t("a11y.account")}
            className="p-3 hover:bg-plate transition-colors duration-[180ms]"
          >
            <UserIcon />
          </Link>
          <button
            type="button"
            onClick={openCart}
            aria-label={itemCount > 0 ? `${t("a11y.cart")}: ${itemCount}` : t("a11y.cart")}
            className="p-3 hover:bg-plate transition-colors duration-[180ms] relative cursor-pointer"
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
