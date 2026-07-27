/**
 * Config del cotizador de mayoreo (sección interna protegida por contraseña).
 *
 * Guardamos solo el HASH SHA-256 de la contraseña, nunca el texto — así no viaja
 * en el bundle. Es un candado ligero (del lado del cliente) suficiente para uso
 * interno: los precios de mayoreo NO se exponen en ningún lado, se escriben al
 * momento y solo viven en la cotización que se genera.
 *
 * 👉 PARA CAMBIAR LA CONTRASEÑA: corre en terminal
 *      printf '%s' 'TU_NUEVA_CLAVE' | shasum -a 256
 *    y pega el hash resultante aquí abajo.
 */

// SHA-256 de la contraseña actual (botas123).
export const COTIZADOR_PASSWORD_HASH =
  "e6f749c7b77bb14f17734a4d8581aadade65688a1d1f29068c8a49b5d6d9f27a"

export const COTIZADOR_DEFAULTS = {
  atiende: "BotasLeón",
  contacto: "www.botasleon.com",
  vigencia: "15 días naturales",
} as const

/** SHA-256 en hex de un string (Web Crypto, corre en el navegador). */
export async function sha256Hex(input: string): Promise<string> {
  const buf = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(input)
  )
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
}
