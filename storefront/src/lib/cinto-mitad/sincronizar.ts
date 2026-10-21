import "server-only"

import { CART_FRAGMENT } from "@/lib/cart/client"
import { inContext, isMX } from "@/lib/market"
import type { Cart } from "@/lib/shopify/types"
import { CODIGOS_CINTO, TODOS_LOS_CODIGOS, codigoDeCinto } from "./config"

/**
 * PONE Y QUITA EL CÓDIGO DEL CINTO A MITAD. Corre en el servidor.
 *
 * Qué hace, en una frase: si en el carrito hay al menos una bota y al menos un
 * cinto de la promoción, aplica el código del cinto MÁS CARO que haya; si deja
 * de cumplirse, lo quita. Nada más.
 *
 * REGLAS QUE NO SON OBVIAS:
 *
 *  - UN CINTO A MITAD POR PEDIDO, aunque haya tres botas y dos cintos. Así
 *    está configurada la promoción en Shopify (monto fijo, una vez por
 *    pedido), y el sitio no debe prometer más de lo que la caja cumple.
 *  - SE ELIGE EL CINTO MÁS CARO porque el descuento es un monto fijo por
 *    código: con un Caporal y un Jinete en el carrito, el código del Caporal
 *    descuenta $699.50 y el del Jinete $499.50. Al comprador le conviene el
 *    primero.
 *  - LOS CÓDIGOS DEL CLIENTE SE RESPETAN. `cartDiscountCodesUpdate` reemplaza
 *    la lista COMPLETA, así que se reconstruye: todo lo que no sea nuestro se
 *    conserva tal cual, y encima se agrega (o no) el nuestro.
 *  - SOLO MÉXICO. En el despliegue de Estados Unidos esto no corre: ahí no
 *    existe la promoción y aplicar un código mexicano sería cobrar de menos.
 *  - SI NADA CAMBIA, NO SE LLAMA A SHOPIFY. Esta función se invoca después de
 *    cada movimiento del carrito; sin esta comparación serían dos peticiones
 *    por clic en el botón de cantidad.
 */

const DOMAIN =
  process.env.SHOPIFY_STORE_DOMAIN || process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN
const TOKEN =
  process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN ||
  process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN
const VERSION =
  process.env.SHOPIFY_API_VERSION || process.env.NEXT_PUBLIC_SHOPIFY_API_VERSION || "2025-01"

/**
 * Los tipos de producto que cuentan como BOTA, los mismos que forman la
 * colección "Botas" de Shopify. Se comparan en minúsculas y sin acentos
 * porque el tipo lo escribe una persona en el panel.
 */
const TIPOS_BOTA = ["botines", "clasicas", "exoticas", "vaqueras", "rancho", "largas"]
const TIPO_CINTO = "cinturones"

const normaliza = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim()
    .toLowerCase()

export const esBota = (productType: string | undefined) =>
  TIPOS_BOTA.includes(normaliza(productType ?? ""))

export const esCinto = (productType: string | undefined) =>
  normaliza(productType ?? "") === TIPO_CINTO

type Resultado = {
  /** El carrito ya corregido, o null si no hizo falta tocarlo. */
  cart: Cart | null
  /** Para el registro del servidor: qué se hizo y por qué. */
  detalle: string
}

async function shopify<T>(query: string, variables: Record<string, unknown>): Promise<T> {
  if (!DOMAIN || !TOKEN) throw new Error("faltan credenciales de Shopify")
  const res = await fetch(`https://${DOMAIN}/api/${VERSION}/graphql.json`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Storefront-Access-Token": TOKEN,
      Accept: "application/json",
    },
    body: JSON.stringify({ query, variables }),
    cache: "no-store",
  })
  if (!res.ok) throw new Error(`Shopify HTTP ${res.status}`)
  const json = await res.json()
  if (json.errors?.length) {
    throw new Error(json.errors.map((e: { message: string }) => e.message).join("; "))
  }
  return json.data as T
}

type CrudoCart = Omit<Cart, "lines"> & { lines: { edges: Array<{ node: Cart["lines"][number] }> } }
const aplanar = (c: CrudoCart | null): Cart | null =>
  c ? { ...c, lines: c.lines.edges.map((e) => e.node) } : null

const LEER = /* GraphQL */ `
  query LeerCarrito($id: ID!) ${inContext()} {
    cart(id: $id) { ...CartFields }
  }
  ${CART_FRAGMENT}
`

const ESCRIBIR = /* GraphQL */ `
  mutation PonerCodigos($cartId: ID!, $discountCodes: [String!]!) ${inContext()} {
    cartDiscountCodesUpdate(cartId: $cartId, discountCodes: $discountCodes) {
      cart { ...CartFields }
      userErrors { message field }
    }
  }
  ${CART_FRAGMENT}
`

export async function sincronizarCintoMitad(cartId: string): Promise<Resultado> {
  // En la .com no hay promoción del cinto: ni se mira el carrito.
  if (!isMX) return { cart: null, detalle: "mercado distinto de México" }

  const { cart } = await shopify<{ cart: CrudoCart | null }>(LEER, { id: cartId })
  const carrito = aplanar(cart)
  if (!carrito) return { cart: null, detalle: "carrito inexistente o vencido" }

  const lineas = carrito.lines ?? []
  const hayBota = lineas.some((l) => esBota(l.merchandise.product.productType))
  const cintos = lineas.filter((l) => esCinto(l.merchandise.product.productType))

  // Un cinto fuera de la tabla no lleva descuento. Se avisa y se sigue: el
  // carrito tiene que funcionar igual.
  for (const l of cintos) {
    if (!codigoDeCinto(l.merchandise.product.handle)) {
      console.warn(
        `[cinto-mitad] el cinto "${l.merchandise.product.handle}" no está en la tabla de códigos: se queda a precio completo`
      )
    }
  }

  // El más caro de los que SÍ tienen código. El descuento es un monto fijo,
  // así que el cinto más caro es el que más descuenta.
  const elegido = hayBota
    ? cintos
        .map((l) => codigoDeCinto(l.merchandise.product.handle))
        .filter((c): c is (typeof CODIGOS_CINTO)[number] => !!c)
        .sort((a, b) => b.descuento - a.descuento)[0] ?? null
    : null

  const actuales = (carrito.discountCodes ?? []).map((d) => d.code)
  const delCliente = actuales.filter((c) => !TODOS_LOS_CODIGOS.includes(c))
  const deseados = elegido ? [...delCliente, elegido.codigo] : delCliente

  const igual =
    deseados.length === actuales.length && deseados.every((c, i) => c === actuales[i])
  if (igual) {
    return { cart: null, detalle: elegido ? `sin cambios (${elegido.codigo})` : "sin cambios" }
  }

  const data = await shopify<{
    cartDiscountCodesUpdate: {
      cart: CrudoCart | null
      userErrors: Array<{ message: string }>
    }
  }>(ESCRIBIR, { cartId, discountCodes: deseados })

  const errores = data.cartDiscountCodesUpdate.userErrors
  if (errores?.length) {
    throw new Error(errores.map((e) => e.message).join("; "))
  }

  const nuevo = aplanar(data.cartDiscountCodesUpdate.cart)

  // Si Shopify acepta el código pero lo marca como no aplicable, el sitio
  // estaría enseñando un descuento que la caja no dará. Se deja dicho en el
  // registro del servidor; el carrito se devuelve igual, con los números que
  // Shopify acaba de dar.
  if (elegido) {
    const puesto = (nuevo?.discountCodes ?? []).find((d) => d.code === elegido.codigo)
    if (puesto && !puesto.applicable) {
      console.warn(
        `[cinto-mitad] Shopify marcó ${elegido.codigo} como NO aplicable (¿programado, vencido o sin combinación?)`
      )
    }
  }

  return {
    cart: nuevo,
    detalle: elegido ? `aplicado ${elegido.codigo}` : "retirado",
  }
}
