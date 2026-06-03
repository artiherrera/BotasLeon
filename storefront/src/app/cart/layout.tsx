import { pageMetadata } from "@/lib/seo"

/**
 * Layout solo existe para exportar metadata. cart/page.tsx es "use client"
 * (necesita useCart), y los client components no pueden exportar metadata —
 * por eso vive aquí.
 */
export const metadata = pageMetadata({
  path: "/cart",
  title: "Tu carrito",
  description: "Tus botas seleccionadas — revisa y procede al pago.",
  noindex: true,
})

export default function CartLayout({ children }: { children: React.ReactNode }) {
  return children
}
