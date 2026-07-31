import { pageMetadata } from "@/lib/seo"

/**
 * Layout solo existe para exportar metadata. search/page.tsx es "use client"
 * (input + debounce + fetch desde el cliente), y los client components no
 * pueden exportar metadata — por eso vive aquí.
 */
export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  return pageMetadata({
    locale: lang,
  path: "/search",
  title: "Buscar",
  description: "Encuentra tus botas por marca, estilo o material.",
  noindex: true,
  })
}

export default function SearchLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
