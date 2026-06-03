import { notFound } from "next/navigation"
import { CategoryStub } from "@/components/CategoryStub"
import { pageMetadata } from "@/lib/seo"

/**
 * /nino/[estilo] — sub-rutas estáticas long-tail (vaqueras, clásicas)
 * que reemplazan el legacy ?estilo=X. URLs limpias e indexables.
 * El padre /nino sigue siendo el listado general.
 */

export const revalidate = 60

const VALID_STYLES = ["vaqueras", "clasicas"] as const
type EstiloNino = (typeof VALID_STYLES)[number]

const ESTILO_META: Record<EstiloNino, { label: string; description: string }> = {
  vaqueras: {
    label: "Vaqueras",
    description:
      "Botas vaqueras para niños — mini-vaqueras con la misma construcción artesanal que las de adulto. Cuero auténtico hecho en León.",
  },
  clasicas: {
    label: "Clásicas",
    description:
      "Botas clásicas para niños — caña media, casual, ideales para diario y escuela. Cuero auténtico, ajuste cómodo.",
  },
}

export async function generateStaticParams() {
  return VALID_STYLES.map((estilo) => ({ estilo }))
}

type Props = { params: Promise<{ estilo: string }> }

export default async function NinoEstiloPage({ params }: Props) {
  const { estilo } = await params
  if (!VALID_STYLES.includes(estilo as EstiloNino)) notFound()
  const meta = ESTILO_META[estilo as EstiloNino]
  return (
    <CategoryStub
      eyebrow={`Niños · ${meta.label}`}
      title={`Botas ${meta.label.toLowerCase()} para niños`}
      description={meta.description}
      taxonomyKey="age"
      taxonomyHandle="ninos"
      configHint='el metacampo "Grupo de edad" = Niños'
      initialStyle={estilo}
    />
  )
}

export async function generateMetadata({ params }: Props) {
  const { estilo } = await params
  if (!VALID_STYLES.includes(estilo as EstiloNino)) return {}
  const meta = ESTILO_META[estilo as EstiloNino]
  return pageMetadata({
    path: `/nino/${estilo}`,
    title: `Botas ${meta.label.toLowerCase()} para niños`,
    description: meta.description,
  })
}
