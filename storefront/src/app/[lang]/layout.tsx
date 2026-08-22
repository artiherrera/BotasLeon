import type { Metadata, Viewport } from "next"
import localFont from "next/font/local"
import { KlaviyoLoader } from "@/components/KlaviyoLoader"
import { CartProvider } from "@/components/CartProvider"
import { CartDrawer } from "@/components/CartDrawer"
import { Toast } from "@/components/Toast"
import { RedireccionMercado } from "@/components/RedireccionMercado"
import { CookiesBanner } from "@/components/CookiesBanner"
import { GoogleAnalytics } from "@/components/GoogleAnalytics"
import { MetaPixel } from "@/components/MetaPixel"
import { OrganizationJsonLd, WebsiteJsonLd } from "@/components/StructuredData"
import { PromoModal } from "@/components/PromoModal"
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
 * Tipografías — Kit de Marca v2 (sobrio, estilo Tecovas):
 *  - Fraunces: serif display para H1–H3, nombres de producto y cifras.
 *  - Inter: sans-serif para cuerpo, navegación, botones, formularios y eyebrows.
 *
 * Se cargan como CSS variables y se conectan al @theme de globals.css.
 * (Antes: Bevan + Zilla Slab — retirados por completo.)
 */
// Archivos locales (src/fonts, subconjunto latino): el build no depende de que
// Google responda. Son variables, así que un solo archivo cubre todo el rango
// de pesos que usa el sitio.
const fraunces = localFont({
  src: "../../fonts/fraunces.woff2",
  variable: "--font-fraunces",
  weight: "300 700",
  display: "swap",
})
const inter = localFont({
  src: "../../fonts/inter.woff2",
  variable: "--font-inter",
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

  // El idioma sale del segmento [lang]: SSR ya en el idioma correcto. Las rutas
  // siguen siendo estáticas (generateStaticParams pre-genera es y en); Amplify
  // las sirve sin 500.
  return (
    <html
      lang={locale}
      className={`${fraunces.variable} ${inter.variable} h-full antialiased`}
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

        {/* Ventana de promo temporal (PROMO en @/lib/promo). Anuncia el
            descuento y lo auto-aplica a todos. Aparece tras el aviso de cookies.
            Apagar con PROMO.active = false. (Se renderiza como overlay fijo.) */}
        <PromoModal />

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
        </CartProvider>
        <CookiesBanner />

        </LocaleProvider>
      </body>
    </html>
  )
}
