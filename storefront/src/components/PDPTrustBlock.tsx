"use client"

import type { Product } from "@/lib/shopify/types"
import { useLocale, useT } from "@/lib/i18n/context"
import { promesasDeFicha, type Promesa } from "@/lib/promesas"
import { whatsappHref } from "@/lib/whatsapp"

/**
 * Las promesas de venta, bajo los botones de compra.
 *
 * Antes aquí había cuatro íconos genéricos —Cuero 100%, Hecho en León,
 * Garantía 15 días, Pago seguro— dentro de una caja con borde: decían lo mismo
 * en las 103 fichas y no ayudaban a decidir. Los dos que sí son un dato del
 * producto (cuero y origen) bajaron al acordeón "Detalles"; los otros dos eran
 * ruido.
 *
 * Lo que va aquí son razones para comprar HOY, y cada una la decide
 * promesasDeFicha() por mercado y por producto: el envío gratis solo es cierto
 * en México y el cambio de talla solo en los modelos etiquetados en Shopify.
 */

type Props = {
  product: Product
}

export function PDPTrustBlock({ product }: Props) {
  const t = useT()
  const { locale } = useLocale()
  const promesas = promesasDeFicha(product.tags)

  // Mensaje GENÉRICO, el que ya vive en lib/whatsapp.ts en los dos idiomas.
  // Lo suyo sería precargar el modelo ("me interesa la {bota}, ¿qué talla?"),
  // pero ese texto no tiene llave en el diccionario y escribirlo a mano aquí
  // sería inventar una cadena visible en dos idiomas.
  const wa = whatsappHref(locale)

  return (
    <ul className="mt-8 space-y-3.5">
      {promesas.map((p) => (
        <li key={p.llave} className="flex items-start gap-3">
          <Icono nombre={p.icono} />
          <span className="cuerpo text-text">
            {p.icono === "whatsapp" ? (
              <a
                href={wa}
                target="_blank"
                rel="noopener noreferrer"
                className="text-leather underline underline-offset-4 transition-colors duration-[180ms] hover:text-text"
              >
                {t(p.llave)}
              </a>
            ) : (
              t(p.llave)
            )}
            {p.nota && <span className="nota block">{t(p.nota)}</span>}
          </span>
        </li>
      ))}
    </ul>
  )
}

/**
 * Un solo set de trazo: 20px, grosor 1.5, color tinta. En el sitio convivían
 * seis grosores distintos y eso es lo que hacía que un ícono se leyera como
 * decoración y no como parte del mismo idioma.
 */
function Icono({ nombre }: { nombre: Promesa["icono"] }) {
  const comun = {
    width: 20,
    height: 20,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.5,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
    className: "mt-0.5 shrink-0 text-text",
  }

  if (nombre === "whatsapp") {
    return (
      <svg {...comun}>
        <path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 8.9 8.9 0 0 1-3.9-.9L3 20.5l1.6-4.9A8.4 8.4 0 0 1 12 3.1a8.4 8.4 0 0 1 9 8.4Z" />
      </svg>
    )
  }
  if (nombre === "envio") {
    return (
      <svg {...comun}>
        <path d="M3 7h11v9H3z" />
        <path d="M14 10h4l3 3v3h-7z" />
        <circle cx="7" cy="18" r="1.8" />
        <circle cx="17" cy="18" r="1.8" />
      </svg>
    )
  }
  if (nombre === "cambio") {
    return (
      <svg {...comun}>
        <path d="M21 12a9 9 0 1 1-3-6.7L21 8" />
        <path d="M21 3v5h-5" />
      </svg>
    )
  }
  return (
    <svg {...comun}>
      <rect x="3" y="6" width="12" height="12" rx="1.5" />
      <path d="m15 10 6-3v10l-6-3z" />
    </svg>
  )
}
