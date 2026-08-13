/**
 * Traducción de VALORES de filtro (estilo · color · material · horma) ES→EN.
 *
 * Los facets se arman con los labels de los metaobjetos de Shopify, que están en
 * español (contenido, no UI). Aquí los traducimos por etiqueta NORMALIZADA
 * (minúsculas, sin acentos) para que la versión en inglés del sitio muestre los
 * filtros en inglés. Fallback: la etiqueta original si no está mapeada.
 * Las MARCAS (vendor) NO se traducen — son nombres propios.
 */
const norm = (s: string) =>
  (s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").trim()

const FACET_EN: Record<string, string> = {
  // ── Estilos ──
  vaqueras: "Western", vaquera: "Western", vaquero: "Western",
  botines: "Ankle Boots", botin: "Ankle Boots",
  clasicas: "Classic", clasica: "Classic", clasico: "Classic",
  exoticas: "Exotic", exotica: "Exotic",
  largas: "Tall", rancho: "Ranch",
  // ── Colores ──
  negro: "Black", marron: "Brown", cafe: "Brown", plateado: "Silver",
  beige: "Beige", rosa: "Pink", blanco: "White", rojo: "Red", camel: "Camel",
  chocolate: "Chocolate", turquesa: "Turquoise", gris: "Gray", bronce: "Bronze",
  clara: "Light", tinto: "Wine", miel: "Honey", nogal: "Walnut",
  cognac: "Cognac", conac: "Cognac", arena: "Sand", hueso: "Bone", vino: "Wine",
  // ── Materiales ──
  avestruz: "Ostrich", bisonte: "Bison", caiman: "Alligator", cuero: "Leather",
  mantarraya: "Stingray", mantaraya: "Stingray", piton: "Python", venado: "Deer",
  cocodrilo: "Crocodile", lagarto: "Lizard", res: "Cowhide", becerro: "Calfskin",
  // ── Hormas (toe) ──
  cuadrado: "Square", dubai: "Dubai", "en punta": "Pointed", redondo: "Round",
  semioval: "Semi-oval", oval: "Oval", puntal: "Pointed",
}

/** Devuelve la etiqueta del facet en inglés cuando locale==="en" y está mapeada. */
export function facetLabel(label: string, locale: string): string {
  if (locale !== "en") return label
  return FACET_EN[norm(label)] ?? label
}
