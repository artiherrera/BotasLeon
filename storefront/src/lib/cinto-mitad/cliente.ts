import { isMX } from "@/lib/market"
import type { Cart } from "@/lib/shopify/types"

/**
 * El lado del NAVEGADOR de la promoción del cinto.
 *
 * Aquí no hay ningún código de descuento: solo el prefijo con el que empiezan,
 * que no sirve para canjear nada. Los códigos viven en el servidor
 * (lib/cinto-mitad/config.ts, con `server-only`) y el navegador se limita a
 * pedirle a /api/cinto-mitad que revise el carrito.
 */

/** Con esto empiezan los códigos que administra el sitio. No es un código. */
const PREFIJO = "CINTOMITAD-"

const TIPOS_BOTA = ["botines", "clasicas", "exoticas", "vaqueras", "rancho", "largas"]

const normaliza = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim()
    .toLowerCase()

/** ¿Este carrito debería llevar el código del cinto y todavía no lo lleva? */
export function faltaCodigoCinto(cart: Cart | null): boolean {
  if (!isMX || !cart) return false
  const lineas = cart.lines ?? []
  const hayBota = lineas.some((l) =>
    TIPOS_BOTA.includes(normaliza(l.merchandise.product.productType ?? ""))
  )
  const hayCinto = lineas.some(
    (l) => normaliza(l.merchandise.product.productType ?? "") === "cinturones"
  )
  const yaPuesto = (cart.discountCodes ?? []).some((d) => d.code.startsWith(PREFIJO))
  return hayBota && hayCinto && !yaPuesto
}

/** ¿Lleva un código nuestro que ya no corresponde (se fue la bota o el cinto)? */
export function sobraCodigoCinto(cart: Cart | null): boolean {
  if (!isMX || !cart) return false
  const lleva = (cart.discountCodes ?? []).some((d) => d.code.startsWith(PREFIJO))
  if (!lleva) return false
  return !faltaCodigoCinto({ ...cart, discountCodes: [] } as Cart)
}

/**
 * Le pide al servidor que revise el carrito. Devuelve el carrito corregido, o
 * null si no hubo nada que cambiar (o si algo falló: el carrito que tiene el
 * navegador sigue siendo válido).
 */
export async function sincronizarCintoEnServidor(cartId: string): Promise<Cart | null> {
  if (!isMX) return null
  try {
    const res = await fetch("/api/cinto-mitad", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cartId }),
    })
    if (!res.ok) return null
    const json = (await res.json()) as { cart: Cart | null }
    return json.cart ?? null
  } catch {
    return null
  }
}
