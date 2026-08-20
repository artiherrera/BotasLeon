"use client"

import { useEffect, useState } from "react"
import { useLocale, useT } from "@/lib/i18n/context"
import { PriceMSI } from "./PriceMSI"
import { inContext } from "@/lib/market"

/**
 * Contenido de producto localizado (Fase 2).
 *
 * El render del servidor (SSG) sale SIEMPRE en español. Cuando el visitante está
 * en modo inglés, al montar se pide la versión EN del producto a Shopify vía
 * @inContext(language: EN) — las traducciones que cargaste en Translate & Adapt —
 * y se reemplaza el título / la descripción.
 *
 * Importante:
 *  - Solo cambia el IDIOMA (language), NO el país → los precios se quedan en el
 *    mercado por defecto (mismos precios, MXN). Aquí ni siquiera pedimos precios.
 *  - Reusa el token público NEXT_PUBLIC_* que ya usa el carrito en el navegador.
 *  - Cache a nivel módulo + dedupe de peticiones: varios componentes del mismo
 *    producto comparten un solo fetch.
 */

const DOMAIN = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN
const TOKEN = process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN
const VERSION = process.env.NEXT_PUBLIC_SHOPIFY_API_VERSION || "2025-01"

type Money = { amount: string; currencyCode: string }
type Translation = {
  title: string
  descriptionHtml: string
  price: Money | null
  compareAtPrice: Money | null
}

const cache = new Map<string, Promise<Translation | null>>()

async function fetchTranslation(handle: string): Promise<Translation | null> {
  if (!DOMAIN || !TOKEN) return null
  try {
    const res = await fetch(`https://${DOMAIN}/api/${VERSION}/graphql.json`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Storefront-Access-Token": TOKEN,
        Accept: "application/json",
      },
      body: JSON.stringify({
        // country: US + language: EN → el inglés está publicado en el mercado
        // de Estados Unidos (no en el default México). Con solo language:EN
        // Shopify cae a español. Este contexto TAMBIÉN devuelve precios en USD
        // (conversión automática del mercado USA).
        query: /* GraphQL */ `
          query ProductEN($handle: String!) ${inContext('EN')} {
            product(handle: $handle) {
              title
              descriptionHtml
              priceRange { minVariantPrice { amount currencyCode } }
              compareAtPriceRange { minVariantPrice { amount currencyCode } }
            }
          }
        `,
        variables: { handle },
      }),
    })
    if (!res.ok) return null
    const json = (await res.json().catch(() => null)) as {
      data?: {
        product?: {
          title?: string
          descriptionHtml?: string
          priceRange?: { minVariantPrice?: Money }
          compareAtPriceRange?: { minVariantPrice?: Money }
        }
      }
    } | null
    const p = json?.data?.product
    if (!p) return null
    const price = p.priceRange?.minVariantPrice ?? null
    const ca = p.compareAtPriceRange?.minVariantPrice ?? null
    // Shopify devuelve "0.0" cuando no hay precio comparado (no está en oferta).
    const compareAtPrice = ca && parseFloat(ca.amount) > 0 ? ca : null
    return {
      title: p.title ?? "",
      descriptionHtml: p.descriptionHtml ?? "",
      price,
      compareAtPrice,
    }
  } catch {
    return null
  }
}

function load(handle: string): Promise<Translation | null> {
  let cached = cache.get(handle)
  if (!cached) {
    cached = fetchTranslation(handle)
    cache.set(handle, cached)
  }
  return cached
}

/**
 * Traducción EN (título + precio USD) de un producto, fuera del árbol de React
 * (p.ej. al generar el PDF de selección). Comparte el mismo cache por módulo,
 * así lo ya visto es instantáneo.
 */
export function loadProductTranslation(handle: string): Promise<Translation | null> {
  return load(handle)
}

/** Devuelve la traducción EN del producto, o null si no estamos en inglés / no hay. */
export function useProductTranslation(handle: string): Translation | null {
  const { locale } = useLocale()
  const [data, setData] = useState<Translation | null>(null)

  useEffect(() => {
    if (locale !== "en") {
      setData(null)
      return
    }
    let active = true
    load(handle).then((t) => {
      if (active) setData(t)
    })
    return () => {
      active = false
    }
  }, [locale, handle])

  return locale === "en" ? data : null
}

/** Título del producto — inglés cuando aplica, español (SSG) como base. */
export function LocalizedProductTitle({
  handle,
  fallback,
  className,
}: {
  handle: string
  fallback: string
  className?: string
}) {
  const t = useProductTranslation(handle)
  return <h1 className={className}>{t?.title?.trim() || fallback}</h1>
}

/** Bloque de descripción — encabezado traducido + HTML en inglés cuando aplica. */
export function LocalizedProductDescription({
  handle,
  fallbackHtml,
}: {
  handle: string
  fallbackHtml: string
}) {
  const tr = useT()
  const t = useProductTranslation(handle)
  const html = t?.descriptionHtml?.trim() ? t.descriptionHtml : fallbackHtml
  if (!html) return null
  return (
    <div className="mt-12 pt-8 border-t border-border">
      <h2 className="eyebrow text-leather mb-4">{tr("product.description")}</h2>
      <div
        className="prose prose-sm max-w-none text-text-muted leading-relaxed [&_p]:mb-3"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  )
}

/**
 * Precio localizado — en inglés (mercado USA) muestra el precio en USD que
 * devuelve Shopify vía @inContext del mercado; en español muestra el precio
 * base en MXN (render del servidor, SSG). PriceMSI apaga solo el MSI cuando la
 * moneda no es MXN, así que en USD sale el total limpio (sin "meses sin
 * intereses", que no aplica a EE.UU.).
 */
export function LocalizedPrice({
  handle,
  amount,
  currency,
  compareAt,
  size = "card",
}: {
  handle: string
  amount: string
  currency: string
  compareAt?: string | null
  size?: "card" | "pdp"
}) {
  const t = useProductTranslation(handle)
  const usd = t?.price
  if (usd) {
    return (
      <PriceMSI
        amount={usd.amount}
        currency={usd.currencyCode}
        compareAt={t?.compareAtPrice?.amount ?? undefined}
        size={size}
      />
    )
  }
  return <PriceMSI amount={amount} currency={currency} compareAt={compareAt ?? undefined} size={size} />
}
