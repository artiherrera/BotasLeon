"use client"

import { useEffect } from "react"

/**
 * Marca el <body> mientras hay un cajón abierto (el menú o el carrito).
 *
 * Existe por un choque de capas: los dos cajones y la barra de cookies viven
 * en z-50, así que gana el último que se pinta, que es la barra. Resultado, en
 * la primera visita: se abre el menú y la barra de cookies se le pone encima y
 * le corta la lista por abajo (visto en botasleon.mx el 2026-09-25). Subirle la
 * capa al cajón NO sirve: la barra de cookies tiene que seguir por encima del
 * resto del sitio, y además el cajón la taparía a medias, que es igual de feo.
 * Lo que se hace es quitarla de en medio mientras el cajón está abierto; vuelve
 * sola al cerrarlo, sin haber perdido nada: nadie acepta cookies desde una
 * barra que no puede ver.
 *
 * SE CUENTAN, no se enciende y se apaga: el carrito puede abrirse con el menú
 * abierto, y si el segundo en cerrarse borrase la marca del primero la barra
 * volvería a aparecer debajo del cajón que sigue abierto.
 *
 * Quien lo aprovecha es la regla de globals.css; aquí solo se marca.
 */

let abiertos = 0

export function useMarcarCajonAbierto(abierto: boolean): void {
  useEffect(() => {
    if (!abierto) return
    abiertos += 1
    document.body.dataset.cajonAbierto = "1"
    return () => {
      abiertos = Math.max(0, abiertos - 1)
      if (abiertos === 0) delete document.body.dataset.cajonAbierto
    }
  }, [abierto])
}
