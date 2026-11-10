"use client"

import { useT } from "@/lib/i18n/context"
import { MESES_MSI } from "@/lib/msi"
import { DESCUENTO_MAXIMO, dosCifras, type CuentaBuenFin } from "@/lib/buenfin"

/**
 * EL BLOQUE DEL BUEN FIN: logo, lo que se ofrece y el cronómetro.
 *
 * Lo pidió el dueño el 2026-11-10: "pon el logo del Buen Fin, y un cintillo
 * (el que siempre usamos) en color rojo, y un cronómetro diciendo para cuándo
 * comienza el Buen Fin. Con descuentos de hasta 30%, meses sin intereses".
 *
 * Va DENTRO de la barra de avisos de siempre, en el hueco donde va la
 * promoción —no es una franja nueva apilada encima—: el cintillo es el mismo,
 * lo que cambia es que se pone rojo mientras dura la campaña. Cuando el Buen
 * Fin termina, la barra vuelve sola a su tinta de siempre.
 */

/**
 * El rojo. No sale del sistema visual del sitio (que es crema y tinta) porque
 * no es del sitio: es de la campaña, y el dueño lo pidió rojo. #C8102E deja el
 * texto blanco en 5.89:1 —AA holgado para texto normal— y el reloj en blanco
 * con las cifras en este mismo rojo da el mismo contraste al revés, que es el
 * truco que ya usa la barra con la crema sobre la tinta.
 */
export const ROJO_BUEN_FIN = "#C8102E"

/**
 * EL LOGO OFICIAL, cuando lo haya.
 *
 * Es marca registrada de CONCANACO SERVYTUR y se descarga del kit que dan a
 * los comercios al registrarse en elbuenfin.org — no es algo que se pueda
 * sacar de internet y meter al repositorio. Mientras no esté, el bloque pinta
 * el nombre con la tipografía del sitio, que es correcto y no inventa una
 * marca ajena.
 *
 * PARA PONERLO: deja el archivo en `storefront/public/buen-fin.png` (o .svg,
 * de preferencia en blanco sobre transparente, que es como se ve sobre el
 * rojo) y cambia este null por "/buen-fin.png". Una línea.
 */
const LOGO_BUEN_FIN: string | null = null

export function BuenFinCintillo({ cuenta }: { cuenta: CuentaBuenFin }) {
  const t = useT()

  const casillas = [
    { n: cuenta.dias, u: t("buenfin.dias") },
    { n: cuenta.horas, u: t("buenfin.horas") },
    { n: cuenta.minutos, u: t("buenfin.minutos") },
    { n: cuenta.segundos, u: t("buenfin.segundos") },
  ]

  return (
    <div
      className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2"
      /* El rótulo del lector de pantalla dice las FECHAS, que es el dato que
         el cronómetro cuenta pero no pronuncia. El reloj en sí va mudo (ver
         aria-live abajo): un contador que se anuncia cada segundo hace
         inservible la página para quien lo escucha. */
      aria-label={t("buenfin.aria")}
    >
      {LOGO_BUEN_FIN ? (
        /* Etiqueta <img> y no next/image a propósito: es un logo fijo y
           pequeño que vive en /public, y pasarlo por el optimizador solo
           añadiría una petición y una variante que nadie necesita. */
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={LOGO_BUEN_FIN}
          alt={t("buenfin.nombre")}
          className="h-7 w-auto shrink-0 md:h-8"
        />
      ) : (
        <span className="text-[15px] font-bold uppercase leading-none tracking-[0.14em] md:text-[17px]">
          {t("buenfin.nombre")}
        </span>
      )}

      {/* Lo que se ofrece. Los meses salen de MESES_MSI y no escritos a mano:
          si mañana la banca da seis y el dueño cambia ese número, esto cambia
          con él en vez de quedarse prometiendo tres. */}
      <p className="text-[13px] font-medium uppercase leading-tight tracking-[0.04em] md:text-[14px]">
        {t("buenfin.oferta")
          .replace("{pct}", String(DESCUENTO_MAXIMO))
          .replace("{meses}", String(MESES_MSI))}
      </p>

      <p className="flex items-center gap-2">
        <span className="text-[11px] uppercase leading-none tracking-[0.12em] opacity-80">
          {cuenta.fase === "antes" ? t("buenfin.empiezaEn") : t("buenfin.terminaEn")}
        </span>
        {/* EL CRONÓMETRO. Cada casilla es blanca con la cifra en rojo: es el
            mismo contraste que el bloque de crema sobre tinta de la barra
            normal, o sea lo más claro sobre lo más oscuro que hay a la vista.
            tabular-nums evita que los dígitos cambien de ancho cada segundo y
            hagan temblar la barra entera. */}
        <span className="flex items-end gap-1" aria-live="off">
          {casillas.map((c) => (
            <span key={c.u} className="flex flex-col items-center">
              <span
                className="min-w-7 rounded-[3px] bg-bg px-1 py-0.5 text-center text-[15px] font-bold leading-none tabular-nums md:text-[16px]"
                style={{ color: ROJO_BUEN_FIN }}
              >
                {dosCifras(c.n)}
              </span>
              <span className="mt-0.5 text-[9px] uppercase leading-none tracking-[0.08em] opacity-80">
                {c.u}
              </span>
            </span>
          ))}
        </span>
      </p>
    </div>
  )
}
