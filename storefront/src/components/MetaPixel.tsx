"use client"

import { useEffect, useRef, useSyncExternalStore } from "react"
import Script from "next/script"
import { usePathname } from "next/navigation"
import { META_PIXEL_ID } from "@/lib/meta/pixel"

/**
 * MetaPixel — carga el Pixel de Meta SOLO con consentimiento "all".
 *
 * Mismo patrón que KlaviyoLoader: el Pixel no tiene "consent mode", así que
 * NO inyectamos el snippet hasta que el usuario acepta "todas" en el
 * CookiesBanner. Como `pixelTrack` es no-op sin `fbq`, gatear la carga aquí
 * también apaga los eventos (ViewContent, AddToCart, etc.) sin consentimiento.
 *
 * La COMPRA no se dispara aquí: ocurre en el checkout de Shopify (fuera del
 * sitio), y la captura el canal de Facebook de Shopify con el mismo Pixel ID.
 *
 * Usa useSyncExternalStore para sincronizar con localStorage + el evento
 * `botasleon:consent-change`, sin setState-en-effect.
 */

const CONSENT_KEY = "botasleon:cookies-accepted"

function subscribe(onChange: () => void) {
  window.addEventListener("botasleon:consent-change", onChange)
  // `storage` cubre el cambio de consentimiento hecho en otra pestaña.
  window.addEventListener("storage", onChange)
  return () => {
    window.removeEventListener("botasleon:consent-change", onChange)
    window.removeEventListener("storage", onChange)
  }
}

function isAllowed(): boolean {
  try {
    return window.localStorage.getItem(CONSENT_KEY) === "all"
  } catch {
    return false
  }
}

export function MetaPixel() {
  // getServerSnapshot = false: en SSR no hay consentimiento todavía.
  const allowed = useSyncExternalStore(subscribe, isAllowed, () => false)
  const pathname = usePathname()
  const firstView = useRef(true)

  // PageView en navegación SPA (App Router). El snippet base ya dispara el
  // PageView inicial, así que saltamos el primer render para no duplicarlo.
  useEffect(() => {
    if (!allowed) return
    if (firstView.current) {
      firstView.current = false
      return
    }
    if (typeof window.fbq === "function") {
      window.fbq("track", "PageView")
    }
  }, [pathname, allowed])

  if (!META_PIXEL_ID || !allowed) return null

  return (
    <Script id="meta-pixel" strategy="afterInteractive">
      {`
        !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
        n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
        n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
        t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
        document,'script','https://connect.facebook.net/en_US/fbevents.js');
        fbq('init', '${META_PIXEL_ID}');
        fbq('track', 'PageView');
      `}
    </Script>
  )
}
