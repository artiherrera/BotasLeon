import { notFound } from "next/navigation"
import { CategoryStub } from "@/components/CategoryStub"
import { pageMetadata } from "@/lib/seo"

/**
 * /hombre/[estilo] — sub-rutas estáticas long-tail (vaqueras, clásicas,
 * rancho, exóticas) que reemplazan el legacy ?estilo=X. URLs limpias e
 * indexables por Google. El padre /hombre sigue siendo el listado general.
 *
 * generateStaticParams + revalidate=60 hace que las 4 rutas se pre-rendericen
 * compatible con Amplify (export estático). notFound() evita que estilos
 * arbitrarios crashen el build dinámico.
 */

export const revalidate = 60

const VALID_STYLES = ["vaqueras", "clasicas", "rancho", "exoticas"] as const
type EstiloHombre = (typeof VALID_STYLES)[number]

const ESTILO_META: Record<EstiloHombre, { label: string; description: string }> = {
  vaqueras: {
    label: "Vaqueras",
    description:
      "Botas vaqueras para hombre — caña alta, silueta tradicional. Cuero auténtico hecho en León.",
  },
  clasicas: {
    label: "Clásicas",
    description:
      "Botas clásicas para hombre — caña media, lisas, sin grabado. Versatilidad para diario y oficina.",
  },
  rancho: {
    label: "Rancho",
    description:
      "Botas de rancho para hombre — diseñadas para faena, campo y trabajo rudo. Resistencia y confort.",
  },
  exoticas: {
    label: "Exóticas",
    description:
      "Botas exóticas para hombre — avestruz, cocodrilo, pitón. Piezas de colección con CITES certificado.",
  },
}

export async function generateStaticParams() {
  return VALID_STYLES.map((estilo) => ({ estilo }))
}

type Props = { params: Promise<{ estilo: string }> }

export default async function HombreEstiloPage({ params }: Props) {
  const { estilo } = await params
  if (!VALID_STYLES.includes(estilo as EstiloHombre)) notFound()
  const meta = ESTILO_META[estilo as EstiloHombre]
  return (
    <CategoryStub
      eyebrow={`Hombre · ${meta.label}`}
      title={`Botas ${meta.label.toLowerCase()} para hombre`}
      description={meta.description}
      taxonomyKey="gender"
      taxonomyHandle="masculino"
      configHint='el metacampo "Sexo objetivo" = Masculino'
      initialStyle={estilo}
    />
  )
}

export async function generateMetadata({ params }: Props) {
  const { estilo } = await params
  if (!VALID_STYLES.includes(estilo as EstiloHombre)) return {}
  const meta = ESTILO_META[estilo as EstiloHombre]
  return pageMetadata({
    path: `/hombre/${estilo}`,
    title: `Botas ${meta.label.toLowerCase()} para hombre`,
    description: meta.description,
  })
}
