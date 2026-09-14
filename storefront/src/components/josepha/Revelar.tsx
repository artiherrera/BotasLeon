"use client"

import { useEffect, useRef, type ReactNode } from "react"

/**
 * Aparece al entrar en pantalla: sube un poco y se funde.
 *
 * Josepha era una pila de rectángulos quietos —"parece la página simple de un
 * blog", dijo el dueño— y lo que le faltaba no era más color sino tiempo: que
 * las cosas lleguen en orden en vez de estar todas ahí desde el principio.
 *
 * EL ESTADO OCULTO SE PONE DESDE JAVASCRIPT, NUNCA EN EL HTML. Si el atributo
 * viniera puesto desde el servidor, cualquiera con el JS bloqueado o roto —o
 * Googlebot en una pasada mala— vería una página EN BLANCO: todo el contenido
 * con opacidad cero y nada que lo encienda. Así, sin JS, se ve todo de golpe,
 * que es exactamente lo que había antes.
 *
 * Se revela UNA VEZ y se deja de observar. Nada se desvanece al volver a
 * subir: una página que parpadea cada vez que te mueves cansa.
 */
export function Revelar({
  children,
  /** Retraso en ms, para escalonar la foto y el texto de una misma franja. */
  retraso = 0,
  className = "",
}: {
  children: ReactNode
  retraso?: number
  className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    // Quien pidió menos movimiento no lo recibe: se queda visible y ya.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return

    el.dataset.revelar = ""
    el.style.transitionDelay = `${retraso}ms`

    const obs = new IntersectionObserver(
      (entradas) => {
        for (const e of entradas) {
          if (!e.isIntersecting) continue
          e.target.setAttribute("data-visible", "")
          obs.unobserve(e.target)
        }
      },
      // 12% del alto de la ventana de margen inferior: la cosa empieza a
      // aparecer justo antes de que el ojo llegue, no cuando ya la está
      // mirando quieta.
      { rootMargin: "0px 0px -12% 0px", threshold: 0.01 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [retraso])

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  )
}
