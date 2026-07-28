import { CategoryStub } from "@/components/CategoryStub"
import { pageMetadata } from "@/lib/seo"

export const revalidate = 60

export default function MujerPage() {
  return (
    <CategoryStub
      eyebrow="cat.women.eyebrow"
      title="cat.women.title"
      description="cat.women.desc"
      taxonomyKey="gender"
      taxonomyHandle="femenino"
      configHint='el metacampo "Sexo objetivo" = Femenino'
    />
  )
}

export const metadata = pageMetadata({
  path: "/mujer",
  title: "Botas para mujer",
  description:
    "Botas vaqueras, clásicas, largas y de fashion para mujer en cuero auténtico — tradición artesanal de León con silueta contemporánea.",
})
