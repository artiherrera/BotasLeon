"use client"

import { useT } from "@/lib/i18n/context"
import { isMX } from "@/lib/market"

/**
 * Botón "Ver catálogo". Abre el VISOR HTML del catálogo (catalogo-es.html en
 * México, catalogo-en.html en EE.UU.; en /public, generado por
 * scripts/generate-catalog.mjs).
 * Usamos HTML y no el PDF directo porque Chrome/Android y los navegadores de
 * IG/FB descargan el PDF en vez de abrirlo; el HTML abre en todos. El visor
 * tiene su propio botón "Descargar PDF".
 */
export function CatalogButton({ className = "" }: { className?: string }) {
  const t = useT()
  // El catálogo trae los precios horneados, así que pertenece al MERCADO y no
  // al idioma: en botasleon.com el visitante que lee en español sigue comprando
  // en dólares, y mandarlo al catálogo en pesos le cotiza mal cada bota.
  const href = isMX ? "/catalogo-es.html" : "/catalogo-en.html"

  // El hover anterior repetía el mismo bg-text: no pasaba nada al pasar el
  // cursor. .btn sí cambia a cuero.
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`btn ${className}`}
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
      </svg>
      {t("catalog.view")}
    </a>
  )
}
