"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { LocalizedLink as Link } from "@/components/LocalizedLink"
import { useT } from "@/lib/i18n/context"
import { useProductTranslation } from "./LocalizedProductContent"
import { ProductCard } from "./ProductCard"
import { loadProductsByHandles } from "@/lib/search/client"
import { formatMoney } from "@/lib/utils"
import type { Product } from "@/lib/shopify/types"
import { cargarDescuentos, conDescuento, type MapaDescuentos } from "@/lib/descuentos"

/**
 * RecentlyViewed — "Sigue donde te quedaste".
 *
 * Guarda en el navegador los últimos 10 handles vistos. Dos modos:
 *
 *  - CON producto actual (el PDP): lo mete al inicio, quita repetidos, recorta
 *    a 10 y guarda. Al pintar se filtra a sí mismo — no tiene sentido mostrar
 *    la bota que ya estás viendo.
 *  - SIN producto actual (la portada, el catálogo): solo LEE. Abrir la portada
 *    no es "ver" una bota, así que no escribe nada.
 *
 * LAS TARJETAS SON LAS DEL SITIO, NO MINIATURAS. Antes esto pintaba una foto
 * chica y el nombre en gris; el dueño lo vio y lo dijo en dos palabras: "muy
 * soso". Ahora usa el mismo <ProductCard> del catálogo, así que trae marca,
 * modelo, sexo, horma, piel, estrellas, precio, precio tachado si lo hay y las
 * insignias de promoción. Una tira que enseña menos que el catálogo es una
 * tira que no vende.
 *
 * POR ESO LOS PRECIOS SE PIDEN EN VIVO. En el navegador solo se guardan los
 * handles; marca y precio salen de Shopify al montar. Guardar el precio en
 * localStorage habría ahorrado una petición y, a cambio, un día enseñaría un
 * precio viejo — y enseñar un precio que no es sale mucho más caro que una
 * petición. Si una bota desapareció de la tienda, no vuelve en la respuesta y
 * deja de aparecer aquí, que es justo lo que debe pasar.
 *
 * Mientras llegan los datos (o si Shopify falla) se pintan las fotos
 * guardadas: la sección nunca parpadea en vacío ni desaparece.
 */

const STORAGE_KEY = "botasleon:recently-viewed"
const MAX_ITEMS = 10
/** Cuántas se enseñan: cuatro llenan la fila del escritorio y dos filas
 *  limpias en teléfono. Sin huérfanas colgando. */
const EN_PANTALLA = 4

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
   *  - "pagina"  → sección de ancho completo con tarjetas (PDP, portada,
   *                final del catálogo).
   *  - "cajon"   → bloque estrecho dentro del carrito vacío: foto, nombre y
   *                precio. El cajón mide 480px y el dueño ya tuvo que pelear
   *                una vez para que no se llenara de cosas.
   */
  variante?: "pagina" | "cajon"
  /**
   * El cajón del carrito no se cierra solo al navegar (ningún enlace de dentro
   * lo hace: todos llaman a closeCart). Sin esto, el carrito se quedaría
   * abierto encima de la bota que acabas de abrir.
   */
  onNavegar?: () => void
  /** Clases del <section>. La portada aprieta el aire de abajo. */
  className?: string
}

export function RecentlyViewed({
  currentHandle,
  currentTitle,
  currentImage,
  variante = "pagina",
  onNavegar,
  className,
}: Props) {
  const t = useT()
  const [items, setItems] = useState<ViewedItem[]>([])
  const [productos, setProductos] = useState<Product[] | null>(null)
  // Lo que cada bota cuesta de verdad. Es el ÚNICO lugar del sitio donde se
  // enseña: decisión del dueño (ver lib/descuentos.ts).
  const [descuentos, setDescuentos] = useState<MapaDescuentos>({})

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
  const aPedir = others.slice(0, variante === "cajon" ? 4 : EN_PANTALLA)
  const llaves = aPedir.map((x) => x.handle).join(",")

  useEffect(() => {
    let vigente = true
    cargarDescuentos().then((d) => {
      if (vigente) setDescuentos(d)
    })
    return () => {
      vigente = false
    }
  }, [])

  // Los datos completos de esas botas, en vivo.
  useEffect(() => {
    if (!llaves) return
    let vigente = true
    loadProductsByHandles(llaves.split(","))
      .then((ps) => {
        if (vigente) setProductos(ps)
      })
      .catch(() => {
        // Shopify caído o sin red: nos quedamos con las fotos guardadas.
        if (vigente) setProductos(null)
      })
    return () => {
      vigente = false
    }
  }, [llaves])

  if (others.length < 1) return null

  if (variante === "cajon") {
    return (
      <section className="mt-10 w-full border-t border-border pt-6 text-left">
        <p className="eyebrow text-xs text-text-muted mb-3">{t("recent.title")}</p>
        <ul className="grid grid-cols-2 gap-3">
          {aPedir.map((item) => (
            <MiniaturaGuardada
              key={item.handle}
              item={item}
              producto={(() => {
                const p = productos?.find((x) => x.handle === item.handle)
                return p ? conDescuento(p, descuentos[p.handle]) : null
              })()}
              onNavegar={onNavegar}
            />
          ))}
        </ul>
      </section>
    )
  }

  return (
    <section className={className ?? "contenedor seccion border-t border-border"}>
      {/* Eyebrow genérico: va en gris. El cuero está reservado al eyebrow del
          taller, a los enlaces, a las estrellas y al hover del botón primario. */}
      <p className="eyebrow text-xs text-text-muted mb-2">{t("recent.eyebrow")}</p>
      <h3 className="display-m text-text mb-6">{t("recent.title")}</h3>
      {/* Misma rejilla que "Lo más nuevo" y que las exóticas: dos por fila en
          teléfono, cuatro en escritorio. La tira deja de ser un apéndice y se
          lee como una sección más de la portada. */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-6">
        {productos && productos.length > 0
          ? productos.map((p) => (
              <ProductCard
                key={p.id}
                product={conDescuento(p, descuentos[p.handle])}
                conGenero
                empezarEnSegunda
              />
            ))
          : aPedir.map((item) => <EsqueletoGuardado key={item.handle} item={item} />)}
      </div>
    </section>
  )
}

/**
 * Lo que se pinta mientras llegan los datos de Shopify: la foto guardada y el
 * nombre, en el mismo plato y con el mismo ritmo que la tarjeta real, para que
 * al llegar los precios nada salte de sitio.
 */
function EsqueletoGuardado({ item }: { item: ViewedItem }) {
  // Solo hay una foto guardada (la portada), así que aquí no se puede empezar
  // en la segunda: en cuanto llegan los datos de Shopify, la tarjeta de verdad
  // la sustituye y ya entra la segunda.
  const loc = useProductTranslation(item.handle)
  const title = loc?.title?.trim() || item.title
  return (
    <Link href={`/products/${item.handle}`} className="group block">
      <div className="plato mb-3">
        {item.image && (
          <Image src={item.image} alt={title} fill sizes="(max-width: 768px) 50vw, 25vw" />
        )}
      </div>
      <p className="nombre-producto px-1 text-text line-clamp-2">{title}</p>
    </Link>
  )
}

/**
 * La versión del cajón del carrito: foto, nombre y precio. Aquí no cabe una
 * tarjeta entera —son 480px de ancho y arriba va la compra—, pero el precio sí
 * cabe, y sin precio una bota no es una oferta: es una foto.
 */
function MiniaturaGuardada({
  item,
  producto,
  onNavegar,
}: {
  item: ViewedItem
  producto: Product | null
  onNavegar?: () => void
}) {
  const t = useT()
  const loc = useProductTranslation(item.handle)
  const title = loc?.title?.trim() || producto?.title || item.title
  const precio = producto?.priceRange.minVariantPrice
  const antes = producto?.compareAtPriceRange?.minVariantPrice
  const rebajada = !!antes && parseFloat(antes.amount) > parseFloat(precio?.amount ?? "0")
  const foto = producto?.featuredImage?.url || item.image
  return (
    <li>
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
          {foto && <Image src={foto} alt={title} fill sizes="200px" />}
        </div>
        <p className="nota text-text line-clamp-2 group-hover:underline underline-offset-4">
          {title}
        </p>
        {precio && (
          <p className="precio mt-0.5 text-sm">
            <span className={rebajada ? "text-leather" : "text-text"}>
              {formatMoney(precio.amount, precio.currencyCode)}
            </span>
            {rebajada && antes && (
              <span className="ml-1.5 font-normal text-text-subtle line-through">
                {formatMoney(antes.amount, antes.currencyCode)}
              </span>
            )}
          </p>
        )}
      </Link>
    </li>
  )
}
