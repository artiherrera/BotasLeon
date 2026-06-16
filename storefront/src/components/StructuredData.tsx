import { SITE_URL, SITE_NAME, SITE_DESCRIPTION, absoluteUrl } from "@/lib/seo"
import { getSameAsUrls } from "@/lib/social"
import type { Product } from "@/lib/shopify/types"

/**
 * Componentes que emiten JSON-LD Schema.org para rich snippets en Google.
 *
 * El JSON va dentro de un <script type="application/ld+json"> que
 * Google parsea para mostrar precio, rating, breadcrumbs, etc. en
 * los resultados de búsqueda.
 *
 * Cada componente es un Server Component plano que renderiza un script.
 */

function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}

// === Organization — emitir en layout.tsx (todas las páginas) ===
export function OrganizationJsonLd() {
  // sameAs: ayuda a Google conectar la marca con sus perfiles oficiales
  // en el Knowledge Graph. Solo emitir el campo si hay al menos un link
  // activo — un array vacío es válido pero genera ruido en validadores.
  const sameAs = getSameAsUrls()

  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "Organization",
        name: SITE_NAME,
        url: SITE_URL,
        logo: absoluteUrl("/logo_botasleon.png"),
        description: SITE_DESCRIPTION,
        ...(sameAs.length > 0 && { sameAs }),
        address: {
          "@type": "PostalAddress",
          addressLocality: "León",
          addressRegion: "Guanajuato",
          addressCountry: "MX",
        },
        contactPoint: {
          "@type": "ContactPoint",
          email: "hola@botasleon.com",
          contactType: "Customer service",
          areaServed: ["MX", "US"],
          availableLanguage: ["Spanish", "English"],
        },
      }}
    />
  )
}

// === WebSite con search action — emitir en layout (habilita el sitelinks
// search box de Google) ===
export function WebsiteJsonLd() {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: SITE_NAME,
        url: SITE_URL,
        potentialAction: {
          "@type": "SearchAction",
          target: {
            "@type": "EntryPoint",
            urlTemplate: `${SITE_URL}/search?q={search_term_string}`,
          },
          "query-input": "required name=search_term_string",
        },
      }}
    />
  )
}

// === Product — emitir en /products/[handle]/page.tsx ===
export function ProductJsonLd({ product }: { product: Product }) {
  const images = product.images.length > 0
    ? product.images.map((i) => i.url)
    : product.featuredImage
      ? [product.featuredImage.url]
      : []

  // aggregateRating activa rich snippets (estrellitas en SERPs Google).
  // Solo se emite si Judge.me ya escribió los metafields — si no, Google
  // recibe schema válido sin rating (mejor que rating fake). reviewCount
  // es required por schema, así que omitimos todo el bloque si falta.
  const rating = product.judgemeRating
  const reviewCount = product.judgemeReviewCount
  const aggregateRating =
    typeof rating === "number" && rating > 0 && typeof reviewCount === "number" && reviewCount > 0
      ? {
          "@type": "AggregateRating",
          ratingValue: rating,
          reviewCount,
          bestRating: 5,
          worstRating: 1,
        }
      : undefined

  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "Product",
        name: product.title,
        description: product.description || product.title,
        image: images,
        sku: product.id,
        brand: product.vendor
          ? { "@type": "Brand", name: product.vendor }
          : undefined,
        aggregateRating,
        offers: {
          "@type": "AggregateOffer",
          priceCurrency: product.priceRange.minVariantPrice.currencyCode,
          lowPrice: product.priceRange.minVariantPrice.amount,
          highPrice: product.priceRange.maxVariantPrice.amount,
          offerCount: product.variants?.length ?? 1,
          availability: product.availableForSale
            ? "https://schema.org/InStock"
            : "https://schema.org/OutOfStock",
          url: absoluteUrl(`/products/${product.handle}`),
          shippingDetails: {
            "@type": "OfferShippingDetails",
            shippingRate: {
              "@type": "MonetaryAmount",
              value: 0,
              currency: product.priceRange.minVariantPrice.currencyCode,
            },
            shippingDestination: {
              "@type": "DefinedRegion",
              addressCountry: "MX",
            },
            deliveryTime: {
              "@type": "ShippingDeliveryTime",
              handlingTime: {
                "@type": "QuantitativeValue",
                minValue: 0,
                maxValue: 1,
                unitCode: "DAY",
              },
              transitTime: {
                "@type": "QuantitativeValue",
                minValue: 3,
                maxValue: 5,
                unitCode: "DAY",
              },
            },
          },
          hasMerchantReturnPolicy: {
            "@type": "MerchantReturnPolicy",
            applicableCountry: "MX",
            returnPolicyCategory:
              "https://schema.org/MerchantReturnFiniteReturnWindow",
            merchantReturnDays: 30,
            returnFees: "https://schema.org/FreeReturn",
            returnMethod: "https://schema.org/ReturnByMail",
          },
        },
      }}
    />
  )
}

// === Breadcrumb — emitir en PDP y otras páginas internas ===
export function BreadcrumbJsonLd({
  items,
}: {
  items: Array<{ name: string; url: string }>
}) {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: items.map((item, idx) => ({
          "@type": "ListItem",
          position: idx + 1,
          name: item.name,
          item: absoluteUrl(item.url),
        })),
      }}
    />
  )
}

// === FAQPage — emitir en home (donde renderiza FAQAccordion). Activa el
// rich result de preguntas frecuentes expandibles en SERPs de Google. ===
export function FAQJsonLd({
  items,
}: {
  items: Array<{ question: string; answer: string }>
}) {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: items.map((q) => ({
          "@type": "Question",
          name: q.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: q.answer,
          },
        })),
      }}
    />
  )
}
