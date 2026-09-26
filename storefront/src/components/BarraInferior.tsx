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

/**
 * LOS ICONOS SALEN DEL SET QUE YA USA EL SITIO, no de mi mano.
 *
 * La primera versión los dibujé yo y el dueño fue claro: "los iconos te
 * quedaron horribles". Con razón: una casa de dos trazos que no cerraban,
 * cuatro cuadrados de esquina viva y un WhatsApp inventado a ojo. Aquí van los
 * que el sitio ya tenía probados —la bolsa de la cabecera (Header), las tres
 * rayas del menú (MobileNav) y el glifo oficial de WhatsApp (SocialIcons)— y
 * para Inicio y Explorar los de Lucide, que es el set del que salió el resto.
 *
 * Tres reglas para que la fila se lea de una pieza: mismo lienzo de 24, mismo
 * trazo de 1.5 y puntas redondas. La única excepción es WhatsApp: es marca
 * ajena y va RELLENO, así que se dibuja un punto más pequeño —un glifo macizo
 * pesa casi el doble que uno de línea puesto al lado.
 *
 * Explorar lleva brújula y no una rejilla de cuadros: la rejilla no dice qué
 * hay dentro, y no puede ser una lupa porque el buscador se queda arriba y dos
 * lupas en una pantalla se leen como dos buscadores.
 */

const ICONO = "h-6 w-6"

function IconoInicio() {
  return (
    <svg className={ICONO} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8" />
      <path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    </svg>
  )
}

function IconoExplorar() {
  return (
    <svg className={ICONO} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="12" cy="12" r="9.25" />
      {/* La aguja va RELLENA y con las puntas vivas. En línea y con las
          juntas redondas —que es como la dibuja Lucide— a 24px se lee como una
          hoja dentro de un círculo, no como una aguja: comprobado en pantalla
          dos veces. */}
      <path d="M15.9 8.1 13.6 13.6 8.1 15.9 10.4 10.4Z" fill="currentColor" stroke="none" />
    </svg>
  )
}

function IconoWhatsapp() {
  // El glifo oficial, el mismo de SocialIcons. Relleno y a 22px para que no
  // pese más que sus vecinos de línea.
  return (
    <svg className="h-[22px] w-[22px]" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0 0 20.885 3.488" />
    </svg>
  )
}

function IconoCarrito() {
  // La misma bolsa de la cabecera, para que sea el mismo carrito.
  return (
    <svg className={ICONO} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
      <path d="M3 6h18" />
      <path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
  )
}

function IconoMenu() {
  // Las tres rayas que traía la hamburguesa a la que sustituye esta pestaña.
  return (
    <svg className={ICONO} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <line x1="4" y1="6" x2="20" y2="6" />
      <line x1="4" y1="12" x2="20" y2="12" />
      <line x1="4" y1="18" x2="20" y2="18" />
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
