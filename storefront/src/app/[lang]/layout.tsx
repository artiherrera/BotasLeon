import type { Metadata, Viewport } from "next"
import localFont from "next/font/local"
import { KlaviyoLoader } from "@/components/KlaviyoLoader"
import { CartProvider } from "@/components/CartProvider"
import { CartDrawer } from "@/components/CartDrawer"
import { Toast } from "@/components/Toast"
import { MiniCarrito } from "@/components/MiniCarrito"
import { RedireccionMercado } from "@/components/RedireccionMercado"
import { CookiesBanner } from "@/components/CookiesBanner"
import { GoogleAnalytics } from "@/components/GoogleAnalytics"
import { MetaPixel } from "@/components/MetaPixel"
import { OrganizationJsonLd, WebsiteJsonLd } from "@/components/StructuredData"
import { PopupPromo } from "@/components/PopupPromo"
import { getPopup } from "@/lib/shopify"
import { notFound } from "next/navigation"
import { LocaleProvider } from "@/lib/i18n/context"
import { LOCALES, isLocale, type Locale } from "@/lib/i18n/config"
import { SITE_URL, SITE_NAME, SITE_DESCRIPTION } from "@/lib/seo"
import "../globals.css"

/**
 * i18n por URL: cada idioma vive bajo su propio prefijo (/es/… y /en/…).
 * Pre-generamos ambos de forma ESTÁTICA (generateStaticParams) — nada depende
 * de cookies/headers en render, así que Amplify lo sirve sin 500s. El idioma
 * viene del segmento [lang] y se pasa a LocaleProvider como estado inicial, de
 * modo que el SSR ya sale en el idioma correcto (no hay parpadeo ES→EN).
 */
export function generateStaticParams() {
  return LOCALES.map((lang) => ({ lang }))
}

/**
 * Tipografías — sistema visual v3 (informe de rediseño, sep 2026):
 *  - Instrument Serif: display. Cinco lugares y ninguno más — hero, títulos de
 *    página y de sección, nombre del producto en la ficha, cifras grandes y la
 *    frase de marca. Solo existe en peso 400 (ver font-synthesis en globals).
 *  - Instrument Sans: todo lo demás — cuerpo, tarjetas, navegación, botones,
 *    precios, filtros, formularios y eyebrows.
 *
 * Sustituyen a Fraunces + Inter. Fraunces se usaba a peso 600 con el eje SOFT
 * alto —su versión más redonda— y en once roles distintos: cuando llegaba el
 * título que sí importaba, ya no sorprendía. Inter hacía legible cualquier cosa
 * y no decía nada, y el cuerpo de texto es la mitad de la página.
 *
 * Se cargan como CSS variables y se conectan al @theme de globals.css.
 */
// Archivos locales (src/fonts, subconjunto latino): el build no depende de que
// Google responda. Un deploy real falló porque fonts.gstatic.com devolvió 404
// a medio compilar y Turbopack no pudo resolver la fuente.
const instrumentSerif = localFont({
  src: "../../fonts/instrument-serif.woff2",
  variable: "--font-instrument-serif",
  weight: "400",
  display: "swap",
})
const instrumentSans = localFont({
  src: "../../fonts/instrument-sans.woff2",
  variable: "--font-instrument-sans",
  weight: "400 700",
  display: "swap",
})

export async function generateMetadata({
  params,
}: LayoutProps<"/[lang]">): Promise<Metadata> {
  const { lang } = await params
  const isEn = lang === "en"
  return {
  metadataBase: new URL(SITE_URL),
  title: {
    default: isEn
      ? `${SITE_NAME} · Boots handcrafted in León, Mexico`
      : `${SITE_NAME} · Botas hechas en León, Guanajuato`,
    template: `%s · ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  keywords: [
    "botas vaqueras",
    "botas mexicanas",
    "botas de cuero",
    "botas hechas en León",
    "botas Guanajuato",
    "botas exóticas avestruz cocodrilo",
    "botas de rancho",
    "botas hombre",
    "botas mujer",
    "BotasLeón",
  ],
  authors: [{ name: SITE_NAME }],
  creator: SITE_NAME,
  openGraph: {
    type: "website",
    locale: isEn ? "en_US" : "es_MX",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: isEn
      ? `${SITE_NAME} · 380 years of tradition. Right to your doorstep.`
      : `${SITE_NAME} · 380 años de tradición. A la puerta de tu casa.`,
    description: SITE_DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: isEn
      ? `${SITE_NAME} · Boots handcrafted in León`
      : `${SITE_NAME} · Botas hechas en León`,
    description: SITE_DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  // NO declarar `alternates.canonical` aquí — se hereda a todas las páginas
  // hijas y rompe la indexación (Google trata toda la taxonomía como duplicado
  // del home). Cada page.tsx declara su propio canonical vía pageMetadata().
  // hreflang (es/en) se declara en el sitemap, no aquí (mantiene páginas estáticas).
  }
}

/**
 * viewport — tint la status bar de Safari iOS / Chrome Android en
 * cuero #4B2E1F. Señal visual premium que extiende el branding al chrome
 * del navegador.
 */
export const viewport: Viewport = {
  themeColor: "#4B2E1F",
}

export default async function RootLayout({
  children,
  params,
}: LayoutProps<"/[lang]">) {
  const { lang } = await params
  // Idioma inválido en la URL (p.ej. /fr/…) → 404. Solo es/en existen.
  if (!isLocale(lang)) notFound()
  const locale = lang as Locale

  // La ventana emergente se lee aquí, en el layout, para que salga en toda la
  // tienda y no solo en la portada. Devuelve null si no hay ninguna activa (o
  // si el metaobjeto todavía no existe en el admin), y entonces no se pinta.
  const popup = await getPopup()

  // El idioma sale del segmento [lang]: SSR ya en el idioma correcto. Las rutas
  // siguen siendo estáticas (generateStaticParams pre-genera es y en); Amplify
  // las sirve sin 500.
  return (
    <html
      lang={locale}
      className={`${instrumentSerif.variable} ${instrumentSans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-bg text-text">
        {/* Saltar al contenido — primer tab para usuarios de teclado, salta
            el Header repetido y aterriza en el <main id="contenido">. */}
        <a
          href="#contenido"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:bg-text focus:text-bg focus:px-4 focus:py-2 focus:rounded"
        >
          {locale === "en" ? "Skip to content" : "Saltar al contenido"}
        </a>

        {/* LocaleProvider — idioma de la interfaz (ES/EN). Envuelve TODO el
            contenido para que cualquier componente pueda traducir con useT().
            Es client component, pero recibe los children (server) como prop, así
            que las rutas siguen siendo estáticas. */}
        <LocaleProvider initialLocale={locale}>

        {/* Ventana emergente editable desde Shopify (metaobjeto `popup`).
            Imagen, textos, botón y código de descuento salen del admin: para
            anunciar algo no hace falta un despliegue. Sin entrada activa no se
            pinta nada. Aparece tras el aviso de cookies, donde lo hay. */}
        <PopupPromo popup={popup} />

        {/* JSON-LD Schema.org global — Organization + WebSite con search */}
        <OrganizationJsonLd />
        <WebsiteJsonLd />

        {/* Klaviyo Onsite — se inyecta SOLO con consentimiento "todas"
            (ver KlaviyoLoader). Hoy solo alimenta eventos de navegación y
            carrito; no hay captura de email en el sitio. */}
        <KlaviyoLoader />

        {/* GA4 con Consent Mode v2 — escucha botasleon:consent-change del
            CookiesBanner para promover analytics_storage. */}
        <GoogleAnalytics />

        {/* Meta Pixel — se inyecta SOLO con consentimiento "todas" (como
            Klaviyo). La Compra la captura el canal de Facebook de Shopify. */}
        <MetaPixel />

        {/* Manda a la .mx a quien entra desde México. Va tan arriba como se
            pueda para que el cambio ocurra antes de que se vea el precio en
            dólares. Ver components/RedireccionMercado.tsx. */}
        <RedireccionMercado />

        <CartProvider>
          {children}
          <CartDrawer />
          <Toast />
          <MiniCarrito />
        </CartProvider>
        <CookiesBanner />

        </LocaleProvider>
      </body>
    </html>
  )
}
