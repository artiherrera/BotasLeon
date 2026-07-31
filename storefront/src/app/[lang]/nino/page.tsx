import { CategoryStub } from "@/components/CategoryStub"
import { pageMetadata } from "@/lib/seo"

export const revalidate = 60

export default function NinoPage() {
  return (
    <CategoryStub
      eyebrow="cat.kids.eyebrow"
      title="cat.kids.title"
      description="cat.kids.desc"
      taxonomyKey="age"
      taxonomyHandle="ninos"
      configHint='el metacampo "Grupo de edad" = Niños'
    />
  )
}

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  return pageMetadata({
    locale: lang,
  path: "/nino",
  title: "Botas para niños",
  description:
    "Botas vaqueras y clásicas miniatura para niños y niñas — mismas marcas y construcción que las de adulto. Hechas en León.",
  })
}
