"use client"

import { formatMoney, saleInfo } from "@/lib/utils"
import { useT } from "@/lib/i18n/context"
import { MESES_MSI, mensualidadMsi } from "@/lib/msi"
import { ROJO_OFERTA } from "@/lib/ofertas/config"

/**
 * PriceMSI — precio del producto: total + tachado de oferta + badge de
 * descuento + cuánto se ahorra + mensualidad a meses sin intereses.
 *
 * La mensualidad se había retirado al pasar la tienda a dólares y vuelve con
 * el mercado mexicano, pero solo ahí: la decide `lib/msi.ts` por MERCADO, no
 * por idioma. size="card" (grids) | size="pdp" (más grande + badge).
 *
 * EL ORDEN IMPORTA, y es el que pidió el dueño: el número GRANDE es lo que se
 * paga, el de lista va tachado al lado y debajo va el ahorro en dinero. Un
 * porcentaje es una operación mental; "ahorras $1,589.70" no.
 *
 * LA MENSUALIDAD SE CALCULA SOBRE LO QUE SE PAGA, no sobre el precio de lista
 * —`amount` ya viene con el descuento aplicado desde quien llama—. Si se
 * calculara sobre la lista, el sitio pediría al cliente más al mes de lo que
 * el checkout le va a cobrar.
 */
export function PriceMSI({
  amount,
  currency,
  compareAt,
  ahorro,
  size = "card",
}: {
  amount: string
  currency: string
  compareAt?: string | null
  /** Cuánto se ahorra, en dinero. Sin esto no se pinta el renglón. */
  ahorro?: number | null
  size?: "card" | "pdp"
}) {
  const t = useT()
  const sale = saleInfo(amount, compareAt)
  const isPdp = size === "pdp"
  const porMes = mensualidadMsi(amount, currency)

  return (
    <div className={isPdp ? "leading-none" : ""}>
      {/* LA JERARQUÍA DEL PRECIO EN OFERTA.
          *
          * Hasta el 2026-11-10 el precio rebajado y el tachado medían LO MISMO
          * —los dos a 16px con la clase .precio— y el rebajado iba en marrón.
          * Con eso, una bota de $5,299 a $3,709.30 no se leía como una oferta:
          * se leía como dos números juntos. El dueño lo pidió "más vistoso" y
          * tenía razón.
          *
          * Ahora el número que SE PAGA manda: más grande, en negrita y en el
          * rojo de la temporada; el de lista se encoge y se apaga, que es todo
          * el papel que le queda. Fuera de oferta no cambia NADA: el precio de
          * siempre, en tinta y a su tamaño de siempre.
          *
          * El rojo sobre la crema da 5.50:1 —medido contra #FBF8F1—, holgado
          * para la AA incluso en texto normal, así que no depende del tamaño. */}
      <div
        // .precio = Instrument Sans 600 con tabular-nums; .precio-ficha lo
        // sube a 24px. La serif está prohibida en precios, y sin tabular-nums
        // una columna de precios queda dentada: el "1" mide menos que el "8".
        className={isPdp ? "precio precio-ficha text-text" : "precio text-text"}
      >
        <span
          className={
            sale.onSale
              ? isPdp
                ? "text-[2.25rem] font-bold leading-none"
                : "text-[1.375rem] font-bold leading-none"
              : "text-text"
          }
          style={sale.onSale ? { color: ROJO_OFERTA } : undefined}
        >
          {formatMoney(amount, currency)}
        </span>
        {sale.onSale && compareAt && (
          /* El tachado, un escalón por debajo: su trabajo es dar la medida de
             lo que se baja, no competir con la cifra que se paga. */
          <span
            className={`ml-2 font-normal text-text-subtle line-through ${
              isPdp ? "text-[1.0625rem]" : "text-[0.875rem]"
            }`}
          >
            {formatMoney(compareAt, currency)}
          </span>
        )}
        {isPdp && sale.onSale && (
          <span
            className="ml-2.5 inline-block px-2.5 py-1 align-middle text-[0.9375rem] font-bold uppercase leading-none tracking-[0.04em] text-bg"
            style={{ backgroundColor: ROJO_OFERTA }}
          >
            −{sale.discountPct}%
          </span>
        )}
      </div>
      {/* CUÁNTO TE AHORRAS, en dinero. En la ficha lleva además el porcentaje
          entre paréntesis; en la tarjeta no, porque ahí el porcentaje ya está
          en la insignia de la foto y repetirlo a dos centímetros es ruido. */}
      {/* EL AHORRO, EN EL ROJO Y EN NEGRITA. Iba en gris de nota al pie, del
          tamaño de los meses sin intereses, compitiendo de tú a tú con un dato
          de financiación. "Ahorras $1,589.70" es el argumento, no una
          aclaración. */}
      {sale.onSale && ahorro != null && ahorro > 0 && (
        <p
          className={`font-bold tabular-nums ${
            isPdp ? "mt-2.5 text-[1.0625rem]" : "mt-1.5 text-[0.9375rem]"
          }`}
          style={{ color: ROJO_OFERTA }}
        >
          {t("oferta.ahorras")} {formatMoney(ahorro, currency)}
          {isPdp ? ` (${sale.discountPct}%)` : ""}
        </p>
      )}
      {porMes !== null && (
        <p
          className={isPdp ? "nota mt-2" : "nota mt-1"}
        >
          {MESES_MSI} {t("msi.of")} {formatMoney(porMes, currency, 2)}
        </p>
      )}
    </div>
  )
}
