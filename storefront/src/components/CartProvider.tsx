"use client"

import { createContext, useCallback, useContext, useState, useTransition } from "react"
import {
  addItemAction,
  updateLineAction,
  removeLineAction,
} from "@/lib/cart/actions"
import type { Cart } from "@/lib/shopify/types"

/**
 * CartProvider — fuente única de verdad para el cart en el cliente.
 *
 * - El cart inicial viene del server (cookie → Shopify) via layout.tsx.
 * - Mutaciones llaman a server actions y actualizan el estado local
 *   con el cart devuelto. No hacemos refetch — el server siempre
 *   devuelve el cart fresco.
 * - useTransition para que el UI no se bloquee durante mutaciones.
 * - Abrir el drawer es parte del estado del provider para que cualquier
 *   componente pueda hacer openCart() (ej. después de add-to-cart).
 */

type CartContextValue = {
  cart: Cart | null
  isOpen: boolean
  isPending: boolean
  openCart: () => void
  closeCart: () => void
  toggleCart: () => void
  addItem: (merchandiseId: string, quantity?: number) => void
  updateLine: (lineId: string, quantity: number) => void
  removeLine: (lineId: string) => void
}

const CartContext = createContext<CartContextValue | null>(null)

export function CartProvider({
  initialCart,
  children,
}: {
  initialCart: Cart | null
  children: React.ReactNode
}) {
  const [cart, setCart] = useState<Cart | null>(initialCart)
  const [isOpen, setIsOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const openCart = useCallback(() => setIsOpen(true), [])
  const closeCart = useCallback(() => setIsOpen(false), [])
  const toggleCart = useCallback(() => setIsOpen((v) => !v), [])

  const addItem = useCallback((merchandiseId: string, quantity = 1) => {
    startTransition(async () => {
      try {
        const updated = await addItemAction({ merchandiseId, quantity })
        setCart(updated)
        setIsOpen(true)
      } catch (e) {
        console.error("addItem error:", e)
        alert(e instanceof Error ? e.message : "No se pudo agregar al carrito")
      }
    })
  }, [])

  const updateLine = useCallback((lineId: string, quantity: number) => {
    startTransition(async () => {
      try {
        const updated = await updateLineAction({ lineId, quantity })
        setCart(updated)
      } catch (e) {
        console.error("updateLine error:", e)
      }
    })
  }, [])

  const removeLine = useCallback((lineId: string) => {
    startTransition(async () => {
      try {
        const updated = await removeLineAction({ lineId })
        setCart(updated)
      } catch (e) {
        console.error("removeLine error:", e)
      }
    })
  }, [])

  return (
    <CartContext.Provider
      value={{
        cart,
        isOpen,
        isPending,
        openCart,
        closeCart,
        toggleCart,
        addItem,
        updateLine,
        removeLine,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) {
    throw new Error("useCart debe usarse dentro de <CartProvider>")
  }
  return ctx
}
