/**
 * Configuración de envíos — fuente única para threshold + costos.
 *
 * Cambiar aquí afecta TODOS los puntos donde se comunica el envío:
 * MarqueeBar, FreeShippingBar (Cart + CartDrawer), PDP trust block,
 * Footer, etc.
 *
 * El threshold $2,999 está calibrado para empujar AOV — la mayoría de
 * botas individuales caen entre $1,800-4,500. Compras solo accesorios
 * (cinturones $800-1,500) NO califican; bota + accesorio sí, lo que
 * favorece bundling.
 */

export const FREE_SHIPPING_THRESHOLD = 2999

// Costo flat a USA cuando el cliente NO alcanza el threshold de envío
// gratis MX. USA siempre paga, MX gratis sobre threshold.
export const USA_SHIPPING_FLAT = 499

// Formato amigable para banners ("$2,999" no "2999"). Sin decimales —
// si el threshold sube a algo no-redondo (ej. $2,499.50) cambiar acá.
export const FREE_SHIPPING_THRESHOLD_LABEL = "$2,999"
