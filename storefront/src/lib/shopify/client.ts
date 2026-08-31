/**
 * Cliente fetch para Shopify Storefront API (GraphQL).
 *
 * Patrón: una función `shopifyFetch<T>(query, variables)` que hace POST
 * al endpoint /api/<version>/graphql.json con el header del Storefront
 * access token. Sin SDK pesado, sin deps externas — el contrato GraphQL
 * es estable y bien documentado.
 *
 * Cuándo usar:
 *  - Lectura pública de productos, collections, marca, etc. → sí
 *  - Operaciones de carrito (Cart API) → sí
 *  - Operaciones admin (crear producto, ver pedido) → NO, eso requiere
 *    Admin API + diferentes credenciales. El admin lo maneja Shopify
 *    directamente, no la storefront.
 *
 * Errores: la Storefront API a veces devuelve 200 con `errors` en el
 * body (errores GraphQL) en vez de status code. Por eso checamos
 * ambas cosas.
 */

const DOMAIN = process.env.SHOPIFY_STORE_DOMAIN
const TOKEN = process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN
const VERSION = process.env.SHOPIFY_API_VERSION || "2025-01"

if (!DOMAIN) {
  throw new Error("Missing env: SHOPIFY_STORE_DOMAIN")
}

const ENDPOINT = `https://${DOMAIN}/api/${VERSION}/graphql.json`

/**
 * Segundos que un dato de Shopify se considera fresco en la caché de datos.
 *
 * Sin esto, el `force-cache` de abajo guardaba la respuesta PARA SIEMPRE:
 * nadie en el sitio llama a `revalidateTag`, así que los `tags` no invalidan
 * nada por su cuenta y un cambio de precio en el admin no se veía hasta el
 * siguiente deploy. 300 s empata con el stale-time de las rutas, así que el
 * dato y la página se refrescan juntos.
 */
const REVALIDADO_POR_DEFECTO = 300

export type ShopifyFetchResponse<T> = {
  data: T
  errors?: Array<{ message: string; extensions?: Record<string, unknown> }>
}

export class ShopifyApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public response?: unknown
  ) {
    super(message)
    this.name = "ShopifyApiError"
  }
}

export async function shopifyFetch<TData, TVariables extends Record<string, unknown> = Record<string, unknown>>(
  query: string,
  variables?: TVariables,
  options?: {
    cache?: RequestCache
    // Tags para revalidación Next.js — usar cuando se quiera invalidar
    // por evento (ej. 'products' al editar productos en admin)
    tags?: string[]
    // Segundos antes de considerar la respuesta stale. Útil para data
    // que cambia poco pero queremos refrescar en background (ej. hero
    // slides editables desde admin).
    revalidate?: number
  }
): Promise<TData> {
  if (!TOKEN) {
    throw new ShopifyApiError(
      "Missing SHOPIFY_STOREFRONT_ACCESS_TOKEN — agrégalo a .env.local",
      0
    )
  }

  const modoCache = options?.cache ?? "force-cache"
  const nextOpts: { tags?: string[]; revalidate?: number } = {}
  if (options?.tags) nextOpts.tags = options.tags
  // `no-store` + `revalidate` es combinación inválida — Next ignora las dos.
  if (modoCache !== "no-store") {
    nextOpts.revalidate = options?.revalidate ?? REVALIDADO_POR_DEFECTO
  }

  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Storefront-Access-Token": TOKEN,
      Accept: "application/json",
    },
    body: JSON.stringify({ query, variables }),
    cache: modoCache,
    next: Object.keys(nextOpts).length > 0 ? nextOpts : undefined,
  })

  if (!res.ok) {
    throw new ShopifyApiError(
      `Shopify API HTTP ${res.status}`,
      res.status,
      await res.text().catch(() => null)
    )
  }

  const json = (await res.json()) as ShopifyFetchResponse<TData>

  if (json.errors?.length) {
    throw new ShopifyApiError(
      `Shopify GraphQL: ${json.errors.map((e) => e.message).join("; ")}`,
      200,
      json.errors
    )
  }

  return json.data
}
