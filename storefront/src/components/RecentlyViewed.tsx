"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { LocalizedLink as Link } from "@/components/LocalizedLink"
import { useT } from "@/lib/i18n/context"
import { useProductTranslation } from "./LocalizedProductContent"

/**
 * RecentlyViewed — "Sigue donde te quedaste".
 *
 * Persistimos los últimos 10 productos vistos en localStorage. Dos modos:
 *
 *  - CON producto actual (el PDP): lo agregamos al inicio, dedup, recorte
 *    a 10 y guardamos. Para el render lo filtramos — no tiene sentido
 *    mostrarlo viéndose a sí mismo.
 *  - SIN producto actual (la portada, el catálogo): solo LEEMOS. Pintar la
 *    portada no es "ver" una bota, así que no escribe nada.
 *
 * El historial es de 10 porque la portada tiene ancho para dos filas de
 * cinco; en móvil se cortan a seis con CSS (dos filas de tres) para no
 * empujar el resto de la página.
 *
 * Guardamos { handle, title, image } completos para evitar un fetch
 * extra a Shopify. Trade-off: si el título cambia en admin, vemos el
 * stale hasta que el usuario vuelva a entrar al producto.
 *
 * Si el localStorage no está disponible (SSR, modo privado, etc.) o no
 * hay otros productos, retornamos null silenciosamente.
 */

const STORAGE_KEY = "botasleon:recently-viewed"
const MAX_ITEMS = 10

type ViewedItem = {
  handle: string
  title: string
  image: string | null
}

type Props = {
  /** Solo el PDP lo pasa. Sin él, el strip se limita a leer el historial. */
  currentHandle?: string
  currentTitle?: string
  currentImage?: string | null
  /**
   * Dónde se pinta:
   *  - "pagina"  → sección de ancho completo con su propio aire (PDP, portada,
   *                final del catálogo).
   *  - "cajon"   → bloque estrecho dentro del carrito vacío: sin contenedor,
   *                dos por fila y solo cuatro. El cajón mide 400px y el dueño
   *                ya tuvo que pelear una vez para que no se llenara de cosas.
   */
  variante?: "pagina" | "cajon"
  /**
   * El cajón del carrito no se cierra solo al navegar (ningún enlace de dentro
   * lo hace: todos llaman a closeCart). Sin esto, el carrito se quedaría
   * abierto encima de la bota que acabas de abrir.
   */
  onNavegar?: () => void
}

export function RecentlyViewed({
  currentHandle,
  currentTitle,
  currentImage,
  variante = "pagina",
  onNavegar,
}: Props) {
  const t = useT()
  const [items, setItems] = useState<ViewedItem[]>([])

  useEffect(() => {
    let stored: ViewedItem[] = []
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed)) {
          // Filtramos entries malformados — protege contra cambios de schema
          stored = parsed.filter(
            (x): x is ViewedItem =>
              x && typeof x.handle === "string" && typeof x.title === "string"
          )
        }
      }
    } catch {
      // localStorage no disponible o JSON inválido — empezamos limpio
      stored = []
    }

    // Sin producto actual (portada, catálogo) no escribimos: solo leemos.
    if (!currentHandle) {
      setItems(stored.slice(0, MAX_ITEMS))
      return
    }

    const current: ViewedItem = {
      handle: currentHandle,
      title: currentTitle ?? currentHandle,
      image: currentImage ?? null,
    }

    const deduped = [current, ...stored.filter((x) => x.handle !== currentHandle)].slice(
      0,
      MAX_ITEMS
    )

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(deduped))
    } catch {
      // quota exceeded — no rompemos, solo perdemos persistencia
    }

    setItems(deduped)
  }, [currentHandle, currentTitle, currentImage])

  const others = items.filter((x) => x.handle !== currentHandle)
  if (others.length < 1) return null

  if (variante === "cajon") {
    return (
      <section className="mt-10 w-full border-t border-border pt-6 text-left">
        <p className="eyebrow text-xs text-text-muted mb-3">{t("recent.title")}</p>
        <ul className="grid grid-cols-2 gap-3">
          {others.slice(0, 4).map((item) => (
            <RecentItem key={item.handle} item={item} onNavegar={onNavegar} />
          ))}
        </ul>
      </section>
    )
  }

  /** Hasta dónde llega la última fila COMPLETA (3 por fila abajo de lg, 5
      arriba). Con menos de una fila no hay nada que cortar. */
  const filaCompleta = (porFila: number, tope: number) =>
    others.length <= porFila
      ? others.length
      : Math.min(tope, Math.floor(others.length / porFila) * porFila)
  const topeChico = filaCompleta(3, 6)
  const topeGrande = filaCompleta(5, MAX_ITEMS)

  return (
    <section className="contenedor seccion border-t border-border">
      {/* Eyebrow genérico: va en gris. El cuero está reservado al eyebrow del
          taller, a los enlaces, a las estrellas y al hover del botón primario. */}
      <p className="eyebrow text-xs text-text-muted mb-2">{t("recent.eyebrow")}</p>
      <h3 className="display-m text-text mb-6">{t("recent.title")}</h3>
      {/* Cinco por fila de 1024 para arriba (antes seis, que dejaba las fotos
          en miniaturas de 150px); tres en teléfono y tableta, con tope de dos
          filas para no empujar media portada.

          Las filas se cortan COMPLETAS: con seis botas en el historial, un
          escritorio pinta cinco y no cinco más una huérfana colgando sola a la
          izquierda. Por eso el corte se calcula dos veces, una por tamaño. */}
      <ul className="grid grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6">
        {others.map((item, i) => (
          <RecentItem
            key={item.handle}
            item={item}
            enChico={i < topeChico}
            enGrande={i < topeGrande}
            onNavegar={onNavegar}
          />
        ))}
      </ul>
    </section>
  )
}

/**
 * Un item del strip. Es su propio componente para poder usar el hook de
 * traducción (en inglés cambia el título por su versión EN — mismo fetch
 * cacheado que usan las tarjetas y el PDP).
 */
function RecentItem({
  item,
  enChico = true,
  enGrande = true,
  onNavegar,
}: {
  item: ViewedItem
  /** Si entra en la última fila completa de 3 (teléfono y tableta). */
  enChico?: boolean
  /** Si entra en la última fila completa de 5 (1024 para arriba). */
  enGrande?: boolean
  onNavegar?: () => void
}) {
  const t = useT()
  const loc = useProductTranslation(item.handle)
  const title = loc?.title?.trim() || item.title
  const visibilidad =
    enChico && enGrande
      ? undefined
      : enGrande
        ? "hidden lg:block"
        : enChico
          ? "lg:hidden"
          : "hidden"
  return (
    <li className={visibilidad}>
      <Link
        href={`/products/${item.handle}`}
        onClick={onNavegar}
        className="group block"
        aria-label={`${t("card.view")} ${title}`}
      >
        {/* El plato pintado ES el marcador de posición: cuando localStorage
            devuelve una foto que aún no carga, se ve el fondo cálido y no un
            cuadro blanco, así que el SVG de silueta que había aquí sobra. */}
        <div className="plato mb-2">
          {item.image && (
            <Image src={item.image} alt={title} fill sizes="(max-width: 768px) 33vw, 20vw" />
          )}
        </div>
        <p className="nota text-text line-clamp-2 group-hover:underline underline-offset-4">
          {title}
        </p>
      </Link>
    </li>
  )
}
