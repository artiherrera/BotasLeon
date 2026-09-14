"use client"

import { useT } from "@/lib/i18n/context"
import { PROMESAS_BARRA } from "@/lib/promesas"

/**
 * Barra de avisos: tres promesas, quietas, en tinta sobre crema.
 *
 * Sustituye al cintillo de un solo mensaje sobre el plato, que a su vez había
 * sustituido a una marquesina negra de cuatro mensajes en bucle. La marquesina
 * se fue por una razón que sigue valiendo: lo que se mueve no se lee — cuando
 * el ojo llega a la línea que le interesaba, ya pasó.
 *
 * TRES es el número, no cuatro: caben en un renglón en escritorio y en dos en
 * un teléfono. Cuáles son las decide el MERCADO (ver PROMESAS_BARRA en
 * lib/promesas.ts), nunca el idioma: botasleon.com/es es venta de Estados
 * Unidos, y "3 meses sin intereses" ahí sería una promesa que el checkout en
 * dólares no puede cumplir.
 *
 * VA EN TINTA, no sobre el plato como el cintillo anterior. El dueño la pidió
 * llamativa y en un sitio entero de crema lo que llama la atención es lo
 * oscuro. La crema sobre la tinta da 15.87:1, así que el texto chico cumple
 * AAA de sobra — que es lo que hace falta cuando son 13px.
 */
export function BarraAvisos() {
  const t = useT()

  return (
    <div className="bg-text text-bg">
      {/* Alto MÍNIMO, no fijo, y las promesas envuelven en vez de cortarse: en
          un teléfono de 360px las tres no caben en un renglón, y con `truncate`
          la tercera saldría con puntos suspensivos en TODOS los teléfonos. El
          separador es un elemento aparte y se esconde al envolver, para que no
          quede un punto medio huérfano al principio de un renglón. */}
      <ul className="contenedor flex min-h-9 flex-wrap items-center justify-center gap-x-3 gap-y-0.5 py-1.5 text-center">
        {PROMESAS_BARRA.map((llave, i) => (
          <li key={llave} className="flex items-center gap-x-3">
            {i > 0 && (
              <span aria-hidden className="hidden opacity-40 sm:inline">
                ·
              </span>
            )}
            <span className="text-[13px] leading-snug">{t(llave)}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
