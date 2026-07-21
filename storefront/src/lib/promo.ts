/**
 * Promo temporal aplicada a TODOS los visitantes automáticamente.
 *
 * `code` DEBE existir idéntico en Shopify → Descuentos (aquí VENTA15 = 15% en
 * toda la tienda). El sitio siembra ese código como "pendiente" al cargar; el
 * carrito lo valida y aplica solo (ver CartDrawer). Se anuncia con una ventana
 * modal (PromoModal) al entrar al sitio.
 *
 * 👉 PARA APAGARLA: pon `active: false`. Es una medida momentánea.
 */
export const PROMO = {
  active: true,
  code: "VENTA15",
  eyebrow: "Inauguración",
  title: "¡BotasLeón abre sus puertas!",
  message:
    "Para celebrar, llévate 15% de descuento en TODA la tienda. Promoción por tiempo limitado — se aplica solo al pagar, sin códigos.",
  cta: "Ver las botas",
} as const
