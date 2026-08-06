/**
 * Configuración de envíos — fuente única.
 *
 * Decisión de negocio: el ENVÍO ES GRATIS en todos los pedidos y a todos los
 * destinos (México y Estados Unidos). Para EE.UU., la aduana y los aranceles
 * los sigue pagando el comprador — eso es aparte del envío (ver CustomsTaxIdField).
 *
 * Se conserva el umbral como 0 (siempre alcanzado) para no romper los
 * componentes que aún lo reciben (FreeShippingBar en Cart + CartDrawer).
 * Cambiar aquí afecta TODOS los puntos donde se comunica el envío.
 */

export const FREE_SHIPPING_THRESHOLD = 0
