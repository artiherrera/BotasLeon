"use client"

import { useEffect } from "react"
import Script from "next/script"
import { usePathname } from "next/navigation"

/**
 * GoogleAnalytics — GA4 con Consent Mode v2 + LFPDPPP friendly.
 *
 * Comportamiento:
 *  1. El script de gtag.js carga siempre (necesario para que Google
 *     Tag Assistant + Search Console + GA4 reconozcan la propiedad).
 *  2. Consent default: 'denied' — sin cookies hasta que el usuario
 *     acepte explícito.
 *  3. CookiesBanner dispara `botasleon:consent-change` con
 *     `detail.value = "all" | "necessary"`. Este componente escucha
 *     y promueve a 'granted' cuando es "all".
 *  4. Page views se disparan manual en cada cambio de pathname para
 *     que SPA navigation (Next App Router) las cuente. send_page_view
 *     en config queda en false para evitar doble disparo en navegación
 *     inicial.
 *
 * Por qué Consent Mode v2 vs solo bloquear: aunque el usuario rechace,
 * Google reporta pings "denied" anonimizados que mantienen las métricas
 * agregadas (tendencias de tráfico) sin cookies — Mejor que perder
 * 50% del tracking por rechazo.
 *
 * GA_ID: configurable vía NEXT_PUBLIC_GA_ID con fallback hardcoded.
 */

const GA_ID = process.env.NEXT_PUBLIC_GA_ID ?? "G-4E2K7VX0WZ"
const CONSENT_KEY = "botasleon:cookies-accepted"

declare global {
  interface Window {
    dataLayer: unknown[]
    gtag: (...args: unknown[]) => void
  }
}

type ConsentValue = "all" | "necessary"

export function GoogleAnalytics() {
  const pathname = usePathname()

  // Page view on every pathname change. fireOnce defers si gtag aún no
  // se inyectó (carga afterInteractive — race con primer render).
  useEffect(() => {
    if (typeof window === "undefined") return

    const fireView = () => {
      if (typeof window.gtag !== "function") return
      const url = pathname + (window.location.search || "")
      window.gtag("event", "page_view", {
        page_path: url,
        page_location: window.location.href,
        page_title: document.title,
      })
    }

    if (typeof window.gtag === "function") {
      fireView()
    } else {
      // gtag aún no cargado — reintentamos en próximo idle.
      const id = window.setTimeout(fireView, 600)
      return () => window.clearTimeout(id)
    }
  }, [pathname])

  // Consent updates desde CookiesBanner. Escuchamos el evento custom
  // dispatcheado por CookiesBanner.accept().
  useEffect(() => {
    if (typeof window === "undefined") return

    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ value: ConsentValue }>).detail
      if (typeof window.gtag !== "function") return
      const granted = detail?.value === "all"
      window.gtag("consent", "update", {
        analytics_storage: granted ? "granted" : "denied",
        ad_storage: "denied", // no usamos Google Ads — siempre denied
        ad_user_data: "denied",
        ad_personalization: "denied",
      })
    }

    window.addEventListener("botasleon:consent-change", handler)
    return () => window.removeEventListener("botasleon:consent-change", handler)
  }, [])

  if (!GA_ID) return null

  return (
    <>
      {/* Inline init — define dataLayer + gtag + Consent Mode default.
          afterInteractive: corre cuando la página ya es interactiva,
          sin bloquear el FCP/LCP. */}
      <Script id="ga-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          window.gtag = gtag;

          (function(){
            var saved = null;
            try { saved = localStorage.getItem("${CONSENT_KEY}"); } catch (e) {}
            var granted = saved === "all";

            gtag('consent', 'default', {
              ad_storage: 'denied',
              ad_user_data: 'denied',
              ad_personalization: 'denied',
              analytics_storage: granted ? 'granted' : 'denied',
              wait_for_update: 500
            });

            gtag('js', new Date());
            // send_page_view: false — disparamos manual desde React useEffect
            // para que SPA navigation también se cuente. Sin esto se duplica
            // el primer pageview.
            gtag('config', '${GA_ID}', { send_page_view: false });
          })();
        `}
      </Script>

      {/* Script externo de gtag.js — afterInteractive como el inline. */}
      <Script
        id="ga-script"
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
      />
    </>
  )
}
