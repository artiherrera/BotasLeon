import localFont from "next/font/local"

/**
 * Montserrat — la tipografía de Josepha, y solo de Josepha.
 *
 * Vive aquí, y no dentro de la landing, porque desde el 2026-11-10 la usan DOS
 * sitios: la página `/josepha` y la banda de la portada que lleva a ella. Dos
 * llamadas a `localFont` sobre el mismo archivo declararían la misma fuente dos
 * veces, con dos nombres distintos, y el navegador la descargaría dos veces.
 *
 * Archivo LOCAL, no next/font/google: el proyecto dejó de bajar fuentes de
 * Google en el build porque un deploy real falló cuando fonts.gstatic.com
 * devolvió 404 a media compilación. Es el archivo variable de 400 a 700, así
 * que la negrita es un grosor de verdad y no una falsificación del navegador
 * —globals.css pone font-synthesis-weight: none justamente para eso.
 */
export const fuenteJosepha = localFont({
  src: "../fonts/montserrat.woff2",
  weight: "400 700",
  display: "swap",
})
