"use client"

import { Suspense, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Header } from "@/components/Header"
import { Footer } from "@/components/Footer"
import { setPendingDiscount } from "@/lib/discount/client"

/**
 * /discount — handler para aplicar códigos de descuento por URL.
 *
 * Acepta query params:
 *  - ?code=BIENVENIDO-X7K2M (required)
 *  - ?redirect=/products (optional, default /products)
 *
 * Por qué query params en lugar de /discount/[code]:
 *  Amplify Hosting no sirve rutas dinámicas Next 16 (las marca ƒ y
 *  devuelve 500). Una página estática con search params SÍ funciona
 *  porque Next pre-renderiza el HTML y JS lee los params en cliente.
 *
 * Flow:
 *  1. Cliente click link de email Klaviyo → llega aquí con ?code=XXX
 *  2. JS guarda el code en localStorage (via setPendingDiscount)
 *  3. Muestra confirmación visual (1.5s)
 *  4. Redirect a /products (o donde diga redirect)
 *  5. CartDrawer y /cart leen el code de localStorage al pagar y
 *     agregan ?discount=CODE al checkoutUrl de Shopify
 *  6. Shopify auto-aplica el descuento al cargar el checkout
 */

export default function DiscountPage() {
  return (
    <Suspense fallback={<LoadingShell />}>
      <DiscountHandler />
    </Suspense>
  )
}

function LoadingShell() {
  return (
    <>
      <Header />
      <main className="flex-1 flex items-center justify-center px-6 py-20">
        <p className="text-text-muted">Cargando...</p>
      </main>
      <Footer />
    </>
  )
}

function DiscountHandler() {
  const search = useSearchParams()
  const router = useRouter()
  const code = (search?.get("code") || "").trim()
  // Solo aceptamos rutas internas relativas. Sin esto, ?redirect=https://evil.com
  // sería un open redirect (el link se distribuye por email → vector de phishing).
  const rawRedirect = search?.get("redirect") || "/products"
  const redirect =
    rawRedirect.startsWith("/") && !rawRedirect.startsWith("//")
      ? rawRedirect
      : "/products"
  const [stored, setStored] = useState(false)

  useEffect(() => {
    if (!code) return
    setPendingDiscount(code)
    setStored(true)
    const timer = setTimeout(() => {
      router.replace(redirect)
    }, 1500)
    return () => clearTimeout(timer)
  }, [code, redirect, router])

  if (!code) {
    return (
      <>
        <Header />
        <main className="flex-1 flex items-center justify-center px-6 py-20">
          <div className="max-w-md text-center">
            <h1 className="font-heading text-2xl text-text mb-3">
              Código no válido
            </h1>
            <p className="text-text-muted mb-6">
              El link de descuento parece incompleto.
            </p>
            <Link
              href="/products"
              className="inline-flex px-6 py-3 bg-leather text-bg uppercase text-sm tracking-wider hover:bg-text"
            >
              Ver catálogo
            </Link>
          </div>
        </main>
        <Footer />
      </>
    )
  }

  return (
    <>
      <Header />
      <main className="flex-1 flex items-center justify-center px-6 py-20">
        <div className="max-w-md text-center">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-leather text-bg flex items-center justify-center">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6 9 17l-5-5" />
            </svg>
          </div>
          <p className="eyebrow text-leather mb-2">Descuento aplicado</p>
          <h1 className="font-display text-3xl text-text mb-3">
            ¡Listo!
          </h1>
          <p className="text-text-muted mb-2">
            Tu código <strong className="text-text">{code}</strong> está
            guardado y se aplica al pagar.
          </p>
          <p className="text-xs text-text-subtle mb-6">
            {stored ? "Te llevamos al catálogo..." : "Procesando..."}
          </p>
          <Link
            href={redirect}
            className="inline-flex px-6 py-3 bg-leather text-bg uppercase text-sm tracking-wider hover:bg-text"
          >
            Ver catálogo
          </Link>
        </div>
      </main>
      <Footer />
    </>
  )
}
