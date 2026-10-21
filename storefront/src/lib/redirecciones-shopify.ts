/**
 * Redirecciones de URL que viven en Shopify (Admin → Navegación → Redirecciones
 * de URL, o las que crea Shopify al cambiar el handle de un producto).
 *
 * El sitio es estático por despliegue (dynamicParams = false en la PDP), así
 * que un handle que ya no existe da 404 aunque Shopify tenga su redirección.
 * Pasa al juntar colores en una sola ficha: /products/el-elegante-en-venado-negro
 * ahora es /products/el-elegante-en-venado?variant=… Aquí se leen todas al
 * construir y se vuelven redirects de next.config, con el prefijo de idioma.
 *
 * Si Shopify no responde, el build sigue sin redirecciones (nunca lo tumba).
 */

type Redirect = {
  source: string
  destination: string
  permanent: boolean
}

type Conexion = {
  nodes: Array<{ path: string; target: string }>
  pageInfo: { hasNextPage: boolean; endCursor: string | null }
}

const QUERY = `query Redirecciones($after: String) {
  urlRedirects(first: 250, after: $after) {
    nodes { path target }
    pageInfo { hasNextPage endCursor }
  }
}`

/** path-to-regexp trata ( ) { } : * + ? como especiales en `source`. */
function escapar(path: string): string {
  return path.replace(/[(){}:*+?]/g, (c) => `\\${c}`)
}

export async function redireccionesShopify(locales: string[]): Promise<Redirect[]> {
  const dominio = process.env.SHOPIFY_STORE_DOMAIN
  const token = process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN
  const version = process.env.SHOPIFY_API_VERSION || "2025-01"
  if (!dominio || !token) {
    console.warn("[redirecciones] Sin credenciales de Shopify; se omiten.")
    return []
  }

  const pares: Array<{ path: string; target: string }> = []
  try {
    let after: string | null = null
    for (let pagina = 0; pagina < 20; pagina++) {
      const res: Response = await fetch(`https://${dominio}/api/${version}/graphql.json`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Shopify-Storefront-Access-Token": token,
        },
        body: JSON.stringify({ query: QUERY, variables: { after } }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json: {
        data?: { urlRedirects?: Conexion }
        errors?: unknown
      } = await res.json()
      const conn: Conexion | undefined = json?.data?.urlRedirects
      if (!conn) throw new Error(JSON.stringify(json?.errors ?? json).slice(0, 300))
      pares.push(...conn.nodes)
      if (!conn.pageInfo.hasNextPage) break
      after = conn.pageInfo.endCursor
    }
  } catch (err) {
    console.warn("[redirecciones] No se pudieron leer de Shopify; se omiten.", err)
    return []
  }

  const grupoIdiomas = locales.join("|")
  const salida: Redirect[] = []
  for (const { path, target } of pares) {
    // Solo rutas internas del catálogo; un destino externo o raro se ignora.
    if (!/^\/(products|collections)\//.test(path)) continue
    if (!target.startsWith("/")) continue
    if (path === target.split("?")[0]) continue
    salida.push({
      source: `/:lang(${grupoIdiomas})${escapar(path)}`,
      destination: `/:lang${target}`,
      // 307: si una ficha se vuelve a separar, el navegador no se queda con
      // una redirección vieja en caché.
      permanent: false,
    })
  }
  console.log(`[redirecciones] ${salida.length} redirecciones de Shopify.`)
  return salida
}
