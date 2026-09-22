"use client"

import { useEffect, useState } from "react"
import { useLocale } from "@/lib/i18n/context"
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

/**
 * Solo el CUERPO de la descripción — inglés cuando aplica, español (SSG) como
 * base. Sin encabezado ni regla propia: la descripción dejó de ir suelta al
 * final de la columna y ahora es la primera fila del acordeón, que ya pone el
 * título y la línea.
 */
/**
 * Prepara el HTML que escribió el dueño en Shopify antes de pintarlo.
 *
 * FOTOS DENTRO DE LA DESCRIPCIÓN. Una foto puesta en la descripción NO es
 * medio del producto: no sale en el carrusel ni en la tarjeta, solo aquí. Es
 * el sitio para las placas de anatomía y de suela, los cuadros de medidas y
 * cualquier cosa que explique la bota sin competir con las tomas de producto.
 *
 * Dos retoques al vuelo, porque el editor de Shopify no los pone:
 *   · `loading="lazy"`: la descripción vive en un acordeón cerrado, así que
 *     sus fotos no deben pesar en la carga de la ficha.
 *   · un ancho al CDN de Shopify: las placas son de 2160px y la columna de
 *     lectura mide ~640; sin esto se bajaría el original entero (72 KB contra
 *     cerca de 300).
 */
function prepararDescripcion(html: string): string {
  return html.replace(/<img\b([^>]*)>/gi, (_completa, atributos: string) => {
    let a = atributos
    if (!/\bloading=/i.test(a)) a += ' loading="lazy"'
    if (!/\bdecoding=/i.test(a)) a += ' decoding="async"'
    a = a.replace(/\bsrc="([^"]+)"/i, (m, url: string) =>
      !/cdn\.shopify\.com/.test(url) || /[?&]width=/.test(url)
        ? m
        : `src="${url}${url.includes("?") ? "&" : "?"}width=1200"`
    )
    return `<img${a}>`
  })
}

export function ProductDescriptionBody({
  handle,
  fallbackHtml,
}: {
  handle: string
  fallbackHtml: string
}) {
  const t = useProductTranslation(handle)
  const bruto = t?.descriptionHtml?.trim() ? t.descriptionHtml : fallbackHtml
  if (!bruto) return null
  const html = prepararDescripcion(bruto)
  return (
    /* Estilos para lo que el dueño puede escribir en el editor de Shopify.
       Las listas los necesitan de verdad: el reinicio de Tailwind deja los
       <ul> sin viñeta y sin sangría, así que hasta hoy las listas de las
       fichas salían como renglones sueltos (medido en vivo:
       list-style-type "none", padding-left 0). Las fotos se ajustan al ancho
       de la columna de lectura, nunca al suyo propio. */
    <div
      className="cuerpo-l medida-lectura text-text-muted [&_a]:text-leather [&_a]:underline [&_p]:mb-3 [&_p:last-child]:mb-0 [&_ul]:mb-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:mb-3 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:mb-1 [&_strong]:text-text [&_strong]:font-medium [&_img]:my-5 [&_img]:block [&_img]:h-auto [&_img]:w-full"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}

/**
 * Precio localizado — el MISMO en los dos idiomas.
 *
 * Antes había dos fuentes: en inglés el precio que se traía del cliente en vivo,
 * y en español el horneado en el build. Mientras coincidían nadie lo notaba;
 * el día que la tienda cambió de moneda, cambiar de idioma cambiaba el precio
 * en pantalla. Un precio no puede depender del idioma que lea el cliente.
 *
 * Ahora manda una sola fuente: la que Shopify devuelve para el mercado en el
 * render. La traducción sigue aplicando a título y descripción, no al importe.
 */
export function LocalizedPrice({
  amount,
  currency,
  compareAt,
  size = "card",
}: {
  amount: string
  currency: string
  compareAt?: string | null
  size?: "card" | "pdp"
}) {
  return <PriceMSI amount={amount} currency={currency} compareAt={compareAt ?? undefined} size={size} />
}
