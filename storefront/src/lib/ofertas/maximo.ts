/**
 * EL MAYOR DESCUENTO VIVO, Y CUÁNTAS BOTAS LO TIENEN.
 *
 * ARCHIVO GENERADO — no se edita a mano. Lo escribe
 * `scripts/generate-descuentos.mjs` en cada prebuild, con lo que Shopify
 * cobró al meter cada bota a un carrito. Si el 30% desaparece de Shopify, este
 * número baja solo en el siguiente despliegue.
 *
 * Existe aparte de descuentos.json porque quien lo necesita —el cintillo de
 * arriba— vive dentro de la cabecera, que es un componente de cliente y no
 * puede abrir archivos. Y el número tiene que ir en el HTML desde el primer
 * momento: un "hasta X%" que apareciera tarde, encima de la pantalla, es peor
 * que no ponerlo.
 *
 * Último recuento: mercado MX, 41 botas con oferta.
 */
export const DESCUENTO_MAXIMO_REAL = 30
export const BOTAS_CON_OFERTA = 41
