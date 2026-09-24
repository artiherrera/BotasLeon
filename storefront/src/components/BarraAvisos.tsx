"use client"

import { useEffect, useState, useSyncExternalStore } from "react"
import { useT } from "@/lib/i18n/context"
import { LocalizedLink as Link } from "@/components/LocalizedLink"
import { PROMESAS_BARRA } from "@/lib/promesas"
import { formatoCuentaRegresiva, restante, type Restante, PROMO_PAR } from "@/lib/promocion"

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
  // El reloj, como "store externo": el HTML es estático y se hornea en el
  // build, así que el servidor no sabe qué hora es cuando alguien abre la
  // página; su instantánea es null y el contador aparece al hidratar, sin
  // desajuste. El navegador se suscribe a un tic por segundo. Antes esto era
  // un useState + setState dentro del efecto, que React marca como error.
  const ahora = useSyncExternalStore(
    (avisa) => {
      const id = setInterval(avisa, 1000)
      return () => clearInterval(id)
    },
    () => Math.floor(Date.now() / 1000),
    () => null
  )
  const queda: Restante | null = ahora === null ? null : restante(ahora * 1000)

  // Cuando vence, la promoción desaparece sola. Es la mitad del trabajo de una
  // promoción con fecha: un sitio que sigue prometiendo un descuento terminado
  // se gana un cliente enojado en el checkout.
  const hayPromo = queda !== null

  // EN MÓVIL, UNA PROMESA A LA VEZ. Debajo de `sm` las tres se escondían y
  // quedaba solo la promoción; cuando la promoción venció (15 sep), la barra
  // se quedó como una franja negra de 48px sin nada adentro, y un cliente en
  // Android la reportó como "la parte de arriba se ve cortada" (2026-09-17).
  // Ahora se enseña una promesa y cada 4 s se releva por la siguiente, en su
  // sitio y con un fundido: no es la marquesina que se quitó —nada se
  // desplaza, cada promesa se lee entera mientras está—. El HTML trae la
  // primera; el relevo empieza al montar, así que no hay desajuste de
  // hidratación.
  const [cual, setCual] = useState(0)
  useEffect(() => {
    if (PROMESAS_BARRA.length < 2) return
    const id = setInterval(() => setCual((i) => (i + 1) % PROMESAS_BARRA.length), 4000)
    return () => clearInterval(id)
  }, [])

  // Sin promoción y sin promesas no hay barra: una franja de tinta vacía es
  // justo lo que se está arreglando.
  if (!hayPromo && !PROMO_PAR.activa && PROMESAS_BARRA.length === 0) return null

  return (
    <div className="bg-text text-bg">
      <div className="contenedor flex min-h-12 flex-wrap items-center justify-center gap-x-4 gap-y-1.5 py-2.5 text-center">
        {/* LA PROMOCIÓN DEL PAR, sin reloj: el dueño la puso sin fecha de
            término (2026-09-24). Va en el mismo bloque de crema sobre tinta
            que usaba la del 10% —el contraste más alto de la paleta— y lleva
            enlace, porque un aviso que no se puede tocar obliga a buscar.
            Para apagarlo: PROMO_PAR.activa = false en lib/promocion.ts. */}
        {PROMO_PAR.activa && (
          <p className="flex flex-wrap items-center justify-center gap-x-2.5 gap-y-1 bg-bg px-4 py-1.5 text-text">
            <span className="text-[13px] font-bold uppercase tracking-[0.06em] leading-tight">
              {t("promoPar.barra")}
            </span>
            <Link
              href={PROMO_PAR.href}
              className="text-[12px] uppercase tracking-[0.1em] leading-tight underline underline-offset-4"
            >
              {t("promoPar.barraCta")}
            </Link>
          </p>
        )}

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

            Debajo de `sm` las tres promesas de golpe se comían 90px de un
            teléfono antes de que se viera una sola bota: ahí va una a la vez
            (el <p> de abajo) y la lista completa solo desde `sm`. Las
            promesas siguen estando bajo el botón de compra en cada ficha, que
            es donde de verdad deciden la venta. */}
        {PROMESAS_BARRA.length > 0 && (
          <p className="text-[13.5px] leading-snug sm:hidden" aria-live="off">
            {/* La `key` cambia con la promesa: React vuelve a montar el span y
                la animación de entrada corre otra vez. */}
            <span key={cual} className="relevo inline-block">
              {t(PROMESAS_BARRA[cual])}
            </span>
          </p>
        )}
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
