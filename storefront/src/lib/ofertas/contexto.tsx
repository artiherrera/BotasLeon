"use client"

import { createContext, useContext } from "react"

/**
 * EL MAYOR DESCUENTO VIVO, LEÍDO EN EL SERVIDOR Y REPARTIDO AL CLIENTE.
 *
 * Por qué existe: la barra de navegación y el cintillo necesitan saber si hay
 * ofertas y de cuánto, y los dos son componentes de CLIENTE —no pueden abrir
 * el archivo de precios—. La primera solución fue que el prebuild escribiera
 * el número en un módulo de TypeScript y que lo importaran. Parecía limpio y
 * tenía un fallo que costó encontrar:
 *
 *   EL BUILD DE AMPLIFY CACHEA `.next/cache`. Un archivo de CÓDIGO generado en
 *   cada build puede quedarse compilado del build anterior, y entonces el
 *   servidor y el cliente dicen cosas distintas. Pasó de verdad el 2026-11-10:
 *   en botasleon.com la página de ofertas decía "No deals right now" —leyendo
 *   el archivo de precios, que estaba vacío y era correcto— mientras la barra
 *   seguía enseñando la pestaña de temporada, compilada con el 30 de México.
 *
 * La regla que sale de ahí: un DATO que cambia cada build se reparte como
 * dato, no como código. El layout —que es de servidor— lee el archivo de
 * precios en cada render y lo pasa por aquí. Viaja en el HTML, así que está
 * desde el primer momento y no parpadea, y no hay nada compilado que se pueda
 * quedar viejo.
 */

const Ctx = createContext<number>(0)

export function OfertasProvider({
  maximo,
  children,
}: {
  maximo: number
  children: React.ReactNode
}) {
  return <Ctx.Provider value={maximo}>{children}</Ctx.Provider>
}

/** El mayor descuento vivo, en porcentaje. 0 si no hay ninguno. */
export function useDescuentoMaximo(): number {
  return useContext(Ctx)
}
