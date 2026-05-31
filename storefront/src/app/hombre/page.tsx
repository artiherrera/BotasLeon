import { CategoryStub } from "@/components/CategoryStub"

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

export const metadata = {
  title: "Botas para hombre — BotasLeón",
  description: "Botas vaqueras, clásicas y de rancho para hombre, hechas en León.",
}
