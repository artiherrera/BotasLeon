/**
 * Promo temporal aplicada a TODOS los visitantes automáticamente.
 *
 * `code` DEBE existir idéntico en Shopify → Descuentos (aquí VENTA15 = 15% en
 * toda la tienda). El sitio siembra ese código como "pendiente" al cargar; el
 * carrito lo valida y aplica solo (ver CartDrawer). También lo anuncia la
 * PromoBar arriba del sitio.
 *
 * 👉 PARA APAGARLA: pon `active: false`. Es una medida momentánea.
 */
export const PROMO = {
  active: true,
  code: "VENTA15",
  headline: "15% de descuento en toda la tienda",
} as const
