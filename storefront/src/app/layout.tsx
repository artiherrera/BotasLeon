import type { Metadata } from "next"
import Script from "next/script"
import { Bevan, Zilla_Slab, Inter } from "next/font/google"
import { CartProvider } from "@/components/CartProvider"
import { CartDrawer } from "@/components/CartDrawer"
import { OrganizationJsonLd, WebsiteJsonLd } from "@/components/StructuredData"
import { SITE_URL, SITE_NAME, SITE_DESCRIPTION } from "@/lib/seo"
import "./globals.css"

const KLAVIYO_KEY = process.env.NEXT_PUBLIC_KLAVIYO_PUBLIC_KEY

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
  alternates: {
    canonical: SITE_URL,
  },
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
        {/* JSON-LD Schema.org global — Organization + WebSite con search */}
        <OrganizationJsonLd />
        <WebsiteJsonLd />

        {/* Klaviyo Onsite tracking — carga async, expone window.klaviyo */}
        {KLAVIYO_KEY && (
          <Script
            id="klaviyo-onsite"
            src={`https://static.klaviyo.com/onsite/js/klaviyo.js?company_id=${KLAVIYO_KEY}`}
            strategy="afterInteractive"
          />
        )}

        <CartProvider>
          {children}
          <CartDrawer />
        </CartProvider>
      </body>
    </html>
  )
}
