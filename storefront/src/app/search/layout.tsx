import { pageMetadata } from "@/lib/seo"

/**
 * Layout solo existe para exportar metadata. search/page.tsx es "use client"
 * (input + debounce + fetch desde el cliente), y los client components no
 * pueden exportar metadata — por eso vive aquí.
 */
export const metadata = pageMetadata({
  path: "/search",
  title: "Buscar",
  description: "Encuentra tus botas por marca, estilo o material.",
  noindex: true,
})

export default function SearchLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
