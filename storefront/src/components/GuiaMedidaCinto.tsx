"use client"

import { useT } from "@/lib/i18n/context"

/**
 * LA GUÍA DE MEDIDA DEL CINTO, en caja y a la vista.
 *
 * Un cinto se mide de la hebilla al agujero de en medio, no de la cintura: la
 * medida va dos pulgadas por encima de la talla de pantalón, así que quien usa
 * 32 necesita un 34. Es la duda que llegaba por WhatsApp y la causa de los
 * cambios de cinto.
 *
 * El texto ya estaba en los tres sitios donde se elige un cinto, pero en
 * `.nota`: 12.5px en gris apagado, debajo de los cuadros de talla. Es decir,
 * puesto exactamente donde no se lee — justo cuando la persona ya tiene el
 * dedo sobre el número de su pantalón. El dueño pidió el 2026-10-28 que se
 * viera más. Ahora va en caja sobre el fondo alterno, a 15px y en tinta
 * entera, con una regla al lado: pasa de pie de página a advertencia.
 *
 * No cambia el texto. Solo deja de esconderlo.
 *
 * Va en los TRES lugares donde se elige la medida —la ficha del cinto, el
 * armado del combo y la sugerencia del carrito— y por eso es una sola pieza:
 * son el mismo consejo y tienen que decir lo mismo siempre.
 */
export function GuiaMedidaCinto({ className = "" }: { className?: string }) {
  const t = useT()
  return (
    /* SIN ÍCONO, a propósito. Llevó una regla y justo debajo, en la ficha del
       cinto, está el botón "¿No sabes tu talla?" con otra regla: dos reglas
       apiladas hacían que un consejo y un botón parecieran lo mismo. Ahora la
       diferencia se lee sola — caja lisa es aviso, caja con ícono y flecha es
       algo que se toca. La caja y la tinta entera ya hacen el trabajo. */
    <div className={`border border-border bg-bg-alt px-3 py-2.5 ${className}`}>
      <p className="cuerpo text-text">
        <span className="font-medium">{t("talla.cintoTitulo")}</span>{" "}
        {t("talla.cinto")}
      </p>
    </div>
  )
}
