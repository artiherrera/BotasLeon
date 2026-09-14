import type { Product } from "@/lib/shopify/types"

/**
 * Lectura de los metacampos de taxonomía de Shopify (color, material, estilo,
 * horma, talla). Todos comparten el mismo shape: una lista de referencias a
 * metaobjetos, cada uno con un campo `label` legible y, en el caso del color,
 * un `color` con el HEX nativo.
 *
 * Vivía dentro de ProductsListing.tsx, que es un componente cliente de 800
 * líneas: la tarjeta no podía importarla sin arrastrarlo entero. Aquí la usan
 * las dos.
 */
type TaxonomyMetafield =
  | {
      references?: {
        edges: Array<{
          node: { handle: string; fields: Array<{ key: string; value: string | null }> }
        }>
      }
    }
  | null
  | undefined

export type ValorTaxonomia = { handle: string; label: string; hex: string | null }

/**
 * Preferir el HEX nativo del metaobjeto sobre cualquier tabla local hace que un
 * color nuevo cargado en Shopify se pinte solo, sin caer a gris.
 */
export function extractTaxonomyValues(metafield: TaxonomyMetafield): ValorTaxonomia[] {
  const edges = metafield?.references?.edges ?? []
  return edges.map((e) => {
    const label = e.node.fields.find((f) => f.key === "label")?.value
    const colorHex = e.node.fields.find((f) => f.key === "color")?.value ?? null
    return {
      handle: e.node.handle,
      label: label || e.node.handle,
      hex: colorHex && /^#[0-9a-fA-F]{3,8}$/.test(colorHex) ? colorHex : null,
    }
  })
}

/** El primer valor de un metacampo de taxonomía, o null. */
export function primerValor(metafield: TaxonomyMetafield): ValorTaxonomia | null {
  return extractTaxonomyValues(metafield)[0] ?? null
}

/**
 * Los dos datos que el cliente usa para decidir de un vistazo en el grid:
 * horma y piel. Son los ÚNICOS dos que existen de verdad — lo comprobé contra
 * la Storefront API sobre los 103 productos: shopify.toe-style está en 98 y
 * shopify.footwear-material en 98, mientras que shopify.sole-material está en
 * CERO. Por eso la línea de la tarjeta es de dos datos y no de los tres que
 * pedía el informe: la suela solo aparece suelta en la prosa de 44 de 103
 * descripciones, y en formas irregulares que no se pueden normalizar.
 *
 * Devuelve las etiquetas en español (como vienen de Shopify); traducirlas es
 * cosa de quien pinta, con facetLabel().
 */
export function atributosDeTarjeta(product: Product): string[] {
  const horma = primerValor(product.toeStyle)?.label
  const piel = primerValor(product.material)?.label
  return [horma, piel].filter((v): v is string => !!v && v.trim().length > 0)
}

/**
 * Los atributos de la FICHA: horma, piel y caña.
 *
 * El informe pedía "Horma · Piel · Suela", pero la suela no existe: el
 * metacampo shopify.outsole-material está vacío en los 106 productos (medido).
 * Anunciar un rótulo vacío sería peor que no ponerlo, así que en su lugar va la
 * caña, que sí está llena en 96 de 106 (91%). Horma y piel llegan al 95%.
 *
 * Se devuelve lo que HAYA: si una bota no tiene ninguno de los tres, la línea
 * entera no se pinta, en vez de dejar separadores sueltos colgando.
 *
 * El día que se llene la suela en Shopify, se agrega aquí y aparece sola en las
 * 106 fichas.
 */
export function atributosDeFicha(product: Product): string[] {
  const horma = primerValor(product.toeStyle)?.label
  const piel = primerValor(product.material)?.label
  const cana = primerValor(product.bootStyle)?.label
  return [horma, piel, cana].filter(
    (v): v is string => !!v && v.trim().length > 0
  )
}

/**
 * El handle del primer metaobjeto referenciado, para metacampos que solo traen
 * `handle` y no `fields` — como shopify.target-gender, del que solo interesa
 * si es "masculino" o "femenino" para convertir la talla.
 */
export function primerHandle(
  metafield?: { references?: { edges: Array<{ node: { handle: string } }> } } | null
): string | undefined {
  return metafield?.references?.edges?.[0]?.node?.handle
}
