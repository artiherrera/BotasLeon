"use client"

import { useEffect, useState } from "react"
import { LocalizedLink as Link } from "@/components/LocalizedLink"
import Image from "next/image"
import type { HeroSlide } from "@/lib/shopify/types"
import { useLocale, useT } from "@/lib/i18n/context"
import { inContext } from "@/lib/market"

// Traducción EN del hero (metaobjeto hero_slide). El render del servidor trae
// el texto en español; en inglés pedimos la versión traducida (Translate &
// Adapt → Metaobjects) vía @inContext y la intercambiamos por handle. Reusa el
// token público del carrito.
const SF_DOMAIN = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN
const SF_TOKEN = process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN
const SF_VERSION = process.env.NEXT_PUBLIC_SHOPIFY_API_VERSION || "2025-01"

type HeroText = { eyebrow: string; title: string }
let heroEnCache: Promise<Map<string, HeroText>> | null = null

async function fetchHeroSlidesEN(): Promise<Map<string, HeroText>> {
  const out = new Map<string, HeroText>()
  if (!SF_DOMAIN || !SF_TOKEN) return out
  try {
    const res = await fetch(`https://${SF_DOMAIN}/api/${SF_VERSION}/graphql.json`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Storefront-Access-Token": SF_TOKEN,
        Accept: "application/json",
      },
      body: JSON.stringify({
        query: /* GraphQL */ `
          query HeroEN ${inContext('EN')} {
            metaobjects(type: "hero_slide", first: 20) {
              edges { node { handle fields { key value } } }
            }
          }
        `,
      }),
    })
    if (!res.ok) return out
    const json = (await res.json().catch(() => null)) as {
      data?: { metaobjects?: { edges?: Array<{ node?: { handle?: string; fields?: Array<{ key: string; value: string }> } }> } }
    } | null
    for (const edge of json?.data?.metaobjects?.edges ?? []) {
      const node = edge.node
      if (!node?.handle) continue
      const fields = new Map((node.fields ?? []).map((f) => [f.key, f.value]))
      out.set(node.handle, {
        eyebrow: fields.get("eyebrow") ?? "",
        title: fields.get("title") ?? "",
      })
    }
  } catch {
    // silencioso — si falla, se queda el español
  }
  return out
}

function loadHeroEN(): Promise<Map<string, HeroText>> {
  if (!heroEnCache) heroEnCache = fetchHeroSlidesEN()
  return heroEnCache
}

/**
 * HeroPortada — UNA sola imagen, sin carrusel.
 *
 * Sustituye al carrusel de cuatro slides con auto-rotación, Ken Burns, swipe y
 * puntos. Un carrusel en la portada reparte la atención entre cuatro mensajes y
 * gana el que el visitante alcance a leer; con uno solo, el primer golpe de
 * vista dice una cosa y la dice entera.
 *
 * De Shopify siguen llegando los cuatro metaobjetos `hero_slide` activos, ya
 * ordenados por sort_order: aquí se pinta el primero. El dueño elige cuál sale
 * sin tocar código, cambiando el orden o desactivando entradas en el admin.
 *
 * El bloque entero YA NO es un enlace: el único destino es el botón de
 * contorno, para que se vea dónde hay que dar clic.
 */

type Props = {
  slides?: HeroSlide[]
}

/**
 * Cuando el admin todavía no ha cargado ningún hero_slide. Fondo de tinta
 * plano, no degradado: el sistema visual no tiene ninguno. eyebrow/title
 * guardan LLAVES i18n y se resuelven con t() al render.
 */
const HERO_FALLBACK: HeroSlide = {
  id: "fallback",
  handle: "fallback",
  eyebrow: "hero.eyebrow",
  title: "hero.title",
  href: "/products",
  image: null,
}

/**
 * Quita el /es o /en que venga pegado en el link del metaobjeto.
 *
 * El campo "link_url" del hero se capturó con la URL completa
 * ("https://botasleon.com/es/products/…"), y getHeroSlides se queda con el
 * pathname tal cual, prefijo incluido. LocalizedLink respeta —a propósito— las
 * rutas que ya vienen prefijadas, así que el único botón de la portada mandaba
 * al visitante en inglés a la página en español. Quitando el prefijo aquí,
 * LocalizedLink vuelve a poner el del idioma activo.
 */
function sinPrefijoDeIdioma(href: string): string {
  if (!href.startsWith("/")) return href
  const limpio = href.replace(/^\/(es|en)(?=\/|$)/, "")
  return limpio === "" ? "/" : limpio
}

/**
 * Texto del botón según a DÓNDE lleva el slide.
 *
 * El metaobjeto `hero_slide` guarda un texto de enlace ("Ver la bota · $219")
 * pero getHeroSlides lo tira y solo conserva la URL, así que el botón tiene que
 * escoger su propia etiqueta. Y el slide que hoy está en primer lugar
 * (sort_order 1, "La que te vas a poner todos los días.") apunta a la FICHA de
 * una bota, no a una colección: con "Ver colección" fijo, el botón principal de
 * la portada prometía un listado y abría un solo producto.
 *
 * `reviews.seeBoot` trae la flecha pegada al texto ("Ver la bota →"); el botón
 * ya no lleva flecha, así que se recorta.
 */
function ctaKeyFor(href: string): "hero.ctaCollection" | "reviews.seeBoot" {
  return /\/products\/[^/]/.test(href) ? "reviews.seeBoot" : "hero.ctaCollection"
}

export function HeroPortada({ slides }: Props) {
  const t = useT()
  const { locale } = useLocale()

  // En inglés, trae el texto EN del metaobjeto y lo intercambia por handle.
  // Se carga una vez y se cachea a nivel módulo.
  const [heroEn, setHeroEn] = useState<Map<string, HeroText> | null>(null)
  useEffect(() => {
    // En español no se pide nada; el mapa que quede en memoria solo se lee
    // cuando el idioma es inglés, así que no hace falta limpiarlo.
    if (locale !== "en") return
    let active = true
    loadHeroEN().then((m) => {
      if (active) setHeroEn(m)
    })
    return () => {
      active = false
    }
  }, [locale])

  const first = slides && slides.length > 0 ? slides[0] : null

  // Sin slide de Shopify, el texto son llaves del diccionario; con slide, es
  // texto real del metaobjeto (y en inglés, su traducción si existe).
  const tr = first && locale === "en" && heroEn ? heroEn.get(first.handle) : undefined
  const slide: HeroSlide = first
    ? {
        ...first,
        eyebrow: tr?.eyebrow || first.eyebrow,
        title: tr?.title || first.title,
        href: sinPrefijoDeIdioma(first.href),
      }
    : {
        ...HERO_FALLBACK,
        eyebrow: t(HERO_FALLBACK.eyebrow),
        title: t(HERO_FALLBACK.title),
      }

  // LA CAJA CRECE HASTA EL TEXTO. En móvil el hero es una caja 16:10 (257px
  // en un teléfono de 412), y el bloque de texto —rótulo, titular de tres
  // renglones y botón— mide más que eso. Iba en posición absoluta pegado al
  // fondo, así que sobresalía por ARRIBA y `overflow-hidden` lo cortaba: en
  // un Android de 360px el rótulo perdía 37px, y un cliente lo reportó como
  // "la parte de arriba se ve cortada" (2026-09-17). Ahora el texto va en
  // flujo normal, con la caja en flex al fondo, y el 16:10 es un ALTO MÍNIMO
  // (62.5% del ancho) y no un aspect-ratio: con `overflow-hidden` la caja es
  // un contenedor de desplazamiento, su mínimo automático es 0 y aspect-ratio
  // la clavaba en 16:10 aunque el texto no cupiera —medido: seguía cortando
  // 37px—. Con min-height, la caja mide 16:10 cuando el texto cabe y crece lo
  // justo cuando no. En escritorio la altura es fija (70vh) y no cambia nada.
  return (
    <section
      className="relative flex w-full min-h-[62.5vw] flex-col justify-end md:h-[70vh] md:min-h-[520px] md:max-h-[680px] overflow-hidden bg-text"
      aria-label={slide.title}
    >
      {slide.image ? (
        <Image
          src={slide.image.url}
          alt={slide.image.altText || slide.title}
          fill
          preload
          sizes="100vw"
          className="object-cover"
        />
      ) : null}

      {/* Velo inferior para que el texto crema se lea también sobre las zonas
          claras de la foto. Es un recurso de legibilidad, no decoración. */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/25 to-transparent pointer-events-none" />

      {/* `relative` para quedar encima del velo (que es absoluto); pt-12 deja
          siempre un poco de foto a la vista por encima del rótulo cuando la
          caja tiene que crecer. */}
      <div className="relative pt-12 pb-8 md:pt-0 md:pb-16">
        <div className="contenedor">
          {slide.eyebrow && (
            <p className="eyebrow text-bg mb-3">{slide.eyebrow}</p>
          )}
          {/* whitespace-pre-line: el titular de respaldo trae sus saltos de
              renglón en el diccionario. */}
          <h2 className="display-xl text-bg max-w-[14ch] whitespace-pre-line">
            {slide.title}
          </h2>
          {/* .btn-sec es tinta sobre crema; aquí va sobre foto, así que el
              contorno y el texto se invierten a crema. */}
          <Link
            href={slide.href}
            className="btn btn-sec mt-6 border-bg text-bg hover:bg-bg hover:text-text hover:border-bg"
          >
            {t(ctaKeyFor(slide.href)).replace(/\s*→\s*$/, "")}
          </Link>
        </div>
      </div>
    </section>
  )
}
