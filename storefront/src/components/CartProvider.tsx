"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  useTransition,
} from "react"
import {
  clientAddLines,
  clientCreateCart,
  clientGetCart,
  clientRemoveLines,
  clientUpdateLines,
} from "@/lib/cart/client"
import type { Cart } from "@/lib/shopify/types"

/**
 * CartProvider — estado del carrito 100% en cliente.
 *
 * - cartId vive en localStorage (sobrevive refresh, expira con
 *   localStorage del navegador o cuando Shopify lo limpia).
 * - Al mount: lee cartId de localStorage, hace fetch a Shopify para
 *   traer el cart actual. Si Shopify devuelve null (cart expirado o
 *   convertido en pedido), borra el localStorage y arranca limpio.
 * - Todas las mutaciones se hacen browser→Shopify directo (sin pasar
 *   por nuestro server). Esto evita server actions + cookies que
 *   Amplify Hosting no maneja bien en Next 16.
 * - El layout queda SYNC (no async) → todas las rutas permanecen
 *   static + revalidate, que es el patrón que Amplify sí sirve.
 */

const STORAGE_KEY = "botasleon:cartId"

type CartContextValue = {
  cart: Cart | null
  ready: boolean        // false durante hidratación inicial
  isPending: boolean    // true durante una mutación
  isOpen: boolean
  openCart: () => void
  closeCart: () => void
  toggleCart: () => void
  addItem: (merchandiseId: string, quantity?: number) => void
  updateLine: (lineId: string, quantity: number) => void
  removeLine: (lineId: string) => void
  itemCount: number
}

const CartContext = createContext<CartContextValue | null>(null)

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<Cart | null>(null)
  const [ready, setReady] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const cartIdRef = useRef<string | null>(null)

  // Hidratación inicial — corre solo en cliente.
  useEffect(() => {
    const stored = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null
    if (!stored) {
      setReady(true)
      return
    }
    cartIdRef.current = stored
    clientGetCart(stored)
      .then((c) => {
        if (c) {
          setCart(c)
        } else {
          // Cart expirado o convertido en pedido — limpiar
          localStorage.removeItem(STORAGE_KEY)
          cartIdRef.current = null
        }
      })
      .catch((e) => {
        console.warn("[cart] hidratación falló, arrancando limpio:", e)
        localStorage.removeItem(STORAGE_KEY)
        cartIdRef.current = null
      })
      .finally(() => setReady(true))
  }, [])

  const persist = useCallback((c: Cart) => {
    setCart(c)
    cartIdRef.current = c.id
    try {
      localStorage.setItem(STORAGE_KEY, c.id)
    } catch {
      // localStorage puede fallar en modo privado, no es bloqueante
    }
  }, [])

  const openCart = useCallback(() => setIsOpen(true), [])
  const closeCart = useCallback(() => setIsOpen(false), [])
  const toggleCart = useCallback(() => setIsOpen((v) => !v), [])

  const addItem = useCallback(
    (merchandiseId: string, quantity = 1) => {
      startTransition(async () => {
        try {
          const id = cartIdRef.current
          const updated = id
            ? await clientAddLines(id, [{ merchandiseId, quantity }])
            : await clientCreateCart([{ merchandiseId, quantity }])
          persist(updated)
          setIsOpen(true)
        } catch (e) {
          // Si el cart se invalidó server-side, intentar crear uno nuevo
          const msg = e instanceof Error ? e.message : String(e)
          if (cartIdRef.current && /does not exist|not found/i.test(msg)) {
            try {
              const fresh = await clientCreateCart([{ merchandiseId, quantity }])
              persist(fresh)
              setIsOpen(true)
              return
            } catch (e2) {
              console.error("[cart] retry falló:", e2)
            }
          }
          console.error("[cart] addItem falló:", e)
          alert(`No se pudo agregar al carrito: ${msg}`)
        }
      })
    },
    [persist]
  )

  const updateLine = useCallback(
    (lineId: string, quantity: number) => {
      const id = cartIdRef.current
      if (!id) return
      startTransition(async () => {
        try {
          const updated = await clientUpdateLines(id, [{ id: lineId, quantity }])
          persist(updated)
        } catch (e) {
          console.error("[cart] updateLine falló:", e)
        }
      })
    },
    [persist]
  )

  const removeLine = useCallback(
    (lineId: string) => {
      const id = cartIdRef.current
      if (!id) return
      startTransition(async () => {
        try {
          const updated = await clientRemoveLines(id, [lineId])
          persist(updated)
        } catch (e) {
          console.error("[cart] removeLine falló:", e)
        }
      })
    },
    [persist]
  )

  const itemCount = ready ? (cart?.totalQuantity ?? 0) : 0

  return (
    <CartContext.Provider
      value={{
        cart,
        ready,
        isPending,
        isOpen,
        openCart,
        closeCart,
        toggleCart,
        addItem,
        updateLine,
        removeLine,
        itemCount,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error("useCart() debe usarse dentro de <CartProvider>")
  return ctx
}
