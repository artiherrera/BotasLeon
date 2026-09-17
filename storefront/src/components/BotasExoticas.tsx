"use client"

import { useMemo, useRef, useSyncExternalStore } from "react"
import { LocalizedLink as Link } from "@/components/LocalizedLink"
import { ProductCard } from "./ProductCard"
import { useLocale } from "@/lib/i18n/context"
import { barajar } from "@/lib/azar"
import type { Product } from "@/lib/shopify/types"

/**
 * BotasExoticas — ocho exóticas al azar, después de "Lo más nuevo".
 *
 * Pedido del dueño (2026-09-16): un agregado de tarjetas INDIFERENTE AL SEXO,
 * con "Botas Exóticas", una leyenda, y ocho botas exóticas al azar. Va justo
 * después de las dos filas de novedades, que sí son por género.
 *
 * EL AZAR SE TIRA EN EL NAVEGADOR, AL HIDRATAR. La primera versión barajaba
 * en el servidor confiando en que la portada se regenera cada 60 s
 * (revalidate en app/[lang]/page.tsx). Medido en producción: NO se regenera.
 * Amplify sirve la página del build hasta el siguiente deploy —el etag no
 * cambió en 7 minutos con lecturas que sí llegaron al origen— porque en
 * Lambda el trabajo "en segundo plano" con el que Next regenera se congela
 * al responder. Así que "al azar en el servidor" era "las mismas ocho hasta
 * el próximo deploy".
 *
 * Cómo se hace sin que la página salte ni llegue vacía:
 *   · El servidor manda la LISTA COMPLETA de exóticas (23 hoy, ~6 KB cada
 *     una sin comprimir, ~10 KB en total comprimidas) y pinta en el HTML las
 *     ocho primeras —las más vendidas— para quien no corre JavaScript:
 *     Google, los rastreadores, la vista previa de WhatsApp.
 *   · Al hidratar, useSyncExternalStore cambia a una elección al azar. Eso
 *     pasa en el primer segundo de vida de la página, y esta sección está
 *     lejos del primer pantallazo (tras el hero y dos filas de novedades):
 *     nadie la ve cambiar. Sin este hook, barajar en el cliente da un aviso
 *     de hidratación (el HTML del servidor no coincide con el del cliente).
 *
 * Mismo encabezado que LoMasNuevo —título, "Ver todo" a la derecha y una
 * regla— para que la portada se lea como una sola pieza; lo que cambia es lo
 * que va alrededor: la CITA centrada encima del bloque («Cada una es única»)
 * y la leyenda debajo del título, que aquí sí hace falta: "exóticas" no le
 * dice a todo el mundo qué pieles son ni por qué cuestan lo que cuestan.
 *
 * OCHO EN DOS FILAS DE CUATRO en escritorio (dos columnas en móvil, como las
 * novedades): el doble que una fila de novedades, porque aquí la gracia es la
 * variedad de pieles, y con cuatro no se ve.
 *
 * "Ver todo" lleva a /hombre/exoticas, la única página completa de exóticas
 * que existe (ver CategoryShowcase: /products?estilo= corta a 24). Hoy las 23
 * exóticas son de hombre; si aparecen de mujer, esta fila las enseña igual y
 * el enlace habrá que repensarlo.
 */

const CUANTAS = 8

// No hay nada externo que cambie: el "store" es la elección que se hace una
// vez por carga. subscribe no tiene a qué suscribirse.
const sinSuscripcion = () => () => {}

export function BotasExoticas({
  pool,
  href = "/hombre/exoticas",
}: {
  /** Todas las exóticas del mercado; aquí se eligen ocho. */
  pool: Product[]
  href?: string
}) {
  const { locale, t } = useLocale()

  // Lo que va en el HTML del servidor (y en la hidratación): las ocho
  // primeras, que llegan en orden de más vendidas. Memorizado porque React
  // exige que getServerSnapshot devuelva siempre la misma referencia.
  const primeras = useMemo(() => pool.slice(0, CUANTAS), [pool])

  // La elección al azar, hecha UNA vez por carga y guardada: getSnapshot debe
  // devolver la misma referencia mientras el pool no cambie, si no React
  // entra en bucle.
  const eleccion = useRef<{ pool: Product[]; elegidas: Product[] } | null>(null)
  const getSnapshot = () => {
    if (!eleccion.current || eleccion.current.pool !== pool) {
      eleccion.current = { pool, elegidas: barajar(pool).slice(0, CUANTAS) }
    }
    return eleccion.current.elegidas
  }
  const visibles = useSyncExternalStore(sinSuscripcion, getSnapshot, () => primeras)

  // Sin exóticas no se pinta la sección: un título con la rejilla vacía se
  // lee como una tienda rota.
  if (pool.length === 0) return null

  return (
    <section className="contenedor seccion">
      {/* LA CITA, sola y en medio de la página: centrada, en cursiva real
          (ver layout: la itálica de Instrument Serif viene en archivo) y entre
          comillas de cita textual. Así, palabra por palabra, la pidió el dueño
          después de dos intentos míos (un eyebrow, luego una línea en cuero
          pegada al título) que él leyó como "un título más". Una cita se
          distingue de un título por tres cosas y aquí van las tres: el centro,
          la cursiva y las comillas.

          Comillas por idioma: «» en español (y el punto fuera, como manda la
          ortografía), “” en inglés. Se ponen aquí y no en el diccionario para
          que la frase se pueda reusar sin comillas. */}
      <p className="display-m mb-10 text-center italic text-text md:mb-12">
        {locale === "en" ? "\u201C" : "\u00AB"}
        {t("exoticas.frase")}
        {locale === "en" ? "\u201D" : "\u00BB"}
      </p>

      <div className="mb-8 flex items-end justify-between gap-6 border-b border-border pb-4">
        <div>
          <h2 className="display-m">{t("exoticas.titulo")}</h2>
          <p className="cuerpo mt-3 max-w-[52ch] text-text-muted">
            {t("exoticas.leyenda")}
          </p>
        </div>
        {/* py-3 -my-3: objetivo táctil de 46px sin mover el texto, igual que
            en LoMasNuevo. */}
        <Link
          href={href}
          className="cuerpo -my-3 shrink-0 py-3 text-leather underline-offset-4 transition-colors duration-[180ms] hover:underline"
        >
          {t("nav.seeAll")}
          <span className="ml-1.5" aria-hidden>→</span>
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-6">
        {visibles.map((p) => (
          <ProductCard key={p.id} product={p} empezarEnSegunda />
        ))}
      </div>
    </section>
  )
}
