/**
 * Barra de avisos del sitio. UN mensaje y UN enlace, quietos.
 *
 * Antes era una marquesina negra con cuatro mensajes en bucle: cuatro
 * promesas rotando roban la atención de la portada y ninguna se lee entera
 * (la línea que te interesa ya se fue). Aquí queda un solo mensaje, el que de
 * verdad decide la compra en cada mercado, sobre el plato y con la misma
 * línea de 1px que separa la cabecera.
 *
 * El mensaje y el destino los resuelve AVISO (src/lib/promesas.ts) por
 * MERCADO, no por idioma: botasleon.com/es vende a Estados Unidos, y "envío
 * gratis a toda la República" ahí sería una promesa falsa.
 *
 * Conserva el nombre MarqueeBar aunque ya no haya marquesina: el archivo
 * todavía lo importa la portada, y renombrarlo desde aquí la rompería.
 */

"use client"

import { LocalizedLink as Link } from "@/components/LocalizedLink"
import { useT } from "@/lib/i18n/context"
import { AVISO } from "@/lib/promesas"

export function MarqueeBar() {
  const t = useT()

  return (
    <div className="bg-plate border-b border-border-plate">
      {/* Alto MÍNIMO de 36px, no fijo, y el mensaje envuelve en vez de cortarse.
          Medido con la fuente real a 13px: el aviso de EE.UU. mide 361px y el
          de México 299, más el enlace; en un teléfono de 360px el .contenedor
          deja 312 de ancho útil, así que con `truncate` la única promesa de la
          cabecera salía cortada con puntos suspensivos en TODOS los teléfonos.
          En escritorio cabe en un renglón y la barra sigue midiendo 36px. */}
      <div className="contenedor flex min-h-9 flex-wrap items-center justify-center gap-x-2 py-1.5 text-center">
        <p className="text-[13px] leading-snug text-text">{t(AVISO.texto)}</p>
        <Link
          href={AVISO.enlace}
          className="text-[13px] leading-snug text-text underline underline-offset-4 whitespace-nowrap transition-colors duration-[180ms] hover:text-leather"
        >
          {t(AVISO.enlaceTexto)}
        </Link>
      </div>
    </div>
  )
}
