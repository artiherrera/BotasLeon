"use client"

import { useT } from "@/lib/i18n/context"

/**
 * Las dos notas que van bajo el selector de talla, y el dato del modelo.
 *
 * Es el equivalente a la línea de Gymshark sobre sus leggings: decir de
 * antemano lo que el cliente descubriría al abrir la caja. En una venta a
 * distancia esa honestidad no cuesta ventas, ahorra devoluciones — que aquí
 * cuestan un envío de ida y otro de vuelta.
 *
 * SON TEXTOS DEL SITIO, NO DEL PRODUCTO, y hay que saberlo al leerlos: valen
 * igual para las 106 botas porque hablan de cómo trabaja el taller, no de un
 * modelo concreto. El informe las pedía "del modelo", y eso exigiría 106 notas
 * escritas a mano: el metacampo shopify.footwear-fit está vacío en los 106
 * productos (medido), así que no hay de dónde sacarlas. Cuando el dueño
 * escriba las suyas, el hueco es un metacampo y esto pasa a leerlo.
 *
 * El dato del modelo va aquí y no en un acordeón porque no existe acordeón de
 * talla —los cuatro son Descripción, Detalles, El taller y Envíos— y porque
 * este es el momento en que alguien está decidiendo su número.
 */
/**
 * La nota de AJUSTE va pegada al selector, no bajo los botones: es la única de
 * las tres que cambia qué número eliges, y para eso tiene que leerse ANTES de
 * elegir. Las otras dos son honestidad sobre el producto y pueden ir después
 * del botón — subirlas las tres empujaría el "Agregar al carrito" por debajo
 * del pliegue en un teléfono, que es justo lo que se arregló cerrando el
 * acordeón de descripción.
 */
export function NotaAjuste() {
  const t = useT()
  return (
    <p className="mt-3 text-sm leading-snug text-text-muted">
      <span className="text-text">{t("talla.ajusteTitulo")}</span>{" "}
      {t("talla.ajuste")}
    </p>
  )
}

export function PDPNotasTalla() {
  const t = useT()

  return (
    <div className="mt-4 space-y-2">
      <p className="text-sm leading-snug text-text-muted">
        <span className="text-text">{t("talla.modeloTitulo")}</span>{" "}
        {t("talla.modelo")}
      </p>
      <p className="text-sm leading-snug text-text-muted">
        <span className="text-text">{t("talla.honestoTitulo")}</span>{" "}
        {t("talla.honesto")}
      </p>
    </div>
  )
}
