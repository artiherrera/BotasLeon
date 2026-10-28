"use client"

import { useT } from "@/lib/i18n/context"
import { GuiaMedidaCinto } from "./GuiaMedidaCinto"

/**
 * La nota de ajuste que va bajo el selector de talla.
 *
 * Es un TEXTO DEL SITIO, no del producto, y hay que saberlo al leerlo: vale
 * igual para todas las botas porque habla de cómo trabaja el taller, no de un
 * modelo concreto. El metacampo shopify.footwear-fit está vacío en los 116
 * productos (medido), así que no hay de dónde sacar una nota por bota. Cuando
 * el dueño escriba las suyas, el hueco es ese metacampo y esto pasa a leerlo.
 *
 * Va PEGADA al selector y no debajo de los botones de compra: es lo único de
 * la ficha que cambia qué número eliges, y para eso tiene que leerse ANTES de
 * elegir.
 *
 * PENDIENTE: también sale en los 5 cinturones, que tienen selector de talla y
 * no tienen empeine.
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

/**
 * La guía del CINTO, que no es la de una bota.
 *
 * Un cinto se mide de la hebilla al agujero de en medio, no de la cintura, así
 * que la medida va dos pulgadas por encima de la talla de pantalón: quien usa
 * 32 necesita un 34. Era la pregunta que llegaba por WhatsApp y la razón de
 * los cambios de cinto, y hasta hoy el sitio no lo decía en ninguna parte.
 *
 * Sustituye a la nota de ajuste donde toca: "si tienes el empeine alto, sube
 * media talla" se pintaba también en los cinco cintos, que no tienen empeine.
 */
export function NotaCinto() {
  return <GuiaMedidaCinto className="mt-3" />
}

/* FUERA LA NOTA DEL MODELO DE LA FOTO (2026-10-08).
 *
 * Decía, en las 116 fichas: «En la foto: Arturo mide 1.78, calza 27 y usa la
 * 27.» No era verdad en ninguna. Las fotos del catálogo son de producto —
 * perfil, tres cuartos, el par, detalle de punta, suela—: NO hay una persona
 * en ellas. Encima salía igual en las 44 botas de mujer, atribuyéndoles las
 * medidas de un hombre, y en los 5 cinturones, donde "calza 27" no quiere
 * decir nada. La versión en inglés además convertía mal (decía 9 US cuando
 * 27 MX de hombre son 8: MX = US + 19).
 *
 * Nació copiando la línea de Gymshark sobre sus leggings —decir de antemano
 * lo que el cliente descubriría al abrir la caja— y sobrevivió a la limpieza
 * del 2026-09-30 con el argumento de que "sí ayuda a elegir número". Ayuda
 * cuando hay alguien en la foto. Aquí no lo había.
 *
 * Si algún día se fotografían botas puestas, esto vuelve, pero POR PRODUCTO
 * (un metacampo), no como texto del sitio: quien aparece en la foto cambia de
 * una bota a otra.
 */
