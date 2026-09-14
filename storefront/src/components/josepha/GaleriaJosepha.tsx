"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Image from "next/image"
import { useT } from "@/lib/i18n/context"
import type { Image as ImagenShopify } from "@/lib/shopify/types"

/**
 * Las fotos del botín, y una lupa que NO saca de la página.
 *
 * El dueño fue tajante: "no quiero que nada, nada te redirija a la página de
 * botasleon; que si das clic en una imagen solo veas la imagen más grande".
 * Antes cada foto era un enlace a la ficha del producto, o sea la puerta por
 * la que se escapaba el visitante que llegó por un anuncio. Ahora abre un
 * visor encima de la misma página.
 *
 * EL PLATO VA SOLO DETRÁS DE LA FOTO, no en todo el marco. Con el marco en 4:5
 * y las fotos todavía cuadradas, sobra aire arriba y abajo; si ese aire llevara
 * el color del plato (#F9FCFF, casi blanco azulado) se vería un recuadro más
 * claro dentro de la franja (#F4F4F0) — el mismo "canva feo" que ya se quitó
 * dos veces. Así que el marco lleva el color de la FRANJA y, dentro, una caja
 * con la proporción exacta de la foto lleva el plato. Cuando las fotos sean
 * 4:5 de origen, esa caja llenará el marco y el aire desaparecerá solo.
 *
 * PROPORCIÓN 4:5, la misma que el resto del sitio desde que el dueño decidió
 * subir las fotos nuevas en vertical (ver .plato en globals.css). Esta galería
 * NO usa la clase .plato —tiene su propio plato, calculado para el fondo de
 * esta página— así que el cambio de allá no llegaba aquí y Josepha se quedaba
 * en cuadrado mientras el catálogo entero iba en vertical.
 *
 * EL FONDO DEL VISOR ES CLARO, y eso no es gusto: las fotos van con
 * `mix-blend-mode: multiply` porque así el fondo de estudio se funde con el
 * rosa. Multiplicar contra un fondo NEGRO —lo normal en un visor de fotos—
 * daría una imagen negra, sin error de consola y sin que nadie lo note hasta
 * que un cliente intente ampliar una bota.
 */
export function GaleriaJosepha({
  imagenes,
  titulo,
  plato,
  fondo,
  acento,
  tinta,
  prioridad,
}: {
  imagenes: ImagenShopify[]
  titulo: string
  plato: string
  /** El color de la franja donde vive la galería. */
  fondo: string
  acento: string
  tinta: string
  /** La primera de la página carga con prioridad; las demás, en diferido. */
  prioridad: boolean
}) {
  const t = useT()
  const [abierta, setAbierta] = useState<number | null>(null)
  const cerrarRef = useRef<HTMLButtonElement>(null)

  const portada = imagenes[0]
  // Tope de tres debajo: con cuatro, la fila empieza a competir con la grande.
  const otras = imagenes.slice(1, 4)

  const cerrar = useCallback(() => setAbierta(null), [])
  const mover = useCallback(
    (paso: 1 | -1) =>
      setAbierta((i) =>
        i === null ? null : (i + paso + imagenes.length) % imagenes.length
      ),
    [imagenes.length]
  )

  // Escape cierra y las flechas mueven: un visor que solo se cierra con el
  // ratón deja atrapado a quien navega con teclado.
  useEffect(() => {
    if (abierta === null) return
    cerrarRef.current?.focus()
    const alPulsar = (e: KeyboardEvent) => {
      if (e.key === "Escape") cerrar()
      if (e.key === "ArrowRight") mover(1)
      if (e.key === "ArrowLeft") mover(-1)
    }
    window.addEventListener("keydown", alPulsar)
    // El fondo no se desplaza mientras el visor está abierto.
    const antes = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      window.removeEventListener("keydown", alPulsar)
      document.body.style.overflow = antes
    }
  }, [abierta, cerrar, mover])

  if (!portada) return null

  return (
    <>
      <button
        type="button"
        onClick={() => setAbierta(0)}
        aria-label={`${t("josepha.zoom")}: ${titulo}`}
        className="block w-full cursor-zoom-in"
      >
        <span
          className="flex aspect-[4/5] w-full items-center justify-center overflow-hidden"
          style={{ backgroundColor: fondo }}
        >
          <span
            className="relative block max-h-full max-w-full"
            style={{
              aspectRatio: proporcion(portada),
              width: "100%",
              backgroundColor: plato,
              isolation: "isolate",
            }}
          >
          <Image
            src={portada.url}
            alt={portada.altText || titulo}
            fill
            sizes="(min-width: 768px) 56vw, 100vw"
            priority={prioridad}
            className="object-contain mix-blend-multiply transition-transform duration-700 ease-out hover:scale-[1.03] motion-reduce:transition-none motion-reduce:hover:scale-100"
          />
          </span>
        </span>
      </button>

      {otras.length > 0 && (
        <div
          className="mt-3 grid gap-3"
          style={{ gridTemplateColumns: `repeat(${otras.length}, minmax(0, 1fr))` }}
        >
          {otras.map((im, j) => (
            <button
              key={im.url}
              type="button"
              onClick={() => setAbierta(j + 1)}
              aria-label={`${t("josepha.zoom")}: ${titulo} ${j + 2}`}
              className="flex aspect-[4/5] cursor-zoom-in items-center justify-center overflow-hidden"
              style={{ backgroundColor: fondo }}
            >
              <span
                className="relative block max-h-full w-full"
                style={{
                  aspectRatio: proporcion(im),
                  backgroundColor: plato,
                  isolation: "isolate",
                }}
              >
              <Image
                src={im.url}
                alt=""
                fill
                sizes="(min-width: 768px) 19vw, 33vw"
                loading="lazy"
                className="object-contain mix-blend-multiply transition-transform duration-700 ease-out hover:scale-[1.05] motion-reduce:transition-none motion-reduce:hover:scale-100"
              />
              </span>
            </button>
          ))}
        </div>
      )}

      {abierta !== null && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={titulo}
          className="fixed inset-0 z-[70] flex items-center justify-center p-4 md:p-10"
          style={{ backgroundColor: plato }}
        >
          <button
            type="button"
            aria-label={t("josepha.zoomClose")}
            onClick={cerrar}
            className="absolute inset-0 cursor-zoom-out"
          />

          <div className="pointer-events-none relative h-full w-full max-w-4xl">
            <Image
              src={imagenes[abierta].url}
              alt={imagenes[abierta].altText || titulo}
              fill
              sizes="100vw"
              className="object-contain mix-blend-multiply"
            />
          </div>

          {imagenes.length > 1 && (
            <>
              <button
                type="button"
                aria-label={t("josepha.zoomPrev")}
                onClick={() => mover(-1)}
                className="absolute left-3 top-1/2 flex h-14 w-14 -translate-y-1/2 items-center justify-center text-2xl md:left-8"
                style={{ color: tinta, border: `1px solid ${acento}` }}
              >
                ‹
              </button>
              <button
                type="button"
                aria-label={t("josepha.zoomNext")}
                onClick={() => mover(1)}
                className="absolute right-3 top-1/2 flex h-14 w-14 -translate-y-1/2 items-center justify-center text-2xl md:right-8"
                style={{ color: tinta, border: `1px solid ${acento}` }}
              >
                ›
              </button>
            </>
          )}

          <button
            ref={cerrarRef}
            type="button"
            onClick={cerrar}
            className="absolute right-3 top-3 flex h-14 w-14 items-center justify-center text-xl md:right-8 md:top-8"
            style={{ color: tinta, border: `1px solid ${acento}` }}
          >
            <span aria-hidden>✕</span>
            <span className="sr-only">{t("josepha.zoomClose")}</span>
          </button>

          <p
            className="absolute bottom-5 left-1/2 -translate-x-1/2 tracking-[0.24em]"
            style={{ color: tinta, fontSize: "0.8125rem" }}
          >
            {abierta + 1} / {imagenes.length}
          </p>
        </div>
      )}
    </>
  )
}

/** La proporción real de la foto, para que el plato la calce exacta. */
function proporcion(im: ImagenShopify): string {
  return im.width && im.height ? `${im.width} / ${im.height}` : "1 / 1"
}
