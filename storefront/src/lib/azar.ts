/**
 * Baraja una copia del arreglo (Fisher–Yates). No toca el original.
 *
 * Se usa en el servidor, en páginas con `revalidate`: cada regeneración
 * tira los dados otra vez, y el HTML que llega al navegador ya viene con el
 * resultado — sin barajar en el cliente, que o pinta vacío o salta al hidratar.
 */
export function barajar<T>(items: readonly T[]): T[] {
  const copia = items.slice()
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copia[i], copia[j]] = [copia[j], copia[i]]
  }
  return copia
}
