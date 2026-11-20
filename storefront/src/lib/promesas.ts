import { isMX } from "@/lib/market"
import { ENVIO_GRATIS_SIEMPRE } from "@/lib/shipping-policy"
import { admiteCambioDeTalla } from "@/lib/exchange"
import type { Product } from "@/lib/shopify/types"

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
  icono: "whatsapp" | "envio" | "escudo" | "aduana" | "cambio" | "video"
  /**
   * En negritas, para que resalte entre las demás.
   *
   * Solo UNA de las cuatro la lleva. Si se destacan dos deja de haber
   * jerarquía: cuatro renglones en negritas se leen igual que cuatro en
   * redonda, y el ojo ya no sabe dónde posarse.
   *
   * Hoy la llevan dos promesas, y la invariante aguanta porque NUNCA
   * coinciden: el cambio de talla es solo de México y los aranceles solo de
   * Estados Unidos. Quien añada una tercera destacada tiene que comprobar
   * que tampoco coincida con ninguna de estas dos en el mismo mercado.
   */
  destacada?: boolean
}

/**
 * "Te mandamos video del par exacto antes de enviarlo".
 *
 * APAGADA otra vez, por encargo del dueño del 2026-11-12. Estuvo encendida
 * desde el 30 de septiembre. Prometerlo en 103 fichas lo decide él y no el
 * código, en los dos sentidos: encenderla y apagarla.
 *
 * Se deja la constante en vez de borrar el renglón: el texto sigue en el
 * diccionario y volver a prenderla es cambiar este `false`.
 */
export const PROMESA_VIDEO = false

/**
 * "No pagas aranceles: tu bota entra por el T-MEC".
 *
 * SOLO EN ESTADOS UNIDOS, y por mercado y no por idioma: botasleon.com/es lo
 * lee la diáspora y es la misma venta de exportación, mientras que en
 * botasleon.mx no hay aduana que cruzar y la frase no significaría nada.
 *
 * POR QUÉ ES VERDAD, para quien tenga que defenderlo o retirarlo:
 *
 * 1. La bota se fabrica en León. Una mercancía originaria de México entra a
 *    Estados Unidos con arancel 0 bajo el T-MEC, y esa exención sobrevivió a
 *    todos los cambios de régimen de 2025 y 2026 —el arancel general del 25%
 *    por IEEPA, su caída en la Corte, el recargo que lo sustituyó— porque
 *    todos ellos excluyen lo que califica como originario. El T-MEC es, hoy,
 *    el único refugio arancelario que queda.
 * 2. Estados Unidos suspendió de forma indefinida la exención de minimis (los
 *    800 dólares del Section 321). Desde entonces TODO paquete necesita
 *    entrada formal o informal, con su clasificación arancelaria. Es decir:
 *    el trámite ya no se evita por ser un pedido pequeño, y por eso tener la
 *    documentación lista dejó de ser un detalle y pasó a ser la diferencia
 *    entre una bota que llega y una detenida en la aduana.
 *
 * LO QUE ESTO NO PROMETE: la paquetería puede cobrar su propia cuota de
 * gestión aduanal, y hay estados que cobran impuesto sobre la venta. Ninguno
 * de los dos es un arancel. La letra chica de esa distinción va en /envios y
 * en el FAQ, no aquí: en la ficha cabe la promesa, no el tratado.
 *
 * CUÁNDO HAY QUE APAGAR ESTO: si un pedido dejara de salir con el certificado
 * de origen, o si el taller cambiara a materiales que no cumplan la regla de
 * origen del calzado. La exención no la da el país de ensamble, la da el
 * certificado — y lo que aquí se publica es una promesa de precio final.
 */
export const SIN_ARANCELES_TMEC = !isMX

/**
 * Las promesas de esta ficha, en el orden en que se leen.
 *
 * El cambio de talla VOLVIÓ el 2026-11-12, después de haberse retirado del
 * sitio entero el 30 de septiembre, pero ya no es la misma promesa: entonces
 * era “sin costo” en todos los modelos etiquetados y ahora el cliente paga el
 * envió de regreso y solo aplica donde el dueño lo prenda en Shopify. Por eso
 * el texto es nuevo y no el que se borró: prometer “sin costo” otra vez sería
 * resucitar justo la frase que hubo que barrer.
 *
 * Va la ÚLTIMA de la lista a propósito. Las otras tres explican por qué
 * comprar aquí; esta quita el miedo a equivocarse de talla, que es la última
 * duda que queda antes de pagar una bota que no te puedes probar.
 */
export function promesasDeFicha(product?: Pick<Product, "cambioTalla"> | null): Promesa[] {
  const lista: Promesa[] = []

  if (PROMESA_VIDEO) lista.push({ llave: "promesa.video", icono: "video" })

  // La asesoría por WhatsApp existe en los dos mercados: el botón y el número
  // están en lib/whatsapp.ts y el buscador de talla ya ofrece escribirnos.
  lista.push({ llave: "promesa.whatsapp", icono: "whatsapp" })

  // Envío: gratis de verdad en México; en Estados Unidos lo que se promete es
  // la rapidez, porque el envío cuesta más de 100 dólares y prometerlo gratis
  // fue exactamente el error que hubo que barrer del sitio entero.
  // El PLAZO va de letra chica bajo esa línea, en los dos mercados: el dueño
  // lo pidió el 2026-11-05 y hasta hoy la ficha mexicana no decía cuándo
  // llega —solo que el envío es gratis— y la americana prometía 2–3 días
  // hábiles, que es plazo de paquetería nacional, no de un paquete que cruza
  // la frontera. La cifra sale de lib/entrega.ts.
  lista.push({
    llave: ENVIO_GRATIS_SIEMPRE ? "promesa.envioMx" : "promesa.envioUs",
    nota: "envio.estimada",
    icono: "envio",
  })

  // ENTREGA SEGURA, en los dos mercados (encargo del dueño, 2026-11-19).
  // Lo que se promete es el paquete ASEGURADO Y RASTREABLE, no que nosotros
  // respondamos por lo que haga la paquetería: /devoluciones §4 dice que la
  // resolución depende de la paquetería o de la aseguradora, y una ficha que
  // prometiera más que la política sería la política la que queda mal.
  lista.push({ llave: "promesa.entregaSegura", icono: "escudo" })

  // Aranceles: solo en Estados Unidos, donde hay una aduana que cruzar. Ver
  // la nota larga de SIN_ARANCELES_TMEC arriba para por qué esto es verdad y
  // cuándo dejaría de serlo.
  if (SIN_ARANCELES_TMEC) {
    lista.push({
      llave: "promesa.aranceles",
      nota: "promesa.arancelesNota",
      icono: "aduana",
      // La destacada del mercado americano. Allá el cambio de talla no se
      // pinta nunca, así que sigue habiendo una sola en negritas por ficha.
      // Y es la que corresponde: lo que frena una compra de exportación no es
      // la talla, es no saber cuánto te van a cobrar al recibirla.
      destacada: true,
    })
  }

  // Cambio de talla: solo en México y solo donde esté prendido en Shopify.
  // La NOTA dice quién paga el regreso, y no es letra chica por casualidad:
  // es el término que convierte una sorpresa desagradable en una condición
  // que el cliente aceptó antes de pagar.
  if (admiteCambioDeTalla(product?.cambioTalla)) {
    lista.push({
      llave: "promesa.cambio",
      nota: "promesa.cambioNota",
      icono: "cambio",
      // La única en negritas de las cuatro, por encargo del dueño
      // (2026-11-12): es la que quita el miedo a equivocarse de talla
      // comprando una bota que no te puedes probar, y es lo más nuevo que
      // tiene la tienda que decir.
      destacada: true,
    })
  }

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
 * Cuatro desde el 2026-10-21: el dueño pidió que el cintillo dijera "Pago
 * seguro". Eran tres por una razón que sigue valiendo a medias —antes fue una
 * marquesina de cuatro mensajes en bucle y ninguno se leía entero—, pero lo
 * que mata la lectura es el movimiento, no el número: estas están quietas.
 * Medido con la cuarta puesta, para que no empuje la página.
 *
 * No son la misma lista traducida: en México el argumento es el envío gratis y
 * los meses; en Estados Unidos, el envío gratis y el hecho a mano. Los meses no
 * aparecen en la .com porque los MSI son de la banca mexicana y el checkout en
 * dólares no los ofrece (ver lib/msi.ts).
 */
export const PROMESAS_BARRA: readonly string[] = isMX
  ? ["aviso.mxEnvio", "aviso.mxMeses", "aviso.mxTalla", "aviso.pagoSeguro"]
  : [
      // LOS ARANCELES, PRIMEROS (pedido del dueño, 2026-11-19: "quiero que sea
      // parte del cintillo principal"). Delante del envío gratis a sabiendas:
      // a quien compra desde Estados Unidos no le sirve un envío gratis si
      // teme que le cobren al recibir el paquete. Se quita esa duda antes de
      // ofrecer nada más.
      "aviso.usAranceles",
      "aviso.usEnvio",
      "aviso.usHecho",
      PAGO_EN_4 ? "aviso.usPago4" : "aviso.usTalla",
      "aviso.pagoSeguro",
    ]
