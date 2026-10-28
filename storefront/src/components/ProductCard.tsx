"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import { LocalizedLink as Link } from "@/components/LocalizedLink"
import type { Product, Image as ShopifyImage } from "@/lib/shopify/types"
import { JudgemeStars } from "./JudgemeStars"
import { LocalizedPrice, useProductTranslation } from "./LocalizedProductContent"
import { useLocale, useT } from "@/lib/i18n/context"
import { atributosDeTarjeta, generoDeTarjeta } from "@/lib/shopify/facets"
import { coloresDeTarjeta, fotosDelColor, paramVariante } from "@/lib/colores-tarjeta"
import { ColorSwatch } from "./ColorSwatch"
import { facetLabel } from "@/lib/facets-i18n"
import { enPromoPar } from "@/lib/promocion"
import { saleInfo } from "@/lib/utils"
import { clasePlato } from "@/lib/fotos"

/**
 * Tarjeta de producto para grids (home, listing, marca page).
 *
 * La miniatura es un mini-carrusel: en móvil se hace SWIPE (scroll-snap nativo),
 * en desktop aparecen flechas discretas al pasar el mouse + puntos indicadores.
 * La tarjeta entera es el enlace al PDP (deslizar o usar las flechas NO navega).
 *
 * SIN compra rápida: la talla de 101 de los 103 productos no es variante sino
 * metacampo, así que agregar desde el grid creaba una línea sin talla que no
 * podía pagar hasta elegirla en el carrito. Se elige en la ficha, que es donde
 * vive el selector. (El candado de talla del carrito NO se toca: hay carritos
 * en localStorage creados antes de este cambio.)
 */

/**
 * Una bota es "nueva" durante 30 días. Medido sobre el catálogo real: con 30
 * días la insignia marca 12 de 103 productos; con 60 marcaría 63, o sea más de
 * la mitad del catálogo, y dejaría de querer decir nada.
 */
const DIAS_NUEVA = 30
const MS_POR_DIA = 24 * 60 * 60 * 1000

function esNueva(createdAt?: string | null): boolean {
  if (!createdAt) return false
  const alta = Date.parse(createdAt)
  if (Number.isNaN(alta)) return false
  return Date.now() - alta < DIAS_NUEVA * MS_POR_DIA
}

export function ProductCard({
  product,
  singleImage = false,
  empezarEnSegunda = false,
  conGenero = false,
}: {
  product: Product
  /**
   * Muestra solo la portada, sin el carrusel interno de fotos. Se usa dentro de
   * ProductRail: dos deslizadores horizontales anidados se disputan el gesto en
   * móvil y gana el de adentro, dejando el riel atascado.
   */
  singleImage?: boolean
  /**
   * Arranca en la SEGUNDA foto en vez de la portada. Lo pidió el dueño para
   * la página principal: ahí la segunda toma —normalmente el tres cuartos—
   * enseña mejor la bota que el perfil de la portada. Con el ratón encima se
   * pasa a la portada, así que el gesto sigue teniendo a dónde ir. Si la bota
   * solo tiene una foto no hay nada que voltear y se queda como está.
   */
  empezarEnSegunda?: boolean
  /**
   * Antepone "Hombre" o "Mujer" a la línea de atributos. Se enciende donde la
   * lista mezcla sexos —el catálogo completo, "Sigue donde te quedaste"— y se
   * deja apagado en /hombre y /mujer, donde sería la misma palabra en todas
   * las tarjetas de la pantalla.
   */
  conGenero?: boolean
}) {
  const t = useT()
  const { locale } = useLocale()
  const { handle, title, vendor, featuredImage, priceRange } = product
  const loc = useProductTranslation(handle)
  const displayTitle = loc?.title?.trim() || title
  const minPrice = priceRange.minVariantPrice
  const compareAt = product.compareAtPriceRange?.minVariantPrice

  // Galería: portada primero + el resto, sin duplicados. Máx 6.
  const seen = new Set<string>()
  const ordenada = [featuredImage, ...(product.images ?? [])]
    .filter((im): im is ShopifyImage => !!im?.url)
    .filter((im) => (seen.has(im.url) ? false : (seen.add(im.url), true)))
  // SIN RECORTAR TODAVÍA. El tope de seis se aplicaba aquí, y en una ficha de
  // dos colores las seis primeras son todas del primero: al elegir el segundo
  // no quedaba ni una foto suya que enseñar y la tarjeta se quedaba igual.
  // Ahora se filtra por color primero y se recorta después.
  const galeriaBase = ordenada

  /* "Horma · Piel": los dos únicos atributos que existen en los 103 productos
     (la suela no está capturada en ninguno). Vienen de Shopify en español, así
     que en el sitio en inglés hay que pasarlos por facetLabel. */
  // "Mujer · Redonda · Cuero". El sexo va PRIMERO porque es lo que primero se
  // descarta al mirar una bota, y solo donde la lista mezcla: en /mujer, donde
  // las 44 botas son de mujer, repetirlo 44 veces es ruido, no información.
  const genero = conGenero ? generoDeTarjeta(product) : null
  const atributos = [
    ...(genero ? [t(genero)] : []),
    ...atributosDeTarjeta(product).map((label) => facetLabel(label, locale)),
  ].join(" · ")

  const { onSale, discountPct } = saleInfo(minPrice.amount, compareAt?.amount)
  const promoPar = enPromoPar(product)
  const nueva = esNueva(product.createdAt)

  // El hover vive en la TARJETA, no en la galería: el dueño lo pidió "al pasar
  // el mouse por encima de las tarjetas", y eso incluye el nombre y el precio
  // de abajo, no solo la foto.
  const [encima, setEncima] = useState(false)

  /* LOS COLORES DE LA BOTA, cambiables sin abrir la ficha.
     Vacío cuando la bota es de un solo color: un control que no decide nada
     no se pinta. Elegido uno, la foto de la tarjeta pasa a ser la de ESE
     color y el enlace lleva `?variant=`, que la ficha ya sabe leer. */
  const colores = coloresDeTarjeta(product)
  const [colorElegido, setColorElegido] = useState<string | null>(null)
  const color = colores.find((c) => c.nombre === colorElegido) ?? null

  const href = color
    ? `/products/${handle}?variant=${paramVariante(color.variantId)}`
    : `/products/${handle}`

  /* LAS FOTOS DEL COLOR ELEGIDO, no una sola y no el revoltijo.
     Con los colores juntos en una ficha, la galería de la tarjeta mezclaba el
     coñac y el miel de la misma bota: pasabas el ratón y la bota cambiaba de
     color sin que nadie lo pidiera. El primer arreglo fue dejar UNA foto por
     color, y se llevó por delante el carrusel y el "empieza en la segunda"
     que el dueño había pedido para la portada — ocho botas de la portada se
     quedaron quietas. Ahora se filtra por el texto alternativo, que termina
     con el nombre del color, y el carrusel vuelve con las fotos de ESE color.
     Si una ficha no trae esa etiqueta, se queda con su galería de siempre. */
  const activo = colores.length > 1 ? (color ?? colores[0]) : null
  const delColor = (fotosDelColor(galeriaBase, activo) ?? []).slice(0, 6)
  const base = delColor.length > 0 ? delColor : galeriaBase.slice(0, 6)
  const gallery =
    empezarEnSegunda && base.length > 1 ? [base[1], base[0], ...base.slice(2)] : base

  return (
    /* El `group` y el hover viven en la RAÍZ, no en el enlace: la tarjeta se
       partió en dos enlaces —foto y texto— para poder meter los cuadritos de
       color entre ellos, y el subrayado del nombre y el "Elegir talla" tienen
       que seguir respondiendo al ratón esté donde esté dentro de la tarjeta. */
    <div
      className="group flex h-full flex-col"
      onMouseEnter={() => setEncima(true)}
      onMouseLeave={() => setEncima(false)}
    >
    {/* El enlace de la FOTO. Invisible para el lector de pantalla y fuera del
        recorrido del teclado: lleva al mismo sitio que el del nombre, y
        anunciar dos veces la misma bota es ruido. */}
    <Link href={href} aria-hidden tabIndex={-1} className="block">
      {/* La primera foto manda: si es de ambiente, el plato se porta distinto
          (llena el cuadro y no multiplica). En la tarjeta solo se ve una a la
          vez y el carrusel cambia entre ellas, así que la clase la fija la
          portada; mezclar tratos dentro de la misma tarjeta haría que la bota
          cambiara de tamaño al pasar el cursor. */}
      <div
        className={`plato ${clasePlato(gallery[0])} shrink-0 mb-3`}
      >
        {gallery.length === 0 ? (
          <PlaceholderImage />
        ) : singleImage ? (
          <Image src={gallery[0].url} alt={gallery[0].altText || title} fill sizes={SIZES} />
        ) : (
          <CardGallery
            key={color?.nombre ?? "base"}
            images={gallery}
            alt={title}
            encima={encima}
          />
        )}
        {/* Las insignias se apilan arriba a la izquierda. El agotado es el único
            en tinta sólida: es un estado que impide comprar, no un adorno.
            "Nueva" solo se pinta si la bota no está ya marcada por otra cosa —
            tres etiquetas encima de la foto serían ruido. */}
        <div className="absolute top-3 left-3 z-20 flex flex-col items-start gap-1">
          {!product.availableForSale && (
            <span className="bg-text/90 text-bg eyebrow text-xs px-2 py-1">
              {t("card.soldOut")}
            </span>
          )}
          {/* La promoción del par manda sobre "outlet" y sobre "nueva": UNA
              insignia por tarjeta. El precio tachado ya cuenta lo del outlet
              ahí abajo, y una fecha de alta pesa menos que medio par gratis. Va en tinta sobre crema, como el resto de
              las insignias; el único fondo sólido sigue siendo el agotado. */}
          {promoPar && product.availableForSale && (
            <span className="bg-bg text-text border border-text eyebrow text-xs px-2 py-1">
              {t("promoPar.insignia")}
            </span>
          )}
          {/* CUÁNTO, no "Outlet": "-20%" dice algo y una etiqueta genérica no.
              Desde 10% para arriba; por debajo basta con el precio tachado,
              porque un "-2%" encima de la foto es ruido con pretensiones. */}
          {onSale && !promoPar && discountPct >= 10 && (
            <span className="bg-bg text-text border border-text eyebrow text-xs px-2 py-1">
              −{discountPct}%
            </span>
          )}
          {nueva && product.availableForSale && !onSale && !promoPar && (
            <span className="bg-bg text-text border border-border eyebrow text-xs px-2 py-1">
              {t("card.badgeNew")}
            </span>
          )}
        </div>
      </div>
    </Link>

    {/* LOS CUADRITOS, PEGADOS A LA FOTO: es lo que cambian. Al final de la
        tarjeta, debajo de los meses sin intereses, colgaban como un apéndice y
        nadie los relacionaba con la imagen de arriba. El margen negativo los
        sube contra la foto; el `mb-3` del plato queda para ellos. */}
    {colores.length > 1 && (
      <div className="-mt-1 mb-3 flex flex-wrap items-center gap-1.5 px-1">
        {colores.map((c) => (
          <ColorSwatch
            key={c.nombre}
            value={c.nombre}
            hex={c.hex ?? undefined}
            isActive={c.nombre === (colorElegido ?? colores[0].nombre)}
            isAvailable={c.disponible}
            tamano="tarjeta"
            onClick={() => setColorElegido(c.nombre)}
          />
        ))}
      </div>
    )}

    <Link
      href={href}
      className="flex flex-1 flex-col"
      aria-label={
        product.availableForSale
          ? `${t("card.view")} ${displayTitle}`
          : `${t("card.view")} ${displayTitle} ${t("card.soldOutParen")}`
      }
    >
      <div className="flex flex-1 flex-col px-1">
        {/* El renglón de marca se pinta SIEMPRE, con un espacio duro cuando el
            producto no la trae: si desaparece, esa tarjeta sube todo lo de
            abajo y deja de cuadrar con sus vecinas. */}
        <p className="eyebrow text-xs text-leather mb-1">{vendor || " "}</p>
        {/* line-clamp-2: un nombre muy largo estiraba su tarjeta sola. */}
        <h3 className="nombre-producto text-text mb-1 line-clamp-2 group-hover:underline underline-offset-4">
          {displayTitle}
        </h3>
        {/* Mismo motivo que el vendor: 5 de los 103 productos no traen ni horma
            ni piel, y sin el espacio duro su precio subiría un renglón y
            rompería la línea base de la fila. */}
        <p className="nota mb-1">{atributos || " "}</p>
        {product.judgemeRating != null && product.judgemeRating > 0 && (
          <div className="mb-1">
            <JudgemeStars
              rating={product.judgemeRating}
              count={product.judgemeReviewCount ?? null}
              size="sm"
            />
          </div>
        )}
        {/* mt-auto: el precio se ancla al fondo del bloque de texto, así queda
            a la misma altura aunque una tarjeta traiga estrellas y otra no. */}
        <div className="mt-auto">
          <LocalizedPrice
            amount={minPrice.amount}
            currency={minPrice.currencyCode}
            compareAt={compareAt?.amount}
            size="card"
          />
          {/* Invitación que aparece al pasar el cursor. aria-hidden porque el
              enlace ya se anuncia como "Ver {título}" y si no, el lector de
              pantalla diría dos cosas por tarjeta. En móvil no se pinta: no hay
              hover y la tarjeta entera ya es el enlace. */}
          <span
            aria-hidden
            className="btn-ter hidden md:inline-block mt-2 text-sm opacity-0 transition duration-[180ms] group-hover:opacity-100"
          >
            {t("card.chooseSize")}
          </span>
        </div>
      </div>
    </Link>
    </div>
  )
}

// Lo que mide la tarjeta DE VERDAD en cada tramo, ahora que el listado llega a
// cinco por fila: a 1440px una tarjeta de cuatro columnas mide 256px, no los
// 360 que pedía el 25vw de antes. Declararlo de más hace que el navegador baje
// una foto del doble de peso por cada bota de la rejilla.
const SIZES =
  "(max-width: 768px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, (max-width: 1600px) 18vw, 260px"

function CardGallery({
  images,
  alt,
  encima,
}: {
  images: ShopifyImage[]
  alt: string
  /** El ratón está sobre la tarjeta. */
  encima: boolean
}) {
  const t = useT()
  const trackRef = useRef<HTMLDivElement>(null)
  const [idx, setIdx] = useState(0)
  // Si alguien usó las flechas, el hover deja de mandar mientras no salga la
  // tarjeta: pelearle el carrusel a quien lo está usando a mano es peor que no
  // tener el efecto.
  const aMano = useRef(false)
  const count = images.length

  /**
   * Con el ratón encima, la segunda foto. Al salir, la primera.
   *
   * INSTANTÁNEO, no con desplazamiento suave: el dueño pidió que cambiara "de
   * inmediato", y la pista lleva `scroll-smooth` en CSS, que le gana a
   * `behavior: "auto"` del scrollTo. Por eso se apaga el suave a mano, se
   * salta, y se devuelve en el siguiente cuadro para que las FLECHAS sigan
   * animando como antes.
   *
   * Solo en punteros finos: en un teléfono no hay hover, y algunos navegadores
   * disparan mouseenter al tocar — la foto cambiaría bajo el dedo justo cuando
   * se intenta abrir la ficha.
   */
  // El paso entre diapositivas es el ancho de la pista MÁS el hueco de 1px
  // (ver gap-px en la pista). Se lee del DOM y no se suma "1" a mano.
  const paso = (el: HTMLDivElement) => {
    const segunda = el.children[1] as HTMLElement | undefined
    return segunda?.offsetLeft || el.clientWidth
  }

  useEffect(() => {
    const el = trackRef.current
    if (!el || count < 2) return
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return
    if (encima && aMano.current) return
    if (!encima) aMano.current = false

    const destino = encima ? paso(el) : 0
    const antes = el.style.scrollBehavior
    el.style.scrollBehavior = "auto"
    el.scrollLeft = destino
    requestAnimationFrame(() => {
      if (trackRef.current) trackRef.current.style.scrollBehavior = antes
    })
  }, [encima, count])

  if (count === 1) {
    return <Image src={images[0].url} alt={images[0].altText || alt} fill sizes={SIZES} />
  }

  const onScroll = () => {
    const el = trackRef.current
    if (!el || el.clientWidth === 0) return
    const i = Math.round(el.scrollLeft / paso(el))
    if (i !== idx) setIdx(Math.min(Math.max(i, 0), count - 1))
  }

  // Las flechas van dentro del <a>: usamos <span role=button> (válido en anchor)
  // y frenamos la navegación con preventDefault + stopPropagation.
  const go = (dir: 1 | -1) => (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const el = trackRef.current
    if (!el) return
    aMano.current = true
    const next = Math.min(Math.max(idx + dir, 0), count - 1)
    el.scrollTo({ left: next * paso(el), behavior: "smooth" })
  }

  const Arrow = ({ dir, label }: { dir: 1 | -1; label: string }) => (
    <span
      role="button"
      aria-label={label}
      onClick={go(dir)}
      className={`hidden md:flex absolute top-1/2 -translate-y-1/2 z-10 h-10 w-10 items-center justify-center border border-border bg-bg/90 text-text cursor-pointer opacity-0 transition duration-[180ms] group-hover:opacity-100 hover:bg-text hover:text-bg ${
        dir === -1 ? "left-2" : "right-2"
      }`}
    >
      {dir === -1 ? "‹" : "›"}
    </span>
  )

  return (
    <>
      <div
        ref={trackRef}
        onScroll={onScroll}
        className="flex h-full w-full gap-px snap-x snap-mandatory overflow-x-auto scroll-smooth motion-reduce:scroll-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {images.map((im, i) => (
          /* `overflow-hidden` EN CADA DIAPOSITIVA, y no es cosmético: la foto va
             un 4% más grande que su caja (.plato-foto img { scale: 1.04 }) para
             tapar las orillas del archivo, y sin recorte propio ese 4% se sale
             de su diapositiva y asoma dentro de la vecina. Medido en un iPhone
             sobre las tarjetas de "otros modelos": las últimas columnas de una
             tarjeta con fondo crema salían azules (89,110,134) — era el
             pantalón de la foto siguiente. El dueño lo reportó como "una
             horrible franja vertical del lado derecho" en todas (2026-09-19).
             `.plato` recorta el conjunto, pero no cada foto. */
          <div key={i} className="relative h-full w-full flex-shrink-0 snap-center overflow-hidden">
            <Image
              src={im.url}
              alt={im.altText || alt}
              fill
              sizes={SIZES}
              loading={i === 0 ? undefined : "lazy"}
            />
          </div>
        ))}
      </div>

      {idx > 0 && <Arrow dir={-1} label={t("rail.prev")} />}
      {idx < count - 1 && <Arrow dir={1} label={t("rail.next")} />}

      {/* Puntos indicadores. Aquí el rounded-full se queda: son círculos de
          verdad, no una caja redondeada. */}
      <div className="pointer-events-none absolute bottom-2 left-0 right-0 z-10 flex justify-center gap-1.5">
        {images.map((_, i) => (
          <span
            key={i}
            className={`h-1.5 w-1.5 rounded-full transition-colors duration-[180ms] ${
              i === idx ? "bg-text" : "bg-text/30"
            }`}
          />
        ))}
      </div>
    </>
  )
}

function PlaceholderImage() {
  return (
    <div className="absolute inset-0 flex items-center justify-center text-text-subtle">
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect width="18" height="18" x="3" y="3" />
        <circle cx="9" cy="9" r="2" />
        <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
      </svg>
    </div>
  )
}
