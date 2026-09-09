import { LocalizedLink as Link } from "@/components/LocalizedLink"
import Image from "next/image"
import { T } from "@/components/T"
import { getCategoryCards } from "@/lib/shopify"
import type { CategoryCard } from "@/lib/shopify/types"

/**
 * CategoryShowcase — el trío de tarjetas grandes del home: Hombre, Mujer y
 * Exóticas.
 *
 * Fuente de datos: Metaobjects "category_card" en Shopify admin
 * (Settings → Custom data). Si el admin todavía no creó entries, o si
 * Shopify falla, caemos al hardcode para que el home nunca quede en blanco.
 */

// El TEXTO de la card se resuelve por diccionario i18n según el destino, para
// que traduzca a inglés (el metaobjeto de Shopify solo aporta la IMAGEN, en un
// solo idioma). Para hrefs sin mapeo (cards custom) se usa el texto del
// metaobjeto tal cual.
// Destino de la tarjeta de Exóticas.
//
// NO puede ser "/products?estilo=exoticas". Comprobado contra la Storefront
// API y contra el código del listado: /products pide a Shopify solo las 24 más
// vendidas en el servidor, ProductsListing filtra ESA lista en el cliente y
// ADEMÁS esconde el botón "Cargar más" en cuanto hay un filtro activo
// (ProductsListing.tsx: `pageInfo?.hasNextPage && activeCount === 0`). De las
// 25 botas exóticas del catálogo, solo 3 caen dentro de esas 24, así que la
// tarjeta llevaba a una página con TRES botas y un aviso de "limpia los
// filtros para ver más".
//
// /hombre/exoticas sí es una página completa: prerenderizada, indexable, con
// su propio title/description, y CategoryStub la surte con
// getProductsByTaxonomy (el set entero, no un lote de 24). Y no se pierde
// nada por el género: las 25 exóticas tienen "Sexo objetivo" = Masculino.
const EXOTICAS_HREF = "/hombre/exoticas"

const CARD_I18N: Record<string, { eyebrow: string; title: string; desc: string }> = {
  "/hombre": { eyebrow: "cat.men.eyebrow", title: "cat.men.title", desc: "cat.men.desc" },
  "/mujer": { eyebrow: "cat.women.eyebrow", title: "cat.women.title", desc: "cat.women.desc" },
  "/nino": { eyebrow: "cat.kids.eyebrow", title: "cat.kids.title", desc: "cat.kids.desc" },
  "/ninos": { eyebrow: "cat.kids.eyebrow", title: "cat.kids.title", desc: "cat.kids.desc" },
  [EXOTICAS_HREF]: {
    eyebrow: "cat.exotic.eyebrow",
    title: "cat.exotic.title",
    desc: "cat.exotic.desc",
  },
}
const i18nFor = (href: string) =>
  CARD_I18N[(href || "").replace(/^\/(es|en)(?=\/)/, "").replace(/\/$/, "")] ?? null

// Fallback hardcoded — se usa cuando el metaobject "category_card"
// no tiene entries activas en Shopify. Mantiene el home funcional
// mientras el admin configura las cards desde el panel.
const FALLBACK_CATEGORIES = [
  {
    href: "/hombre",
    eyebrow: "Categoría",
    title: "Hombre",
    description: "Vaqueras, clásicas, trabajo de rancho.",
  },
  {
    href: "/mujer",
    eyebrow: "Categoría",
    title: "Mujer",
    description: "Vaqueras, clásicas, largas, fashion.",
  },
  {
    href: EXOTICAS_HREF,
    eyebrow: "Categoría",
    title: "Exóticas",
    description: "Pitón, caimán, avestruz y mantarraya.",
  },
] as const

// Destino normalizado para comparar: el link_url del metaobjeto puede venir
// con prefijo de idioma o con barra final ("/es/outlet/", "/outlet").
const sinIdioma = (href: string) =>
  (href || "").replace(/^\/(es|en)(?=\/|$)/, "").replace(/\/$/, "")

export async function CategoryShowcase() {
  // Accesorios oculto mientras solo haya dos cintos publicados: se anuncian en
  // su propio banner más abajo, no compitiendo con Hombre y Mujer.
  const raw = (await getCategoryCards().catch(() => [] as CategoryCard[])).filter(
    (c) => sinIdioma(c.href) !== "/accesorios"
  )

  // La tercera tarjeta era OUTLET y llevaba a una página vacía: los 103
  // productos del catálogo tienen el precio de comparación en 0, así que
  // /outlet no lista ni una bota. En su lugar van las Exóticas, que sí tienen
  // 25 productos publicados. Se reaprovecha la FOTO del metaobjeto de outlet
  // — el dueño puede cambiarla desde Shopify (Custom data → Category card),
  // el texto ya no sale de ahí sino del diccionario.
  const outlet = raw.find((c) => sinIdioma(c.href) === "/outlet")
  const cards: CategoryCard[] = raw.filter((c) => sinIdioma(c.href) !== "/outlet")
  if (outlet) {
    cards.push({ ...outlet, href: EXOTICAS_HREF })
  }

  return (
    <section className="contenedor seccion">
      <div className="mb-8 border-b border-border pb-4">
        <p className="eyebrow text-text-muted mb-2">
          <T k="category.shopBy" />
        </p>
        <h2 className="display-m">
          <T k="category.findYourPair" />
        </h2>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-6">
        {cards.length === 0
          ? // Fallback completo — admin no ha configurado el metaobject.
            FALLBACK_CATEGORIES.map((cat) => (
              <CardFrame
                key={cat.href}
                href={cat.href}
                eyebrow={cat.eyebrow}
                title={cat.title}
                description={cat.description}
              >
                <div className="absolute inset-0 bg-text" />
              </CardFrame>
            ))
          : cards.map((card) => (
              <CardFrame
                key={card.handle}
                href={card.href || "#"}
                eyebrow={card.eyebrow}
                title={card.title}
                description={card.description}
              >
                {card.image ? (
                  <Image
                    src={card.image.url}
                    alt={card.image.altText ?? card.title}
                    width={card.image.width}
                    height={card.image.height}
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                ) : (
                  // Entry sin asset subido: tinta plana. Un degradado de
                  // relleno sería el único de la página.
                  <div className="absolute inset-0 bg-text" />
                )}
              </CardFrame>
            ))}
      </div>
    </section>
  )
}

// Frame compartido entre la rama de fallback y la rama con datos —
// evita duplicar overlays/textos en dos sitios.
function CardFrame({
  href,
  eyebrow,
  title,
  description,
  children,
}: {
  href: string
  eyebrow: string
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <Link href={href} className="group relative block aspect-[4/5] overflow-hidden">
      {children}

      {/* Velo inferior: legibilidad del texto crema sobre la foto. */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/15 to-transparent pointer-events-none" />

      {/* Contenido — texto por i18n si el destino está mapeado; si no, literal
          del metaobjeto (así el inglés funciona en las categorías estándar). */}
      <div className="absolute inset-x-0 bottom-0 p-6 md:p-8">
        {(() => {
          const keys = i18nFor(href)
          return (
            <>
              {keys || eyebrow ? (
                <p className="eyebrow text-bg/80 mb-2">
                  {keys ? <T k={keys.eyebrow} /> : eyebrow}
                </p>
              ) : null}
              {/* .display-s (22px): el título de la tarjeta no puede pesar más
                  que el de la sección que la contiene. */}
              <h3 className="display-s text-bg mb-2">
                {keys ? <T k={keys.title} /> : title}
              </h3>
              {keys || description ? (
                <p className="cuerpo mb-4 max-w-xs text-bg/85">
                  {keys ? <T k={keys.desc} /> : description}
                </p>
              ) : null}
            </>
          )
        })()}
        <span className="nav-label inline-flex items-center text-bg/90 transition-colors duration-[180ms] group-hover:text-bg">
          <T k="nav.explore" />
          <span className="ml-2" aria-hidden>→</span>
        </span>
      </div>
    </Link>
  )
}
