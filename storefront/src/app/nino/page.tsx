import { CategoryStub } from "@/components/CategoryStub"
import { pageMetadata } from "@/lib/seo"

export const revalidate = 60

export default function NinoPage() {
  return (
    <CategoryStub
      eyebrow="Niños"
      title="Botas para niños"
      description="Vaqueras y clásicas miniatura, mismas marcas y misma construcción que las de adulto. Para los pies que más crecen."
      taxonomyKey="age"
      taxonomyHandle="ninos"
      configHint='el metacampo "Grupo de edad" = Niños'
    />
  )
}

export const metadata = pageMetadata({
  path: "/nino",
  title: "Botas para niños",
  description:
    "Botas vaqueras y clásicas miniatura para niños y niñas — mismas marcas y construcción que las de adulto. Hechas en León.",
})
