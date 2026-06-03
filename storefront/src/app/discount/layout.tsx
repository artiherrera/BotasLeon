import { pageMetadata } from "@/lib/seo"

/**
 * Layout solo existe para exportar metadata. discount/page.tsx es "use client"
 * (lee search params y aplica códigos en localStorage), y los client components
 * no pueden exportar metadata — por eso vive aquí.
 */
export const metadata = pageMetadata({
  path: "/discount",
  title: "Aplicar descuento",
  description: "Aplica tu código de descuento antes de pagar.",
  noindex: true,
})

export default function DiscountLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
