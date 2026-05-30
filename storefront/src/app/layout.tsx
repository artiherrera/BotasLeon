import type { Metadata } from "next"
import { Bevan, Zilla_Slab, Inter } from "next/font/google"
import { CartProvider } from "@/components/CartProvider"
import { CartDrawer } from "@/components/CartDrawer"
import { getCartFromCookie } from "@/lib/cart/queries"
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
  title: {
    default: "BotasLeón · Botas hechas en León, Guanajuato",
    template: "%s · BotasLeón",
  },
  description:
    "Botas premium fabricadas en León. Vaqueras, industriales, casuales. Tradición artesanal mexicana, envío a todo México y Estados Unidos.",
}

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // Cart inicial desde cookie + Shopify. Si el visitante nunca agregó nada
  // o su cart expiró, esto devuelve null y el provider arranca vacío.
  const initialCart = await getCartFromCookie()

  return (
    <html
      lang="es"
      className={`${bevan.variable} ${zilla.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-bg text-text">
        <CartProvider initialCart={initialCart}>
          {children}
          <CartDrawer />
        </CartProvider>
      </body>
    </html>
  )
}
