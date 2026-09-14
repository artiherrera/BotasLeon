"use client"

import { useEffect, useState } from "react"
import { useT } from "@/lib/i18n/context"
import { PROMESAS_BARRA } from "@/lib/promesas"
import { formatoCuentaRegresiva, restante, type Restante } from "@/lib/promocion"

/**
 * Barra de avisos: la promoción con su cuenta regresiva, y tres promesas.
 *
 * Sustituye a la marquesina negra de cuatro mensajes en bucle. La marquesina se
 * fue por una razón que sigue valiendo: lo que se mueve no se lee — cuando el
 * ojo llega a la línea que le interesaba, ya pasó. Aquí lo único que cambia es
 * el reloj, y cambia porque su trabajo es meter prisa.
 *
 * Cuáles son las tres promesas las decide el MERCADO (ver PROMESAS_BARRA en
 * lib/promesas.ts), nunca el idioma: botasleon.com/es es venta de Estados
 * Unidos, y "3 meses sin intereses" ahí sería una promesa que el checkout en
 * dólares no puede cumplir. La promoción del 10%, en cambio, va en los dos
 * mercados: el registro no depende de la moneda.
 *
 * TINTA DE FONDO Y LA PROMOCIÓN EN NEGATIVO. En un sitio entero de crema lo que
 * llama la atención es lo oscuro, y dentro de lo oscuro, lo claro: la promoción
 * es un bloque de crema con la tinta encima, que es el contraste más alto que
 * existe en esta paleta (15.87:1 en los dos sentidos).
 */
export function BarraAvisos() {
  const t = useT()
  const [queda, setQueda] = useState<Restante | null>(null)
  // `montado` evita el desajuste de hidratación: el HTML es estático y se
  // hornea en el build, así que el servidor no puede saber qué hora es cuando
  // alguien abra la página. El contador aparece después de montar.
  const [montado, setMontado] = useState(false)

  useEffect(() => {
    setMontado(true)
    const tic = () => setQueda(restante(Date.now()))
    tic()
    const id = setInterval(tic, 1000)
    return () => clearInterval(id)
  }, [])

  // Cuando vence, la promoción desaparece sola. Es la mitad del trabajo de una
  // promoción con fecha: un sitio que sigue prometiendo un descuento terminado
  // se gana un cliente enojado en el checkout.
  const hayPromo = montado && queda !== null

  return (
    <div className="bg-text text-bg">
      <div className="contenedor flex min-h-12 flex-wrap items-center justify-center gap-x-4 gap-y-1.5 py-2.5 text-center">
        {hayPromo && (
          <p className="flex flex-wrap items-center justify-center gap-x-2.5 gap-y-1 bg-bg px-4 py-1.5 text-text">
            <span className="text-[13px] font-bold uppercase tracking-[0.06em] leading-tight">
              {t("promo.texto")}
            </span>
            <span className="text-[12px] uppercase tracking-[0.1em] leading-tight opacity-60">
              {t("promo.termina")}
            </span>
            {/* El reloj va MÁS GRANDE que su rótulo: es el número el que mete
                prisa, no la palabra. tabular-nums evita que los dígitos cambien
                de ancho cada segundo y hagan temblar la barra entera. */}
            <span
              className="text-[16px] font-bold leading-none tabular-nums"
              aria-live="off"
            >
              {formatoCuentaRegresiva(queda)}
            </span>
          </p>
        )}

        {/* Alto MÍNIMO, no fijo, y las promesas envuelven en vez de cortarse: en
            un teléfono de 360px no caben en un renglón, y con `truncate` la
            última saldría con puntos suspensivos en TODOS los teléfonos.

            Debajo de `sm` las tres promesas se esconden y queda solo la
            promoción: con las cuatro cosas a la vez la barra se comía 90px de
            un teléfono antes de que se viera una sola bota. Las promesas
            siguen estando bajo el botón de compra en cada ficha, que es donde
            de verdad deciden la venta. */}
        <ul className="hidden flex-wrap items-center justify-center gap-x-3 gap-y-0.5 sm:flex">
          {PROMESAS_BARRA.map((llave, i) => (
            <li key={llave} className="flex items-center gap-x-3">
              {i > 0 && (
                <span aria-hidden className="opacity-40">
                  ·
                </span>
              )}
              <span className="text-[13.5px] leading-snug">{t(llave)}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
