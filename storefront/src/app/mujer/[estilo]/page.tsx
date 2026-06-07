import { notFound } from "next/navigation"
import { CategoryStub } from "@/components/CategoryStub"
import { pageMetadata } from "@/lib/seo"

/**
 * /mujer/[estilo] — sub-rutas estáticas long-tail (vaqueras, clásicas,
 * largas, exóticas) que reemplazan el legacy ?estilo=X. URLs limpias e
 * indexables por Google. El padre /mujer sigue siendo el listado general.
 */

export const revalidate = 60

const VALID_STYLES = ["vaqueras", "botines", "clasicas", "largas", "exoticas"] as const
type EstiloMujer = (typeof VALID_STYLES)[number]

// `titleNoun` reemplaza al sustantivo "Botas" cuando la palabra-categoría ya
// es el sustantivo en sí (ej. "Botines para mujer" — NO "Botas botines para
// mujer"). Para Vaqueras/Clásicas/etc no hace falta.
const ESTILO_META: Record<
  EstiloMujer,
  { label: string; description: string; titleNoun?: string }
> = {
  vaqueras: {
    label: "Vaqueras",
    description:
      "Botas vaqueras para mujer — caña alta, silueta tradicional. Cuero auténtico hecho en León.",
  },
  botines: {
    label: "Botines",
    titleNoun: "Botines",
    description:
      "Botines vaqueros para mujer — caña corta tobillera, fashion y casual. Cuero hecho en León.",
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

function buildTitle(meta: { label: string; titleNoun?: string }, genderLabel: string): string {
  if (meta.titleNoun) return `${meta.titleNoun} para ${genderLabel}`
  return `Botas ${meta.label.toLowerCase()} para ${genderLabel}`
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
      title={buildTitle(meta, "mujer")}
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
    title: buildTitle(meta, "mujer"),
    description: meta.description,
  })
}
