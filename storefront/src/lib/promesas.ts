import { isMX } from "@/lib/market"
import { ENVIO_GRATIS_SIEMPRE } from "@/lib/shipping-policy"
import { admiteCambioDeTalla } from "@/lib/exchange"

/**
 * Las promesas de venta que van bajo el botón de compra en la ficha.
 *
 * Sustituyen a los cuatro íconos genéricos de antes (Cuero 100%, Hecho en
 * León, Garantía 15 días, Pago seguro), que decían lo mismo en las 103 fichas
 * y no ayudaban a decidir. Estas son razones para comprar hoy, y cada una se
 * pinta SOLO si es verdad en ese mercado y para ese producto.
 *
 * Nada de esto se decide por idioma: botasleon.com/es es venta de Estados
 * Unidos, así que un texto de México ahí sería una promesa falsa.
 */
export type Promesa = {
  /** Llave del diccionario con el texto. */
  llave: string
  /** Llave del diccionario con la letra chica, si la lleva. */
  nota?: string
  /** Ícono de trazo, del set único (Lucide, 20px, 1.5). */
  icono: "whatsapp" | "envio" | "cambio" | "video"
}

/**
 * La quinta promesa del informe —"te mandamos video del par exacto antes de
 * enviarlo"— viene APAGADA. No es una decisión de diseño: busqué "video" en el
 * diccionario, en las FAQ, en las políticas y en el resto del repo y no consta
 * en ninguna parte que ese video se mande siempre. Encenderla es prometerlo en
 * 103 fichas, y eso lo decide el dueño, no el código.
 */
export const PROMESA_VIDEO = false

export function promesasDeFicha(tags?: readonly string[] | null): Promesa[] {
  const lista: Promesa[] = []

  if (PROMESA_VIDEO) lista.push({ llave: "promesa.video", icono: "video" })

  // La asesoría por WhatsApp existe en los dos mercados: el botón y el número
  // están en lib/whatsapp.ts y el buscador de talla ya ofrece escribirnos.
  lista.push({ llave: "promesa.whatsapp", icono: "whatsapp" })

  // Cambio de talla: solo México, y solo en los modelos que el dueño etiquete
  // con "cambio-de-talla" en Shopify. Hoy no hay ninguno etiquetado, así que
  // esta promesa no se pinta en ninguna ficha hasta que los etiquete.
  if (admiteCambioDeTalla(tags)) {
    lista.push({ llave: "promesa.cambio", nota: "promesa.cambioNota", icono: "cambio" })
  }

  // Envío: gratis de verdad en México; en Estados Unidos lo que se promete es
  // la rapidez, porque el envío cuesta más de 100 dólares y prometerlo gratis
  // fue exactamente el error que hubo que barrer del sitio entero.
  lista.push({
    llave: ENVIO_GRATIS_SIEMPRE ? "promesa.envioMx" : "promesa.envioUs",
    icono: "envio",
  })

  return lista
}

/**
 * "Paga en 4 con Shop Pay" — REDACTADA Y APAGADA, a la espera de dos
 * comprobaciones que no puedo hacer desde el código.
 *
 * 1) Shop Pay no carga. Medido: shop.app corta la conexión (reset a los 0.13s)
 *    desde la máquina del dueño Y desde una red a miles de kilómetros, mientras
 *    shopify.com y checkout.shopify.com responden bien desde esas mismas redes.
 *    Anunciar en la cabecera un método de pago que revienta es peor que no
 *    anunciarlo: el cliente se entera de que falla DESPUÉS de querer pagar.
 *
 * 2) "Paga en 4" es Shop Pay Installments, que Shopify sirve solo a tiendas con
 *    Shopify Payments de ESTADOS UNIDOS —entidad, banco y contribuyente allá—.
 *    Esta tienda cobra desde México. Hasta que el dueño confirme en
 *    Configuración → Pagos que la tiene activa, anunciarla sería prometer un
 *    plazo que el checkout no ofrece.
 *
 * Para encenderla: poner true. El texto ya está en el diccionario.
 */
export const PAGO_EN_4 = false

/**
 * Las tres promesas de la barra de avisos, por MERCADO.
 *
 * Tres y no cuatro, y quietas: antes fue una marquesina de cuatro mensajes en
 * bucle y ninguno se leía entero —la línea que te interesaba ya se había ido—.
 * Tres caben de un vistazo en escritorio y envuelven en dos renglones en un
 * teléfono.
 *
 * No son la misma lista traducida: en México el argumento es el envío gratis y
 * los meses; en Estados Unidos, el envío gratis y el hecho a mano. Los meses no
 * aparecen en la .com porque los MSI son de la banca mexicana y el checkout en
 * dólares no los ofrece (ver lib/msi.ts).
 */
export const PROMESAS_BARRA: readonly string[] = isMX
  ? ["aviso.mxEnvio", "aviso.mxMeses", "aviso.mxTalla"]
  : [
      "aviso.usEnvio",
      "aviso.usHecho",
      PAGO_EN_4 ? "aviso.usPago4" : "aviso.usTalla",
    ]
