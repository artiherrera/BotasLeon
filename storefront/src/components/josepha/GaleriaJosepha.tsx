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
  acento,
  tinta,
  prioridad,
}: {
  imagenes: ImagenShopify[]
  titulo: string
  plato: string
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
          className="relative block aspect-square w-full overflow-hidden"
          style={{ backgroundColor: plato, isolation: "isolate" }}
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
              className="relative block aspect-square cursor-zoom-in overflow-hidden"
              style={{ backgroundColor: plato, isolation: "isolate" }}
            >
              <Image
                src={im.url}
                alt=""
                fill
                sizes="(min-width: 768px) 19vw, 33vw"
                loading="lazy"
                className="object-contain mix-blend-multiply transition-transform duration-700 ease-out hover:scale-[1.05] motion-reduce:transition-none motion-reduce:hover:scale-100"
              />
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
