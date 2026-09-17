/**
 * Baraja una copia del arreglo (Fisher–Yates). No toca el original.
 *
 * Se usa en el navegador, al hidratar (ver BotasExoticas): en Amplify una
 * página con `revalidate` NO se regenera entre deploys, así que barajar en
 * el servidor daría siempre el mismo resultado hasta la siguiente publicación.
 */
export function barajar<T>(items: readonly T[]): T[] {
  const copia = items.slice()
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copia[i], copia[j]] = [copia[j], copia[i]]
  }
  return copia
}
