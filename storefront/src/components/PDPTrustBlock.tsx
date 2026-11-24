"use client"

import type { Product } from "@/lib/shopify/types"
import { useLocale, useT } from "@/lib/i18n/context"
import { promesasDeFicha, type Promesa } from "@/lib/promesas"
import { DIAS_AVISO_CAMBIO, DIAS_RETRACTO } from "@/lib/exchange"
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
 * en México, y el cambio de talla solo en México y solo en los modelos donde
 * el dueño lo prendió con el metacampo custom.cambio_de_talla.
 */

type Props = {
  product: Product
}

export function PDPTrustBlock({ product }: Props) {
  const t = useT()
  const { locale } = useLocale()
  const promesas = promesasDeFicha(product)

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
          <span
            className={`cuerpo text-text ${p.destacada ? "font-bold" : ""}`}
          >
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
            {/* Los huecos los rellenan lib/entrega.ts y lib/exchange.ts a
                través del diccionario: la nota del envío dice "Entrega
                estimada: 3–7 días hábiles" y la del cambio "Avísanos dentro de
                2 días" sin que ninguna cifra esté escrita aquí. En una nota
                sin el hueco, el replace no hace nada. */}
            {p.nota && (
              <span className="nota block">
                {t(p.nota)
                  .replace("{plazo}", t("envio.plazoCorto"))
                  .replace("{dias}", String(DIAS_AVISO_CAMBIO))
                  .replace("{habiles}", String(DIAS_RETRACTO))}
              </span>
            )}
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
  // Escudo con palomita: la entrega asegurada. Es el mismo gesto que el
  // "Pago seguro" de la barra de avisos, y a propósito: el cliente ya
  // aprendió que un escudo aquí significa "esto está cubierto".
  if (nombre === "escudo") {
    return (
      <svg {...comun}>
        <path d="M12 3 5 5.8v5.4c0 4.1 2.9 7.6 7 8.8 4.1-1.2 7-4.7 7-8.8V5.8L12 3Z" />
        <path d="m9 11.8 2.1 2.1L15 10" />
      </svg>
    )
  }
  // Documento con palomita: la papelería de aduana en orden. No un escudo
  // otra vez ni una bandera: lo que la promesa dice es que los papeles están
  // hechos, y un papel sellado es lo que se reconoce sin leer la frase.
  if (nombre === "aduana") {
    return (
      <svg {...comun}>
        <path d="M14 3H7a1.6 1.6 0 0 0-1.6 1.6v14.8A1.6 1.6 0 0 0 7 21h10a1.6 1.6 0 0 0 1.6-1.6V7.6L14 3Z" />
        <path d="M13.8 3.2v4.4h4.6" />
        <path d="m8.8 14.2 2 2 4-4" />
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
