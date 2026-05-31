import { CategoryStub } from "@/components/CategoryStub"

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

export const metadata = {
  title: "Botas para niños — BotasLeón",
  description: "Botas vaqueras y clásicas para niños y niñas, hechas en León.",
}
