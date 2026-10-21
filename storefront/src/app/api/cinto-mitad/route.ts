import { NextResponse } from "next/server"
import { sincronizarCintoMitad } from "@/lib/cinto-mitad/sincronizar"

/**
 * POST /api/cinto-mitad  { cartId }
 *
 * Pone o quita el código del cinto a mitad. El navegador la llama después de
 * cada movimiento del carrito y recibe el carrito ya corregido (o nada, si no
 * hizo falta tocarlo).
 *
 * POR QUÉ UNA RUTA Y NO EL NAVEGADOR: los códigos no pueden viajar en el
 * bundle. Si estuvieran en el JavaScript, cualquiera los leería y los usaría
 * sin comprar botas — un cinto a mitad de precio regalado.
 *
 * NUNCA REVIENTA EL CARRITO. Si Shopify falla o la ruta se cae, se responde
 * 200 con `cart: null` y el navegador se queda con el carrito que ya tenía:
 * sin el descuento, pero entero. Una compra sin promoción es mala; una compra
 * rota es peor.
 */
export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  let cartId: string | undefined
  try {
    const body = (await request.json()) as { cartId?: string }
    cartId = body.cartId
  } catch {
    return NextResponse.json({ cart: null, detalle: "cuerpo ilegible" }, { status: 400 })
  }

  // Formato de Shopify: gid://shopify/Cart/XXXX?key=YYYY
  if (!cartId || !/^gid:\/\/shopify\/Cart\//.test(cartId)) {
    return NextResponse.json({ cart: null, detalle: "cartId inválido" }, { status: 400 })
  }

  try {
    const { cart, detalle } = await sincronizarCintoMitad(cartId)
    return NextResponse.json({ cart, detalle })
  } catch (e) {
    console.error("[cinto-mitad] falló la sincronización:", e)
    return NextResponse.json({ cart: null, detalle: "error" })
  }
}
