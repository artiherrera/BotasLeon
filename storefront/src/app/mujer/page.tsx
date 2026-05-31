import { CategoryStub } from "@/components/CategoryStub"

export const revalidate = 60

export default function MujerPage() {
  return (
    <CategoryStub
      eyebrow="Mujer"
      title="Botas para mujer"
      description="Vaqueras, clásicas, largas y de fashion en cuero auténtico. Tradición artesanal mexicana con silueta contemporánea."
      taxonomyKey="gender"
      taxonomyHandle="femenino"
      configHint='el metacampo "Sexo objetivo" = Femenino'
    />
  )
}

export const metadata = {
  title: "Botas para mujer — BotasLeón",
  description: "Botas vaqueras, clásicas y largas para mujer, hechas en León.",
}
