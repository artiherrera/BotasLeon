import { CategoryStub } from "@/components/CategoryStub"

export const revalidate = 60

export default function MujerPage() {
  return (
    <CategoryStub
      eyebrow="Mujer"
      title="Botas para mujer"
      description="Vaqueras, botines, largas y de fashion en cuero auténtico. Tradición artesanal mexicana con silueta contemporánea."
      collectionHandle="mujer"
      collectionRuleHint='metacampo "Sexo objetivo" (target_gender) = Female'
    />
  )
}

export const metadata = {
  title: "Botas para mujer — BotasLeón",
  description: "Botas vaqueras, botines y largas para mujer, hechas en León.",
}
