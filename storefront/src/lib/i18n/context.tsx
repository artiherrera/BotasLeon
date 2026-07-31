"use client"

import { createContext, useCallback, useContext, useEffect, useMemo } from "react"
import { useRouter, usePathname } from "next/navigation"
import { DEFAULT_LOCALE, STORAGE_KEY, type Locale } from "./config"
import { DICTIONARY } from "./dictionary"

type LocaleContextValue = {
  locale: Locale
  setLocale: (locale: Locale) => void
  /** Traduce una llave del diccionario al idioma actual. Si no existe, devuelve la llave. */
  t: (key: string) => string
}

const LocaleContext = createContext<LocaleContextValue | null>(null)

/**
 * El idioma lo manda la URL: /es/… o /en/… (segmento [lang]). El layout pasa ese
 * idioma como `initialLocale`, así que ES la fuente de verdad — el SSR ya sale en
 * el idioma correcto (sin parpadeo). Cambiar de idioma = navegar a la MISMA ruta
 * con el otro prefijo; además se guarda una cookie para recordar la preferencia
 * en futuras primeras visitas (la lee el proxy).
 */
export function LocaleProvider({
  initialLocale,
  children,
}: {
  initialLocale: Locale
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const locale = initialLocale

  // Refleja el idioma en <html lang> también en navegación cliente.
  useEffect(() => {
    document.documentElement.lang = locale
  }, [locale])

  const setLocale = useCallback(
    (next: Locale) => {
      if (next === locale) return
      // Recuerda la preferencia manual (el proxy la respeta sobre el idioma del
      // navegador en futuras visitas).
      try {
        document.cookie = `${STORAGE_KEY}=${next};path=/;max-age=31536000;samesite=lax`
      } catch {
        // cookies bloqueadas — la navegación de abajo igual cambia el idioma.
      }
      // Misma ruta, otro prefijo de idioma. Conserva query/hash (p.ej. filtros).
      const stripped = pathname.replace(/^\/(es|en)(?=\/|$)/, "")
      const search =
        typeof window !== "undefined"
          ? window.location.search + window.location.hash
          : ""
      router.push(`/${next}${stripped}${search}`)
    },
    [locale, pathname, router]
  )

  const t = useCallback(
    (key: string) => {
      const entry = DICTIONARY[key]
      if (!entry) return key
      return entry[locale] ?? entry[DEFAULT_LOCALE] ?? key
    },
    [locale]
  )

  const value = useMemo(() => ({ locale, setLocale, t }), [locale, setLocale, t])

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
}

export function useLocale(): LocaleContextValue {
  const ctx = useContext(LocaleContext)
  if (!ctx) {
    throw new Error("useLocale debe usarse dentro de <LocaleProvider>")
  }
  return ctx
}

/** Atajo cuando solo se necesita la función de traducción. */
export function useT(): (key: string) => string {
  return useLocale().t
}
