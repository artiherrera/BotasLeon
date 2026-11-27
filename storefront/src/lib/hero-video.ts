import type { Image } from "@/lib/shopify/types"

/**
 * HERO EN VIDEO — de dónde sale y cómo se elige la copia que se sirve.
 *
 * Encargo del dueño (2026-11-26): le gustó el hero de apple.com/mx, que no es
 * una foto sino un video en bucle, sin sonido, que arranca al entrar en
 * pantalla y lleva un botón de pausa. Esto es la parte de datos; el render
 * está en components/HeroPortada.tsx.
 *
 * NO HIZO FALTA TOCAR EL ADMIN, y eso no fue suerte: el campo `image` del
 * metaobjeto `hero_slide` está definido como `file_reference` —no
 * `image_reference`—, así que acepta CUALQUIER archivo de la biblioteca de
 * Shopify, video incluido. El dueño sube el video en Contenido → Archivos y lo
 * elige en ese mismo campo. Si el campo tiene una foto, el hero sigue siendo
 * el de siempre; si tiene un video, se reproduce. Un solo campo, sin esquema
 * nuevo que mantener.
 *
 * EL VIDEO NO PUEDE VIVIR EN public/. Amplify deja de servir el sitio pasados
 * los 220 MB y hoy el build va en 193.6 (ver memoria del proyecto): un hero de
 * 4 MB se comería seis botas de margen. En la CDN de Shopify no cuesta nada de
 * ese presupuesto, y además Shopify transcodifica solo.
 */

/** Una copia del video tal como la devuelve la Storefront API. */
export type FuenteVideo = {
  url: string
  mimeType: string
  format: string
  width: number
  height: number
}

/** Lo que el componente necesita para pintar el video. */
export type VideoHero = {
  /** Copia ligera para teléfono. `null` si solo hay una. */
  movil: FuenteVideo | null
  /** La copia principal. Sin esta no hay video. */
  escritorio: FuenteVideo
  /** Fotograma de arranque: lo genera Shopify al subir el video. */
  poster: Image | null
  /** Texto alternativo del archivo en Shopify, para quien no ve el video. */
  alt: string
}

/** Lo más alto que se sirve. Un hero a 4K son megas que nadie distingue. */
const ALTO_MAXIMO = 1080

/** Debajo de esto la bota se ve sucia incluso en un teléfono. */
const ALTO_MINIMO_MOVIL = 480

/**
 * Elige qué copias del video se sirven.
 *
 * SHOPIFY DEVUELVE VARIAS Y UNA NO SIRVE. Al subir un video, Shopify
 * transcodifica a 480p, 720p y 1080p **y además genera un m3u8** (HLS). Un
 * `<video>` pelado solo toca el m3u8 en Safari, así que tomar `sources[0]` a
 * ciegas era una ruleta: en Chrome podía caer el HLS y el hero quedarse en
 * negro. Aquí se descarta todo lo que no sea mp4.
 *
 * Dos copias y no una: el mismo hero a 1080p pesa unas cuatro veces más que a
 * 480p, y en un teléfono de 412px de ancho esa diferencia no se ve — se paga.
 * El componente las ofrece con `media`, así que el navegador baja una sola.
 */
export function eligeFuentes(
  crudas: FuenteVideo[]
): { movil: FuenteVideo | null; escritorio: FuenteVideo } | null {
  const mp4 = crudas.filter((f) => f.format === "mp4" && f.url)
  if (mp4.length === 0) return null

  const porAlto = [...mp4].sort((a, b) => a.height - b.height)

  // Escritorio: la más alta que no pase de 1080. Si TODAS pasan (un video 4K
  // sin copias chicas), la más baja, que es la menos pesada de las grandes.
  const escritorio =
    [...porAlto].reverse().find((f) => f.height <= ALTO_MAXIMO) ?? porAlto[0]

  // Móvil: la más chica que llegue a 480. Si no hay ninguna, no se ofrece
  // copia aparte y el teléfono baja la de escritorio.
  const candidataMovil = porAlto.find((f) => f.height >= ALTO_MINIMO_MOVIL) ?? null
  const movil =
    candidataMovil && candidataMovil.url !== escritorio.url ? candidataMovil : null

  return { movil, escritorio }
}
