import { notFound } from "next/navigation"
import { CategoryStub } from "@/components/CategoryStub"
import { pageMetadata } from "@/lib/seo"

/**
 * /mujer/[estilo] — sub-rutas estáticas long-tail (vaqueras, clásicas,
 * largas, exóticas) que reemplazan el legacy ?estilo=X. URLs limpias e
 * indexables por Google. El padre /mujer sigue siendo el listado general.
 */

export const revalidate = 60

const VALID_STYLES = ["vaqueras", "clasicas", "largas", "exoticas"] as const
type EstiloMujer = (typeof VALID_STYLES)[number]

const ESTILO_META: Record<EstiloMujer, { label: string; description: string }> = {
  vaqueras: {
    label: "Vaqueras",
    description:
      "Botas vaqueras para mujer — caña alta, silueta tradicional. Cuero auténtico hecho en León.",
  },
  clasicas: {
    label: "Clásicas",
    description:
      "Botas clásicas para mujer — caña media, lisas, sin grabado. Versatilidad para diario, oficina y casual.",
  },
  largas: {
    label: "Largas",
    description:
      "Botas largas para mujer — sobre la rodilla, silueta fashion. Cuero auténtico con corte contemporáneo.",
  },
  exoticas: {
    label: "Exóticas",
    description:
      "Botas exóticas para mujer — avestruz, cocodrilo, pitón. Piezas de colección con CITES certificado.",
  },
}

export async function generateStaticParams() {
  return VALID_STYLES.map((estilo) => ({ estilo }))
}

type Props = { params: Promise<{ estilo: string }> }

export default async function MujerEstiloPage({ params }: Props) {
  const { estilo } = await params
  if (!VALID_STYLES.includes(estilo as EstiloMujer)) notFound()
  const meta = ESTILO_META[estilo as EstiloMujer]
  return (
    <CategoryStub
      eyebrow={`Mujer · ${meta.label}`}
      title={`Botas ${meta.label.toLowerCase()} para mujer`}
      description={meta.description}
      taxonomyKey="gender"
      taxonomyHandle="femenino"
      configHint='el metacampo "Sexo objetivo" = Femenino'
      initialStyle={estilo}
    />
  )
}

export async function generateMetadata({ params }: Props) {
  const { estilo } = await params
  if (!VALID_STYLES.includes(estilo as EstiloMujer)) return {}
  const meta = ESTILO_META[estilo as EstiloMujer]
  return pageMetadata({
    path: `/mujer/${estilo}`,
    title: `Botas ${meta.label.toLowerCase()} para mujer`,
    description: meta.description,
  })
}
