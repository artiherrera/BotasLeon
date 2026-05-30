import "server-only"

import { cookies } from "next/headers"
import { getCart } from "@/lib/shopify"
import type { Cart } from "@/lib/shopify/types"

/**
 * Lectores del cart server-side (NO mutaciones — eso vive en actions.ts).
 *
 * Separados de actions.ts porque mezclar "use server" (mutaciones que se
 * llaman desde forms/client) con lecturas (que se llaman desde layouts/
 * server components) confunde a Next.js. La heurística:
 *   - actions.ts → siempre invocado por el cliente (botón, form)
 *   - queries.ts → siempre invocado por el server (layout, page)
 *
 * `server-only` evita que se bundlee al cliente accidentalmente.
 */

const COOKIE_NAME = "cartId"

export async function getCartFromCookie(): Promise<Cart | null> {
  try {
    const jar = await cookies()
    const id = jar.get(COOKIE_NAME)?.value
    if (!id) return null
    return await getCart(id)
  } catch (e) {
    console.error("[getCartFromCookie] error:", e instanceof Error ? e.message : e)
    return null
  }
}
