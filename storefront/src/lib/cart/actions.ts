"use server"

import { cookies } from "next/headers"
import {
  createCart,
  addToCart as shopifyAddToCart,
  updateCartLine as shopifyUpdateCartLine,
  removeFromCart as shopifyRemoveFromCart,
} from "@/lib/shopify"
import type { Cart } from "@/lib/shopify/types"

/**
 * Server actions del carrito.
 *
 * El cartId se persiste en una cookie HTTP-only (no accesible desde JS).
 * Cada server action lee la cookie, llama a Shopify, y la actualiza si
 * cambia el cartId (caso raro: solo cuando creamos un cart por primera
 * vez para este visitante).
 *
 * Decisión: NO revalidateTag automático aquí — el cliente recibe el cart
 * actualizado como retorno y lo refleja vía CartProvider. revalidateTag
 * solo cuando queramos invalidar páginas server-rendered que dependan
 * del cart (ninguna por ahora).
 */

const COOKIE_NAME = "cartId"
// 30 días — Shopify mantiene carts hasta 30 días sin actividad.
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30

async function setCartCookie(cartId: string) {
  const jar = await cookies()
  jar.set(COOKIE_NAME, cartId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: COOKIE_MAX_AGE,
    path: "/",
  })
}

async function getCartIdFromCookie(): Promise<string | null> {
  const jar = await cookies()
  return jar.get(COOKIE_NAME)?.value ?? null
}

export async function addItemAction(input: {
  merchandiseId: string
  quantity?: number
}): Promise<Cart> {
  const quantity = input.quantity ?? 1
  const cartId = await getCartIdFromCookie()

  let cart: Cart
  if (!cartId) {
    cart = await createCart([{ merchandiseId: input.merchandiseId, quantity }])
    await setCartCookie(cart.id)
  } else {
    try {
      cart = await shopifyAddToCart(cartId, [
        { merchandiseId: input.merchandiseId, quantity },
      ])
    } catch (e) {
      // Cart expirado/inexistente: creamos uno nuevo
      const msg = e instanceof Error ? e.message : String(e)
      if (msg.toLowerCase().includes("does not exist") || msg.toLowerCase().includes("not found")) {
        cart = await createCart([{ merchandiseId: input.merchandiseId, quantity }])
        await setCartCookie(cart.id)
      } else {
        throw e
      }
    }
  }

  return cart
}

export async function updateLineAction(input: {
  lineId: string
  quantity: number
}): Promise<Cart> {
  const cartId = await getCartIdFromCookie()
  if (!cartId) throw new Error("No hay carrito activo")

  const cart = await shopifyUpdateCartLine(cartId, input.lineId, input.quantity)
  return cart
}

export async function removeLineAction(input: {
  lineId: string
}): Promise<Cart> {
  const cartId = await getCartIdFromCookie()
  if (!cartId) throw new Error("No hay carrito activo")

  const cart = await shopifyRemoveFromCart(cartId, [input.lineId])
  return cart
}
