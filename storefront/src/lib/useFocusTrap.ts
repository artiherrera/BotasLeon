import { useEffect, useRef } from "react"

/**
 * useFocusTrap — accesibilidad para diálogos/drawers modales.
 *
 * Mientras `active` es true:
 *  - guarda el elemento que tenía el foco (el disparador) y mueve el foco
 *    dentro del contenedor (al de `[data-autofocus]` o al primer focuseable);
 *  - atrapa Tab / Shift+Tab dentro del contenedor;
 *  - Escape dispara `onClose`.
 * Al pasar a false (o desmontar), restaura el foco al disparador.
 *
 * Devuelve la ref para el contenedor del diálogo. El contenedor debería
 * llevar `role="dialog" aria-modal="true"` y, cuando esté cerrado, `inert`
 * para no ser focuseable.
 *
 * Patrón extraído de MobileNav/SearchOverlay para reutilizar en CartDrawer,
 * el lightbox de ProductGallery y el drawer de filtros de ProductsListing.
 */
export function useFocusTrap<T extends HTMLElement>(
  active: boolean,
  onClose?: () => void
) {
  const containerRef = useRef<T>(null)
  const triggerRef = useRef<HTMLElement | null>(null)
  // Ref para que cambiar la identidad de `onClose` no re-dispare el effect
  // principal (si no, restauraría el foco a media apertura). Se refresca en
  // su propio effect para no tocar el ref durante el render.
  const onCloseRef = useRef(onClose)
  useEffect(() => {
    onCloseRef.current = onClose
  })

  useEffect(() => {
    if (!active) return
    const container = containerRef.current
    if (!container) return

    triggerRef.current = document.activeElement as HTMLElement | null

    const focusables = () =>
      Array.from(
        container.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
      ).filter((el) => el.offsetParent !== null)

    const initial =
      container.querySelector<HTMLElement>("[data-autofocus]") ?? focusables()[0]
    initial?.focus()

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onCloseRef.current?.()
        return
      }
      if (e.key !== "Tab") return
      const items = focusables()
      if (items.length === 0) {
        e.preventDefault()
        return
      }
      const first = items[0]
      const last = items[items.length - 1]
      const el = document.activeElement
      if (e.shiftKey && (el === first || el === container)) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && el === last) {
        e.preventDefault()
        first.focus()
      }
    }

    document.addEventListener("keydown", onKeyDown)
    return () => {
      document.removeEventListener("keydown", onKeyDown)
      triggerRef.current?.focus?.()
    }
  }, [active])

  return containerRef
}
