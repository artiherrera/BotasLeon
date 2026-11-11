"use client"

import { useT } from "@/lib/i18n/context"
import { LocalizedLink as Link } from "@/components/LocalizedLink"
import { dosCifras, type CuentaBuenFin } from "@/lib/buenfin"
import {
  ROJO_OFERTA,
  RUTA_OFERTAS,
  descuentoVisible,
  enAntesala,
  DESCUENTO_ANUNCIADO,
  DIA_INICIO,
  DIA_FIN,
} from "@/lib/ofertas/config"
import { DESCUENTO_MAXIMO_REAL } from "@/lib/ofertas/maximo"

/**
 * EL BLOQUE DEL BUEN FIN: logo oficial, lo que se ofrece y el cronómetro.
 *
 * Lo pidió el dueño el 2026-11-10: "pon el logo del Buen Fin, y un cintillo
 * (el que siempre usamos) en color rojo, y un cronómetro diciendo para cuándo
 * comienza el Buen Fin. Con descuentos de hasta 30%, meses sin intereses".
 *
 * Va DENTRO de la barra de avisos de siempre, en el hueco donde va la
 * promoción —no es una franja nueva apilada encima—: el cintillo es el mismo,
 * lo que cambia es que se pone rojo mientras dura la campaña. Cuando el Buen
 * Fin termina, la barra vuelve sola a su tinta de siempre.
 */

/**
 * El rojo de la campaña. Vive en lib/ofertas/config.ts porque lo comparte con
 * las insignias de descuento de las tarjetas.
 *
 * NO ES EL ROJO EXACTO DEL MANUAL, y es a sabiendas. El oficial es Pantone
 * 1797 C = #ED1C24, que con texto blanco encima da 4.38:1 y se queda corto
 * del 4.5:1 que pide la AA para texto normal —y todo lo que lleva este
 * cintillo es texto chico—. El de aquí es el mismo rojo un punto más hondo y
 * sube a 5.89:1. El logotipo NO se toca: va con sus colores oficiales, y lo
 * que cambia es la pleca sobre la que se posa, que el manual admite en rojo,
 * blanco o negro justamente "para garantizar su visibilidad".
 */
export const ROJO_BUEN_FIN = ROJO_OFERTA

/**
 * EL LOGO OFICIAL.
 *
 * Es marca registrada de CONCANACO SERVYTUR y solo puede usarlo un comercio
 * registrado. El dueño se registró el 2026-11-10 y con eso llegó el derecho a
 * usarlo; el archivo sale del kit oficial que publica elbuenfin.org
 * (Descargable_El_Buen_Fin_2026.zip), no de una imagen pescada de internet.
 *
 * ES LA VERSIÓN "MIPYMES" Y LA VARIANTE PARA FONDOS OSCUROS. El kit solo trae
 * el logotipo en convivencia con el acrónimo MIPYMES —así es como se le
 * entrega a un comercio pequeño, y el manual prohíbe quitarle ese acrónimo o
 * sus elementos—, y de las dos variantes esta es la que lleva el eslogan en
 * blanco y la cápsula MIPYMES rellena, que es lo que se lee sobre el rojo. La
 * otra, pensada para fondo claro, se pierde: comprobado componiendo las dos
 * sobre #C8102E antes de elegir.
 *
 * ES LA VERTICAL AUNQUE EL HUECO SEA UNA FRANJA. El manual dice en una página
 * que en espacios reducidos va la horizontal, y en la de banners digitales
 * dibuja el caso exacto que es este —"mobile leaderboard", 320×50 px, pleca
 * roja, logotipo VERTICAL ocupando el alto de la barra y el claim al lado—.
 * Mandó el ejemplo que se parece al nuestro. Además, a igualdad de alto la
 * vertical le da más tamaño al calendario, que es la parte que se reconoce.
 *
 * El archivo (public/buen-fin.png) es ese PNG recortado de su aire
 * transparente y bajado a 256px de alto: se ve a 48–60, así que queda 4x de
 * sobra, y pesa 15.5 KB con paleta, que importa porque Amplify corta el
 * sitio en 220 MB.
 *
 * LO QUE EL MANUAL PROHÍBE, para quien toque esto después: recolorearlo,
 * deformarlo (de ahí el alto fijo con el ancho en `auto`, nunca los dos),
 * rotarlo, cambiarle la tipografía, quitarle el MIPYMES o meter cualquier
 * cosa dentro de su área de restricción —media raya de 0.5 cm sobre 6 cm de
 * alto, o sea un 8% del alto: los 16px del `gap` de la barra la respetan con
 * holgura a cualquiera de los dos tamaños—.
 */
const LOGO_BUEN_FIN = "/buen-fin.png"
const LOGO_ANCHO = 263
const LOGO_ALTO = 256

export function BuenFinCintillo({ cuenta }: { cuenta: CuentaBuenFin }) {
  const t = useT()

  /**
   * ¿Lleva a las ofertas o no lleva a ninguna parte?
   *
   * Con el interruptor de lib/ofertas/config.ts apagado, la página de ofertas
   * no tiene nada que enseñar —el descuento sigue existiendo en Shopify, pero
   * solo se aplica en el carrito— y mandar ahí a quien toca el cintillo es
   * mandarlo a un "sin ofertas por ahora". Entonces el cintillo se queda como
   * estaba: un aviso que se lee, no un enlace.
   *
   * El texto NO cambia: "hasta 30% de descuento" sigue siendo verdad con el
   * interruptor apagado; lo único que cambia es dónde se ve el descuento.
   */
  const llevaAOfertas = descuentoVisible() || enAntesala()

  /**
   * ANTES DEL 13 NO HAY NADA QUE SIMULAR, así que el porcentaje sale del
   * número anunciado a mano y el cintillo dice además LAS FECHAS: el reloj
   * cuenta cuánto falta, pero no dice cuándo. En cuanto arranca la campaña
   * manda otra vez lo que la caja cobra de verdad.
   */
  const antesala = enAntesala()
  const anuncio = antesala
    ? t("buenfin.antesala")
        .replace("{ini}", String(DIA_INICIO))
        .replace("{fin}", String(DIA_FIN))
        .replace("{pct}", String(DESCUENTO_ANUNCIADO))
    : t("buenfin.oferta").replace("{pct}", String(DESCUENTO_MAXIMO_REAL))

  const casillas = [
    { n: cuenta.dias, u: t("buenfin.dias") },
    { n: cuenta.horas, u: t("buenfin.horas") },
    { n: cuenta.minutos, u: t("buenfin.minutos") },
    { n: cuenta.segundos, u: t("buenfin.segundos") },
  ]

  const clases = "flex items-center justify-center gap-3 md:gap-4"

  const contenido = (
    <>
      {/* Etiqueta <img> y no next/image a propósito: es un logo fijo y pequeño
          que vive en /public, y pasarlo por el optimizador solo añadiría una
          petición y una variante que nadie necesita. Lleva `width` y `height`
          para que el navegador aparte el hueco antes de descargarlo y la barra
          no dé un brinco al cargar.

          El texto alternativo dice LAS FECHAS, que es el dato que el logo
          lleva escrito en su banda roja pero a este tamaño nadie alcanza a
          leer, y que el cronómetro cuenta sin pronunciar (ver aria-live abajo:
          un contador que se anuncia cada segundo hace inservible la página
          para quien la escucha). Antes esto era un aria-label en el <div> de
          aquí arriba, que sin un `role` encima casi ningún lector anuncia; en
          una imagen, en cambio, siempre se lee. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={LOGO_BUEN_FIN}
        width={LOGO_ANCHO}
        height={LOGO_ALTO}
        alt={t("buenfin.aria")}
        className="h-11 w-auto shrink-0 md:h-[3.75rem]"
      />

      {/* EN EL TELÉFONO, EL LOGO AL LADO Y NO ENCIMA. Con los tres bloques en
          una fila que envuelve, en 390px caía cada uno en su renglón y la
          barra pasaba de 91 a 147px: un sexto de la pantalla gastado antes de
          que se viera una bota, que es justo la queja que ya costó rehacer la
          cabecera (ver BarraInferior.tsx). Así el logo se queda a la
          izquierda y lo demás se apila a su derecha —medido: 89px, dos menos
          que antes de que el logo existiera—. Desde `md` vuelve a ser una
          sola fila.

          Lo que se ofrece. Los meses van SIN CIFRA, y eso es a propósito:
          ver "buenfin.oferta" en el diccionario.

          EL PORCENTAJE NO ESTÁ ESCRITO A MANO. Sale de lib/ofertas/maximo.ts,
          que el prebuild genera con lo que Shopify cobró al meter cada bota a
          un carrito. Si el 30% desaparece de la tienda, este número baja solo
          en el siguiente despliegue; un número a mano en la barra es una
          promesa que el catálogo tarde o temprano deja de cumplir. */}
      <div className="flex flex-col items-start gap-1.5 md:flex-row md:items-center md:gap-4">
      <p className="text-left text-[13px] font-medium uppercase leading-tight tracking-[0.04em] md:text-center md:text-[14px]">
        {anuncio}
      </p>

      <p className="flex items-center gap-2">
        <span className="text-[11px] uppercase leading-none tracking-[0.12em] opacity-80">
          {cuenta.fase === "antes" ? t("buenfin.empiezaEn") : t("buenfin.terminaEn")}
        </span>
        {/* EL CRONÓMETRO. Cada casilla es blanca con la cifra en rojo: es el
            mismo contraste que el bloque de crema sobre tinta de la barra
            normal, o sea lo más claro sobre lo más oscuro que hay a la vista.
            tabular-nums evita que los dígitos cambien de ancho cada segundo y
            hagan temblar la barra entera. */}
        <span className="flex items-end gap-1" aria-live="off">
          {casillas.map((c) => (
            <span key={c.u} className="flex flex-col items-center">
              <span
                className="min-w-7 rounded-[3px] bg-bg px-1 py-0.5 text-center text-[15px] font-bold leading-none tabular-nums md:text-[16px]"
                style={{ color: ROJO_BUEN_FIN }}
              >
                {dosCifras(c.n)}
              </span>
              <span className="mt-0.5 text-[9px] uppercase leading-none tracking-[0.08em] opacity-80">
                {c.u}
              </span>
            </span>
          ))}
        </span>
      </p>
      </div>
    </>
  )

  /* EL CINTILLO LLEVA A LAS OFERTAS. Hasta ahora anunciaba un descuento y no
     se podía tocar: quien lo leía tenía que ir a buscar las botas rebajadas
     por su cuenta, y no hay forma de encontrarlas en un catálogo de 110. Toda
     la franja es el enlace, no un botón escondido al final.

     Se envuelve aquí y no con un componente declarado dentro del render:
     React lo volvería a crear en cada pintada y perdería su estado (y el
     lint del proyecto lo marca como error, con razón). */
  return llevaAOfertas ? (
    <Link href={RUTA_OFERTAS} className={clases}>
      {contenido}
    </Link>
  ) : (
    <div className={clases}>{contenido}</div>
  )
}
