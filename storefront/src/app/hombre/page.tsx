import { CategoryStub } from "@/components/CategoryStub"
import { pageMetadata } from "@/lib/seo"

export const revalidate = 60

export default function HombrePage() {
  return (
    <CategoryStub
      eyebrow="Hombre"
      title="Botas para hombre"
      description="Vaqueras, clásicas y botas de rancho hechas en León. Cada par seleccionado por su construcción, ajuste y durabilidad."
      taxonomyKey="gender"
      taxonomyHandle="masculino"
      configHint='el metacampo "Sexo objetivo" = Masculino'
    />
  )
}

export const metadata = pageMetadata({
  path: "/hombre",
  title: "Botas para hombre",
  description:
    "Botas vaqueras, clásicas y de rancho para hombre, hechas en León. Cuero auténtico, construcción artesanal mexicana.",
})
