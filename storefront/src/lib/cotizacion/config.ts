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

// SHA-256 de la contraseña actual (default: "mayoreo2026").
export const COTIZADOR_PASSWORD_HASH =
  "03e122429d01853d3520d526f46d882ed648925ee23401c18b8f954905c2c3ce"

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
