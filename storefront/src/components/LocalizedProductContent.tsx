"use client"

import { useEffect, useState } from "react"
import { useLocale, useT } from "@/lib/i18n/context"

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

type Translation = { title: string; descriptionHtml: string }

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
        query: /* GraphQL */ `
          query ProductEN($handle: String!) @inContext(language: EN) {
            product(handle: $handle) {
              title
              descriptionHtml
            }
          }
        `,
        variables: { handle },
      }),
    })
    if (!res.ok) return null
    const json = (await res.json().catch(() => null)) as {
      data?: { product?: { title?: string; descriptionHtml?: string } }
    } | null
    const p = json?.data?.product
    if (!p) return null
    return { title: p.title ?? "", descriptionHtml: p.descriptionHtml ?? "" }
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

/** Devuelve la traducción EN del producto, o null si no estamos en inglés / no hay. */
function useProductTranslation(handle: string): Translation | null {
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
