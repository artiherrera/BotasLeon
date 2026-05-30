import { CategoryStub } from "@/components/CategoryStub"

export const revalidate = 60

export default function HombrePage() {
  return (
    <CategoryStub
      eyebrow="Hombre"
      title="Botas para hombre"
      description="Vaqueras, botines y botas de rancho hechas en León. Cada par seleccionado por su construcción, ajuste y durabilidad."
    />
  )
}

export const metadata = {
  title: "Botas para hombre — BotasLeón",
  description: "Botas vaqueras, botines y de rancho para hombre, hechas en León.",
}
