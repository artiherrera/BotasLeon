"use client"

import { usePathname } from "next/navigation"
import { LocalizedLink as Link } from "@/components/LocalizedLink"
import { useCart } from "@/components/CartProvider"
import { useLocale } from "@/lib/i18n/context"
import { useAltoTeaserKlaviyo } from "@/lib/klaviyo/teaser"
import { whatsappHref, genericWhatsappMessage } from "@/lib/whatsapp"

/**
 * La navegación del teléfono, abajo — como en las apps.
 *
 * El dueño la pidió así (2026-09-25), al estilo de Amazon. El motivo no es la
 * moda: en un teléfono el pulgar llega cómodo al tercio inferior y mal a la
 * esquina superior izquierda, que es justo donde estaba la hamburguesa. Y la
 * cabecera se comía 165px de una pantalla de 844 —un quinto— antes de que se
 * viera una bota.
 *
 * CINCO PESTAÑAS, con WhatsApp dentro, por decisión suya: la mitad de las
 * ventas de esta tienda se cierran por ahí, así que tenerlo a un toque vale
 * más que la pureza de no sacar al cliente del sitio.
 *
 *   Inicio · Explorar (el catálogo) · WhatsApp · Carrito · Menú
 *
 * El buscador NO baja: se queda arriba, que es donde la gente lo busca, y
 * abrirlo desde abajo taparía el teclado media pantalla.
 *
 * Carrito y Menú no navegan: abren el cajón que ya existe. El del carrito por
 * el contexto; el del menú por un evento, para no tener que pasar el estado de
 * MobileNav por media aplicación.
 *
 * SE APILA CON LO QUE YA VIVÍA ABAJO. En la ficha hay una barra de compra
 * pegada, en el carrito un mini resumen, y Klaviyo mete su teaser del 10%.
 * Todos se levantan sobre esta barra con la variable --barra-inferior (ver
 * globals.css), y esta a su vez se levanta sobre el teaser de Klaviyo, que es
 * lo único que no controlamos.
 *
 * Hasta 1100px, igual que la hamburguesa a la que sustituye: a ese ancho la
 * fila del menú de escritorio ya cabe.
 */

const ICONO = "h-6 w-6"

function IconoInicio() {
  return (
    <svg className={ICONO} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5.5 9.5V20a1 1 0 0 0 1 1h11a1 1 0 0 0 1-1V9.5" />
    </svg>
  )
}

function IconoExplorar() {
  return (
    <svg className={ICONO} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="3" y="3" width="7.5" height="7.5" />
      <rect x="13.5" y="3" width="7.5" height="7.5" />
      <rect x="3" y="13.5" width="7.5" height="7.5" />
      <rect x="13.5" y="13.5" width="7.5" height="7.5" />
    </svg>
  )
}

function IconoWhatsapp() {
  return (
    <svg className={ICONO} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M21 11.5a8.5 8.5 0 0 1-12.6 7.4L3.5 20.5l1.6-4.8A8.5 8.5 0 1 1 21 11.5Z" />
      <path d="M8.8 9.2c.3-.7.6-.8 1-.8h.6c.2 0 .4 0 .6.5l.8 1.8c.1.2 0 .4-.1.6l-.5.6c-.1.2-.2.4 0 .6a6 6 0 0 0 2.7 2.3c.3.1.5 0 .6-.1l.6-.7c.2-.2.3-.2.6-.1l1.7.9c.3.1.4.3.4.5 0 .8-.6 1.6-1.4 1.8-.8.2-1.8.2-4-1.1a9 9 0 0 1-3.5-3.7c-.5-1-.6-2.2-.1-3.1Z" />
    </svg>
  )
}

function IconoCarrito() {
  return (
    <svg className={ICONO} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M6 7h12l-1 13H7L6 7Z" />
      <path d="M9 7V5.5a3 3 0 0 1 6 0V7" />
    </svg>
  )
}

function IconoMenu() {
  return (
    <svg className={ICONO} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden>
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  )
}

/** Lo dispara la barra; lo escucha MobileNav para abrir su cajón. */
export const EVENTO_ABRIR_MENU = "botasleon:abrir-menu"

export function BarraInferior() {
  const { t, locale } = useLocale()
  const { itemCount, openCart } = useCart()
  const pathname = usePathname()
  const altoTeaser = useAltoTeaserKlaviyo()

  // La ruta sin el prefijo de idioma, para saber qué pestaña está activa.
  const ruta = (pathname || "/").replace(/^\/(es|en)(?=\/|$)/, "") || "/"
  const enInicio = ruta === "/"
  const enCatalogo = /^\/(products|hombre|mujer|nino|marcas|accesorios|outlet)/.test(ruta)

  const claseTab =
    "flex flex-1 flex-col items-center justify-center gap-1 py-2 min-h-[56px] cursor-pointer transition-colors duration-[180ms]"
  const activo = "text-text"
  const inactivo = "text-text-muted"
  const rotulo = "text-[11px] leading-none tracking-[0.01em]"

  return (
    <nav
      aria-label={t("a11y.nav")}
      className="min-[1100px]:hidden fixed inset-x-0 bottom-[var(--kl-teaser,0px)] z-40 border-t border-border bg-bg pb-[env(safe-area-inset-bottom)]"
      style={
        altoTeaser
          ? ({ "--kl-teaser": `${altoTeaser}px` } as React.CSSProperties)
          : undefined
      }
    >
      <div className="flex items-stretch">
        <Link href="/" className={`${claseTab} ${enInicio ? activo : inactivo}`} aria-current={enInicio ? "page" : undefined}>
          <IconoInicio />
          <span className={rotulo}>{t("tab.inicio")}</span>
        </Link>

        <Link href="/products" className={`${claseTab} ${enCatalogo ? activo : inactivo}`} aria-current={enCatalogo ? "page" : undefined}>
          <IconoExplorar />
          <span className={rotulo}>{t("tab.explorar")}</span>
        </Link>

        {/* Sale del sitio, así que va en <a> con rel de seguridad, no en el
            Link interno. */}
        <a
          href={whatsappHref(locale, genericWhatsappMessage(locale))}
          target="_blank"
          rel="noopener noreferrer"
          className={`${claseTab} ${inactivo}`}
        >
          <IconoWhatsapp />
          <span className={rotulo}>{t("tab.whatsapp")}</span>
        </a>

        <button
          type="button"
          onClick={openCart}
          aria-label={itemCount > 0 ? `${t("a11y.cart")}: ${itemCount}` : t("a11y.cart")}
          className={`${claseTab} ${inactivo} relative`}
        >
          <span className="relative">
            <IconoCarrito />
            {itemCount > 0 && (
              <span className="absolute -right-2 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-text px-1 text-[10px] font-medium text-bg">
                {itemCount > 99 ? "99+" : itemCount}
              </span>
            )}
          </span>
          <span className={rotulo}>{t("tab.carrito")}</span>
        </button>

        <button
          type="button"
          onClick={() => window.dispatchEvent(new Event(EVENTO_ABRIR_MENU))}
          className={`${claseTab} ${inactivo}`}
          aria-label={t("a11y.openMenu")}
        >
          <IconoMenu />
          <span className={rotulo}>{t("tab.menu")}</span>
        </button>
      </div>
    </nav>
  )
}
