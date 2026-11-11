"use client"

import { useT } from "@/lib/i18n/context"
import { isMX } from "@/lib/market"
import { formatMoney } from "@/lib/utils"
import { eventoActual, llaveNombreEvento } from "@/lib/ofertas/config"
import type { Cart } from "@/lib/shopify/types"

/**
 * LO QUE SE MIRA JUSTO ANTES DE PAGAR: cuánto te ahorras y cuánto pagas.
 *
 * El carrito decía las dos cosas en letra de nota al pie. El número que el
 * cliente paga salía a 16px —el mismo tamaño que el texto corriente, más
 * pequeño que el nombre del producto— bajo la palabra "Subtotal", y el ahorro
 * a 14px dentro de una caja de línea punteada que se lee como letra chica. El
 * dueño lo dijo mirando su propio carrito: "el precio total y el descuento
 * deberían verse mucho más grande".
 *
 * Aquí el ahorro va en su propia banda, en el acento de la casa, y el total es
 * el número más grande del cajón (30px). En ese orden: primero lo que te
 * llevas de regalo, después lo que pagas. Al lado del total va el precio de
 * lista tachado, que es lo que vuelve creíble el ahorro.
 *
 * EL AHORRO NO SE PUEDE CALCULAR RESTANDO SUBTOTAL − TOTAL. Con un descuento
 * automático, Shopify entrega el subtotal YA rebajado; esa resta da cero. El
 * ahorro de producto solo está en los `discountAllocations` de cada línea. La
 * resta sí sirve para el descuento de ORDEN (un código), que Shopify aplica
 * después del subtotal. Son dos cosas distintas y se suman una sola vez:
 *
 *     lista = total + ahorro de línea + descuento de código
 *
 * NO SE DICE DOS VECES. Antes la banda llevaba el título del descuento de
 * Shopify —que en esta tienda se llama literalmente "🔥 Hoy te ahorras
 * $1,190"— junto al monto, así que la cifra salía repetida. Peor: con varias
 * botas se pintaba el título de UNA línea al lado de la suma de TODAS, que es
 * una cifra que no corresponde a ese nombre (comprobado contra la Storefront
 * API: tres botas devuelven tres títulos distintos, $170, $190 y $210).
 *
 * MÉXICO DICE "TOTAL"; ESTADOS UNIDOS, "SUBTOTAL". En la .mx el precio lleva
 * IVA y el envío es gratis sin condición, así que ese número es exactamente lo
 * que se cobra. En la .com el envío pasa de $100 USD y lo cotiza el checkout:
 * llamarle "total" sería prometer un precio que no es.
 */

/** Con esto empiezan los códigos que pone el sitio (ver lib/cinto-mitad). */
const PREFIJO_CINTO = "CINTOMITAD-"

type Asignacion = {
  discountedAmount: { amount: string }
  title?: string
  code?: string
}

/**
 * CADA DESCUENTO CON SU NOMBRE Y SU MONTO, sumado por nombre.
 *
 * Antes el resumen enseñaba un solo renglón con la suma de todo y el título
 * del primer descuento. Con la promoción del cinto conviviendo con el
 * "🔥 Hoy te ahorras" de la bota eso quedó corto: dos descuentos distintos
 * bajo un nombre que solo describía uno.
 *
 * El NOMBRE: los descuentos automáticos traen su título de Shopify. Los de
 * código solo traen el código, así que el nuestro —reconocible por el
 * prefijo— se pinta con el nombre de la promoción, y un código escrito por el
 * cliente se pinta con el código, que es como lo conoce.
 *
 * EL MONTO siempre sale de Shopify. Aquí no se calcula ningún precio.
 */
function descuentosDelCarrito(
  cart: Cart | null,
  etiquetaCinto: string,
  nombreTemporada: string
): Array<{ etiqueta: string; monto: number }> {
  if (!cart) return []
  const todas: Asignacion[] = [
    ...((cart.discountAllocations ?? []) as Asignacion[]),
    ...cart.lines.flatMap((l) => (l.discountAllocations ?? []) as Asignacion[]),
  ]
  const porEtiqueta = new Map<string, number>()
  for (const a of todas) {
    const monto = parseFloat(a.discountedAmount?.amount || "0")
    if (!(monto > 0)) continue
    const etiqueta = a.title
      ? limpiaTitulo(a.title, nombreTemporada)
      : a.code?.startsWith(PREFIJO_CINTO)
        ? etiquetaCinto
        : (a.code ?? "")
    if (!etiqueta) continue
    porEtiqueta.set(etiqueta, (porEtiqueta.get(etiqueta) ?? 0) + monto)
  }
  // DE MAYOR A MENOR. El orden natural era el de las líneas del carrito, que
  // no significa nada: en un carrito de bota + cinto el descuento del cinto
  // puede valer $499.50 y el de la bota $190, y quedaba abajo o arriba según
  // en qué orden se hubieran agregado. El que más ahorra se lee primero.
  return [...porEtiqueta.entries()]
    .map(([etiqueta, monto]) => ({ etiqueta, monto }))
    .sort((a, b) => b.monto - a.monto)
}

/**
 * Los descuentos de esta tienda se llaman "🔥 Hoy te ahorras $580": el título
 * YA trae el monto. Puesto al lado de su propia cifra se leería "Hoy te
 * ahorras $580 −$580". Se recorta el monto del final.
 *
 * Y SE LE CAMBIA EL NOMBRE, desde el 2026-11-10. "Hoy te ahorras" era un buen
 * nombre cuando el descuento solo aparecía aquí, en el carrito, como una
 * sorpresa al final. Ahora el precio ya viene rebajado desde la tarjeta y la
 * ficha, así que al llegar al carrito lo que hay que decir no es "hoy te
 * ahorras" otra vez, sino DE DÓNDE sale el descuento: El Buen Fin, Black
 * Friday u Ofertas, según la fecha (ver lib/ofertas/config.ts).
 *
 * El del cinto y los códigos escritos por el cliente NO se tocan: esos tienen
 * nombre propio y el cliente los reconoce.
 */
function limpiaTitulo(titulo: string, nombreTemporada: string): string {
  const sinMonto = titulo.replace(/\s*[-−]?\s*\$\s?[\d.,]+\s*$/, "").trim()
  return /hoy te ahorras|you save today/i.test(sinMonto) ? nombreTemporada : sinMonto
}

export function ResumenPago({
  cart,
  conNota = true,
  className = "",
}: {
  cart: Cart | null
  /** El resumen de /cart ya tiene sus renglones de envío y entrega. */
  conNota?: boolean
  className?: string
}) {
  const t = useT()
  if (!cart) return null

  const moneda = cart.cost.subtotalAmount.currencyCode
  const subtotal = parseFloat(cart.cost.subtotalAmount.amount)
  const total = parseFloat(cart.cost.totalAmount.amount)
  // Descuento de orden (código): Shopify lo aplica DESPUÉS del subtotal.
  const desglose = descuentosDelCarrito(
    cart,
    t("cart.cintoMitad"),
    t(llaveNombreEvento(eventoActual()))
  )
  const ahorro = desglose.reduce((a, d) => a + d.monto, 0)
  const lista = total + ahorro

  return (
    <div className={className}>
      {desglose.length > 0 && (
        <div className="mb-3 space-y-2 border border-leather/40 bg-bg px-3.5 py-3">
          {desglose.map((d) => (
            <div key={d.etiqueta} className="flex items-baseline justify-between gap-3">
              <span className="cuerpo min-w-0 font-medium text-text">{d.etiqueta}</span>
              <span className="precio whitespace-nowrap text-[1.375rem] text-leather">
                −{formatMoney(String(d.monto), moneda)}
              </span>
            </div>
          ))}
          {/* CON DOS O MÁS, LA SUMA. Dos renglones sueltos obligan al cliente
              a hacer la cuenta para saber cuánto se está ahorrando de verdad,
              y en un carrito de bota + cinto esa suma es el argumento. Es lo
              mismo que enseña el checkout de Shopify ("AHORRO TOTAL"). */}
          {desglose.length > 1 && (
            <div className="flex items-baseline justify-between gap-3 border-t border-leather/30 pt-2">
              <span className="cuerpo min-w-0 font-medium text-text">
                {t("cart.ahorroTotal")}
              </span>
              <span className="precio whitespace-nowrap text-[1.375rem] text-leather">
                −{formatMoney(String(ahorro), moneda)}
              </span>
            </div>
          )}
        </div>
      )}

      <div className="flex items-end justify-between gap-3">
        <span className="nav-label text-text-muted">
          {isMX ? t("cart.total") : t("cart.subtotal")}
        </span>
        <span className="flex min-w-0 items-baseline gap-2">
          {ahorro > 0 && (
            <span className="precio text-base font-normal text-text-muted line-through">
              {formatMoney(String(lista), moneda)}
            </span>
          )}
          <span className="precio precio-total text-text">
            {formatMoney(String(total), moneda)}
          </span>
        </span>
      </div>

      {/* CUÁNTO SE AHORRÓ EN ESTE PEDIDO, dicho con todas las letras. El
          tachado de arriba ya lo insinúa y el desglose dice de dónde sale
          cada peso, pero ninguno de los dos pone la cifra del ahorro junto al
          total. Es el número que el cliente repite cuando cuenta la compra. */}
      {ahorro > 0 && (
        <p className="nota mt-1.5 text-right font-medium">
          {t("oferta.ahorraste")} {formatMoney(String(ahorro), moneda)}
        </p>
      )}

      {conNota && (
        <p className="nota mt-1.5 text-right">
          {t(isMX ? "cart.incluye" : "cart.envioAlPagar")}
        </p>
      )}
    </div>
  )
}
