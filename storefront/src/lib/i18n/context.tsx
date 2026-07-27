"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react"
import {
  DEFAULT_LOCALE,
  detectBrowserLocale,
  isLocale,
  STORAGE_KEY,
  type Locale,
} from "./config"
import { DICTIONARY } from "./dictionary"

type LocaleContextValue = {
  locale: Locale
  setLocale: (locale: Locale) => void
  /** Traduce una llave del diccionario al idioma actual. Si no existe, devuelve la llave. */
  t: (key: string) => string
}

const LocaleContext = createContext<LocaleContextValue | null>(null)

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  // Arranca SIEMPRE en el idioma por defecto para que el primer render del
  // cliente coincida con el del servidor (sin mismatch de hidratación). Tras
  // montar, se ajusta a la preferencia guardada o a la del navegador.
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE)

  useEffect(() => {
    let initial: Locale | null = null
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (isLocale(stored)) initial = stored
    } catch {
      // localStorage bloqueado (modo privado, etc.) — se ignora.
    }
    if (!initial) initial = detectBrowserLocale()
    if (initial !== DEFAULT_LOCALE) setLocaleState(initial)
  }, [])

  // Refleja el idioma en <html lang> — señal de accesibilidad y para el
  // navegador/lectores de pantalla.
  useEffect(() => {
    document.documentElement.lang = locale
  }, [locale])

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next)
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      // sin persistencia — el cambio vale para esta sesión igual.
    }
  }, [])

  const t = useCallback(
    (key: string) => {
      const entry = DICTIONARY[key]
      if (!entry) return key
      return entry[locale] ?? entry[DEFAULT_LOCALE] ?? key
    },
    [locale]
  )

  const value = useMemo(
    () => ({ locale, setLocale, t }),
    [locale, setLocale, t]
  )

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
