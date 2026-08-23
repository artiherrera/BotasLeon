/**
 * Config del cotizador de mayoreo.
 *
 * Antes vivía aquí el hash SHA-256 de una contraseña compartida. Se retiró al
 * pasar a Cognito: aquello no era una identidad, solo un candado, y las tablas
 * necesitan saber QUIÉN emitió cada documento. Ver components/notas/Entrar.tsx.
 */

export const COTIZADOR_DEFAULTS = {
  atiende: "BotasLeón",
  contacto: "www.botasleon.com",
  vigencia: "15 días naturales",
} as const
