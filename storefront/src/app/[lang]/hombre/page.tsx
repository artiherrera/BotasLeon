import { CategoryStub } from "@/components/CategoryStub"
import { pageMetadata } from "@/lib/seo"

export const revalidate = 60

export default function HombrePage() {
  return (
    <CategoryStub
      eyebrow="cat.men.eyebrow"
      title="cat.men.title"
      description="cat.men.desc"
      taxonomyKey="gender"
      taxonomyHandle="masculino"
      configHint='el metacampo "Sexo objetivo" = Masculino'
    />
  )
}

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  return pageMetadata({
    locale: lang,
  path: "/hombre",
  title: "Botas para hombre",
  description:
    "Botas vaqueras, clásicas y de rancho para hombre, hechas en León. Cuero auténtico, construcción artesanal mexicana.",
  })
}
