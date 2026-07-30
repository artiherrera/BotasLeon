"use client"

import { useLocale, useT } from "@/lib/i18n/context"

/**
 * Botón "Ver catálogo". Abre el VISOR HTML del catálogo (catalogo-es.html /
 * catalogo-en.html en /public, generado por scripts/generate-catalog.mjs).
 * Usamos HTML y no el PDF directo porque Chrome/Android y los navegadores de
 * IG/FB descargan el PDF en vez de abrirlo; el HTML abre en todos. El visor
 * tiene su propio botón "Descargar PDF".
 */
export function CatalogButton({ className = "" }: { className?: string }) {
  const { locale } = useLocale()
  const t = useT()
  const href = locale === "en" ? "/catalogo-en.html" : "/catalogo-es.html"

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-2 rounded-full bg-leather px-6 py-3 text-sm uppercase tracking-wider text-bg hover:bg-text transition-colors ${className}`}
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
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
