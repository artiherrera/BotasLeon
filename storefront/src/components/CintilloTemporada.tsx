"use client"

import { useT } from "@/lib/i18n/context"
import { LocalizedLink as Link } from "@/components/LocalizedLink"
import { dosCifras, type CuentaTemporada } from "@/lib/temporada"
import {
  RUTA_OFERTAS,
  descuentoVisible,
  enAntesala,
  DESCUENTO_ANUNCIADO,
  DIA_INICIO,
  DIA_FIN,
} from "@/lib/ofertas/config"
import { useDescuentoMaximo } from "@/lib/ofertas/contexto"
import { HAY_MSI } from "@/lib/msi"
import { TEMAS } from "@/lib/ofertas/temas"

/**
 * EL CINTILLO DE TEMPORADA: el nombre de la campaña, lo que promete y el
 * cronómetro.
 *
 * Sustituye a BuenFinCintillo, que sabía de UNA campaña —hasta del logotipo
 * registrado de CONCANACO y de las reglas de su manual de marca— y se fue con
 * ella. Este no sabe de ninguna: el aspecto sale de la tabla TEMAS de aquí
 * abajo y los textos del diccionario, así que montar la siguiente campaña es
 * añadir una fila, no reescribir un componente.
 *
 * Va DENTRO de la barra de avisos de siempre, en el hueco donde va la
 * promoción —no es una franja nueva apilada encima—. Cuando la temporada
 * termina, cuentaTemporada() devuelve null y la barra vuelve sola a su tinta.
 */

export function CintilloTemporada({ cuenta }: { cuenta: CuentaTemporada }) {
  const t = useT()
  const maximoOferta = useDescuentoMaximo()
  const tema = TEMAS[cuenta.evento]

  /**
   * ¿Lleva a las ofertas o no lleva a ninguna parte?
   *
   * Con el interruptor de lib/ofertas/config.ts apagado, la página de ofertas
   * no tiene nada que enseñar y mandar ahí a quien toca el cintillo es
   * mandarlo a un "sin ofertas por ahora". Entonces el cintillo se queda como
   * un aviso que se lee, no un enlace.
   */
  const llevaAOfertas = descuentoVisible() || enAntesala()

  /**
   * ANTES DE QUE ARRANQUE NO HAY NADA QUE SIMULAR, así que el porcentaje sale
   * del número anunciado a mano y el cintillo dice además LAS FECHAS: el reloj
   * cuenta cuánto falta, pero no dice cuándo. En cuanto empieza la campaña
   * manda otra vez lo que la caja cobra de verdad.
   *
   * LOS MESES SIN INTERESES SOLO DONDE EXISTEN. El cintillo del Buen Fin los
   * daba por hechos porque era una campaña mexicana; este va también a
   * botasleon.com, y allá el checkout en dólares no los ofrece. Lo decide
   * HAY_MSI, que es por mercado y no por idioma.
   */
  const antesala = enAntesala()
  const pct = antesala ? DESCUENTO_ANUNCIADO : maximoOferta
  const detalle = [
    antesala
      ? t("temporada.fechas").replace("{ini}", String(DIA_INICIO)).replace("{fin}", String(DIA_FIN))
      : pct > 0
        ? t("temporada.hasta").replace("{pct}", String(pct))
        : null,
    HAY_MSI ? t("temporada.msi") : null,
  ]
    .filter(Boolean)
    .join(" · ")

  const casillas = [
    { n: cuenta.dias, u: t("temporada.dias") },
    { n: cuenta.horas, u: t("temporada.horas") },
    { n: cuenta.minutos, u: t("temporada.minutos") },
    { n: cuenta.segundos, u: t("temporada.segundos") },
  ]

  // gap-y CORTO a propósito: en 390px esto cae en tres renglones y cada
  // píxel de separación se multiplica por tres. Medido: con gap-y-2 la barra
  // salía a 144px —un tercio de la pantalla antes de ver una bota, que es la
  // queja que ya costó rehacer la cabecera una vez (ver BarraInferior.tsx)—.
  const clases =
    "flex flex-wrap items-center justify-center gap-x-4 gap-y-1 md:gap-x-5 md:gap-y-2"

  const contenido = (
    <>
      {/* EL NOMBRE DE LA CAMPAÑA, EN TIPOGRAFÍA Y NO EN IMAGEN. El Buen Fin
          iba de logotipo porque era marca registrada con su manual; Black
          Friday no es de nadie, así que se compone. Sale más nítido en
          cualquier pantalla, no pesa un solo byte y no puede quedarse
          desalineado al cargar.

          En dos renglones apretados a propósito: apilado y con el tracking
          abierto es como se lee un lockup de campaña, y ocupa la mitad de
          ancho que en una línea — que es lo que deja sitio al cronómetro
          grande en un teléfono. */}
      {/* EN UNA LÍNEA EN EL TELÉFONO Y APILADO DESDE `md`. Apilado se lee
          mejor como lockup, pero en 390px empujaba el lema a su propio
          renglón y la barra ganaba 30px de alto. En una línea corta cabe
          junto al lema. */}
      <span
        className="flex shrink-0 flex-row gap-x-1.5 text-[14px] font-bold uppercase leading-[0.95] tracking-[0.14em] md:flex-col md:gap-x-0 md:text-[19px]"
        style={{ color: tema.acento }}
      >
        <span>{t("temporada.bf1")}</span>
        <span>{t("temporada.bf2")}</span>
      </span>

      <div className="flex flex-col items-start gap-0.5">
        {/* EL LEMA, que es lo único que de verdad convence. Lo eligió el
            dueño: "Las mayores ofertas del año". */}
        <p className="text-left text-[13.5px] font-semibold uppercase leading-tight tracking-[0.03em] md:text-[16px]">
          {t("temporada.lema")}
        </p>
        {detalle && (
          <p className="text-left text-[10.5px] uppercase leading-tight tracking-[0.06em] opacity-75 md:text-[12.5px]">
            {detalle}
          </p>
        )}
      </div>

      <p className="flex items-center gap-2.5">
        <span className="hidden text-[10.5px] uppercase leading-none tracking-[0.12em] opacity-70 sm:block">
          {cuenta.fase === "antes" ? t("temporada.empiezaEn") : t("temporada.terminaEn")}
        </span>
        {/* EL CRONÓMETRO, EN GRANDE — lo pidió así el dueño (2026-11-18). El
            del Buen Fin iba a 15px y se leía como una nota al pie de la
            franja; este va a 24px en el teléfono y 30 en escritorio, que es
            el doble, y es ahora lo más grande de toda la barra. Es lo que
            mete prisa: si no se lee de un vistazo no sirve de nada.

            Casillas claras con la cifra en el color de la campaña: el mismo
            contraste que el bloque de crema sobre tinta de la barra normal, o
            sea lo más claro sobre lo más oscuro que hay a la vista.

            tabular-nums evita que los dígitos cambien de ancho cada segundo y
            hagan temblar la barra entera; aria-live="off" evita que un lector
            de pantalla cante el contador cada segundo y deje la página
            inservible para quien la escucha. */}
        <span className="flex items-end gap-1 md:gap-1.5" aria-live="off">
          {casillas.map((c) => (
            <span key={c.u} className="flex flex-col items-center">
              <span
                className="min-w-[2.1rem] rounded-[4px] bg-white px-1.5 py-1 text-center text-[24px] font-bold leading-none tabular-nums md:min-w-[2.5rem] md:text-[30px]"
                style={{ color: tema.cifra }}
              >
                {dosCifras(c.n)}
              </span>
              <span className="mt-1 text-[9.5px] uppercase leading-none tracking-[0.08em] opacity-70">
                {c.u}
              </span>
            </span>
          ))}
        </span>
      </p>
    </>
  )

  /* EL CINTILLO LLEVA A LAS OFERTAS. Un aviso que no se puede tocar obliga a
     buscar las botas rebajadas a mano en un catálogo de 110. Toda la franja es
     el enlace, no un botón escondido al final.

     Se envuelve aquí y no con un componente declarado dentro del render:
     React lo volvería a crear en cada pintada y perdería su estado (y el lint
     del proyecto lo marca como error, con razón). */
  return llevaAOfertas ? (
    <Link href={RUTA_OFERTAS} className={clases} style={{ color: "#FFFFFF" }}>
      {contenido}
    </Link>
  ) : (
    <div className={clases}>{contenido}</div>
  )
}
