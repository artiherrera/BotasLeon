import type { Metadata, Viewport } from "next"
import { Bevan, Zilla_Slab, Inter } from "next/font/google"
import { KlaviyoLoader } from "@/components/KlaviyoLoader"
import { CartProvider } from "@/components/CartProvider"
import { CartDrawer } from "@/components/CartDrawer"
import { Toast } from "@/components/Toast"
import { CookiesBanner } from "@/components/CookiesBanner"
import { GoogleAnalytics } from "@/components/GoogleAnalytics"
import { AnnouncementBar } from "@/components/AnnouncementBar"
import { OrganizationJsonLd, WebsiteJsonLd } from "@/components/StructuredData"
import { SITE_URL, SITE_NAME, SITE_DESCRIPTION } from "@/lib/seo"
import "./globals.css"

/**
 * Tipografías acordadas:
 *  - Bevan: display western para H1/hero (impacto, usar sparingly)
 *  - Zilla Slab: serif elegante para H2-H4 (jerarquía principal)
 *  - Inter: sans-serif para body + UI labels en caps
 *
 * Se cargan como CSS variables y se conectan al @theme de globals.css.
 */
const bevan = Bevan({
  variable: "--font-bevan",
  weight: "400",
  subsets: ["latin"],
  display: "swap",
})
const zilla = Zilla_Slab({
  variable: "--font-zilla",
  weight: ["400", "500", "700"],
  subsets: ["latin"],
  display: "swap",
})
const inter = Inter({
  variable: "--font-inter",
  weight: ["400", "500", "600"],
  subsets: ["latin"],
  display: "swap",
})

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} · Botas hechas en León, Guanajuato`,
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
    locale: "es_MX",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: `${SITE_NAME} · 380 años de experiencia. A la puerta de tu casa.`,
    description: SITE_DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} · Botas hechas en León`,
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
}

/**
 * viewport — tint la status bar de Safari iOS / Chrome Android en
 * cuero #4B2E1F. Señal visual premium que extiende el branding al chrome
 * del navegador.
 */
export const viewport: Viewport = {
  themeColor: "#4B2E1F",
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // Layout permanece SYNC — el CartProvider es client component que
  // hidrata desde localStorage en el navegador. Así todas las rutas
  // siguen siendo static + revalidate (lo que Amplify sí sirve sin 500).
  return (
    <html
      lang="es"
      className={`${bevan.variable} ${zilla.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-bg text-text">
        {/* Saltar al contenido — primer tab para usuarios de teclado, salta
            el Header repetido y aterriza en el <main id="contenido">. */}
        <a
          href="#contenido"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:bg-leather focus:text-bg focus:px-4 focus:py-2 focus:rounded"
        >
          Saltar al contenido
        </a>

        {/* Promo bar arriba de TODO — captura email/atención. Dismissible. */}
        <AnnouncementBar />

        {/* JSON-LD Schema.org global — Organization + WebSite con search */}
        <OrganizationJsonLd />
        <WebsiteJsonLd />

        {/* Klaviyo Onsite — se inyecta SOLO con consentimiento "todas"
            (ver KlaviyoLoader). El newsletter no depende de esto. */}
        <KlaviyoLoader />

        {/* GA4 con Consent Mode v2 — escucha botasleon:consent-change del
            CookiesBanner para promover analytics_storage. */}
        <GoogleAnalytics />

        <CartProvider>
          {children}
          <CartDrawer />
          <Toast />
        </CartProvider>
        <CookiesBanner />
      </body>
    </html>
  )
}
