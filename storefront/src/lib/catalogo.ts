/**
 * El catálogo en PDF vive en el CDN de Shopify, NO dentro del sitio.
 *
 * Los dos PDFs pesan 19 MB y viajaban dentro de la compilación. El 2026-09-28
 * eso dejó a botasleon.com sin poder publicar: Amplify corta en 230.7 MB y el
 * build llegó a 232.7. Un PDF que nadie edita y que se descarga entero no tiene
 * por qué ocupar espacio del despliegue; en el CDN de Shopify no cuesta nada,
 * ya está pagado y sirve más rápido.
 *
 * SI SE ACTUALIZA EL CATÁLOGO hay que volver a subirlo (Shopify → Contenido →
 * Archivos) y pegar la URL nueva aquí. Shopify le pone `?v=` al final: si se
 * sube encima del mismo nombre cambia ese número, así que no basta con dejar la
 * vieja. Es el precio de sacarlo del repo, y es barato comparado con no poder
 * desplegar.
 *
 * El visor HTML y sus páginas en webp SÍ siguen en public/: pesan 8 MB entre
 * los dos idiomas y son lo que se abre desde el sitio, sin descargar nada.
 */
export const CATALOGO_PDF = {
  es: "https://cdn.shopify.com/s/files/1/0729/4618/8470/files/catalogo-es.pdf?v=1790632525",
  en: "https://cdn.shopify.com/s/files/1/0729/4618/8470/files/catalogo-en.pdf?v=1790632529",
} as const
