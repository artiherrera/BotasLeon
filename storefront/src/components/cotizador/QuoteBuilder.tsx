"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { searchProducts } from "@/lib/search/client"
import { COTIZADOR_DEFAULTS } from "@/lib/cotizacion/config"
import {
  type Quote,
  type QuoteItem,
  type QuoteLine,
  totalPares,
  importeTotal,
} from "@/lib/cotizacion/types"
import type { Product } from "@/lib/shopify/types"

const uid = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2)

const money = (n: number) =>
  new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n || 0)

function initialQuote(): Quote {
  const now = new Date()
  const p2 = (n: number) => String(n).padStart(2, "0")
  const folio = `COT-${now.getFullYear()}${p2(now.getMonth() + 1)}${p2(now.getDate())}-01`
  const fecha = now.toLocaleDateString("es-MX", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })
  return {
    folio,
    fecha,
    vigencia: COTIZADOR_DEFAULTS.vigencia,
    cliente: "",
    atiende: COTIZADOR_DEFAULTS.atiende,
    contacto: COTIZADOR_DEFAULTS.contacto,
    items: [],
  }
}

const inputCls =
  "w-full rounded-sm border border-border bg-bg px-3 py-2 text-sm focus:border-leather focus:outline-none"

export function QuoteBuilder() {
  const [quote, setQuote] = useState<Quote>(initialQuote)
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<Product[]>([])
  const [searching, setSearching] = useState(false)
  const [generating, setGenerating] = useState(false)

  // Búsqueda de catálogo (debounce 300ms).
  useEffect(() => {
    const q = query.trim()
    if (!q) {
      setResults([])
      return
    }
    let active = true
    setSearching(true)
    const t = setTimeout(async () => {
      try {
        const r = await searchProducts(q, 6)
        if (active) setResults(r)
      } catch {
        if (active) setResults([])
      } finally {
        if (active) setSearching(false)
      }
    }, 300)
    return () => {
      active = false
      clearTimeout(t)
    }
  }, [query])

  const setField = (patch: Partial<Quote>) => setQuote((q) => ({ ...q, ...patch }))

  const addItem = (p: Product) => {
    const price = parseFloat(p.priceRange?.minVariantPrice?.amount || "0") || 0
    const descripcion = (p.description || "").replace(/\s+/g, " ").trim().slice(0, 160)
    const item: QuoteItem = {
      id: uid(),
      productHandle: p.handle,
      title: p.title,
      descripcion,
      sexo: "",
      imageUrl: p.featuredImage?.url ?? null,
      lines: [{ id: uid(), talla: "", cantidad: 1, precioUnitario: price }],
    }
    setQuote((q) => ({ ...q, items: [...q.items, item] }))
    setQuery("")
    setResults([])
  }

  const updateItem = (id: string, patch: Partial<QuoteItem>) =>
    setQuote((q) => ({
      ...q,
      items: q.items.map((it) => (it.id === id ? { ...it, ...patch } : it)),
    }))

  const removeItem = (id: string) =>
    setQuote((q) => ({ ...q, items: q.items.filter((it) => it.id !== id) }))

  const addLine = (itemId: string) =>
    setQuote((q) => ({
      ...q,
      items: q.items.map((it) => {
        if (it.id !== itemId) return it
        const prev = it.lines[it.lines.length - 1]
        return {
          ...it,
          lines: [
            ...it.lines,
            { id: uid(), talla: "", cantidad: 1, precioUnitario: prev?.precioUnitario ?? 0 },
          ],
        }
      }),
    }))

  const updateLine = (itemId: string, lineId: string, patch: Partial<QuoteLine>) =>
    setQuote((q) => ({
      ...q,
      items: q.items.map((it) =>
        it.id !== itemId
          ? it
          : {
              ...it,
              lines: it.lines.map((l) => (l.id === lineId ? { ...l, ...patch } : l)),
            }
      ),
    }))

  const removeLine = (itemId: string, lineId: string) =>
    setQuote((q) => ({
      ...q,
      items: q.items.map((it) =>
        it.id !== itemId ? it : { ...it, lines: it.lines.filter((l) => l.id !== lineId) }
      ),
    }))

  const download = async () => {
    if (!quote.items.length || generating) return
    setGenerating(true)
    try {
      const { generateQuotePdf } = await import("@/lib/cotizacion/pdf")
      const blob = await generateQuotePdf(quote)
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `Cotización BotasLeón - ${quote.cliente || quote.folio}.pdf`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch (e) {
      console.error("[cotizador] error al generar PDF:", e)
      alert("No se pudo generar el PDF. Revisa tu conexión e intenta de nuevo.")
    } finally {
      setGenerating(false)
    }
  }

  const pares = totalPares(quote.items)
  const importe = importeTotal(quote.items)

  return (
    <div className="mx-auto max-w-5xl px-6 py-10 pb-32">
      <div className="mb-8">
        <p className="eyebrow text-leather mb-1">Interno</p>
        <h1 className="font-display text-3xl md:text-4xl text-text">Cotizador de mayoreo</h1>
        <p className="text-text-muted mt-1 text-sm">
          Arma la cotización desde el catálogo, asigna precios y descarga el PDF con la marca.
        </p>
      </div>

      {/* Datos de la cotización */}
      <section className="mb-8 rounded-sm border border-border bg-bg-alt/40 p-5">
        <h2 className="font-heading text-lg text-text mb-4">Datos de la cotización</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="block sm:col-span-2">
            <span className="mb-1 block text-xs text-text-muted">Cliente</span>
            <input
              className={inputCls}
              value={quote.cliente}
              onChange={(e) => setField({ cliente: e.target.value })}
              placeholder="Nombre del cliente"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs text-text-muted">Folio</span>
            <input className={inputCls} value={quote.folio} onChange={(e) => setField({ folio: e.target.value })} />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs text-text-muted">Fecha</span>
            <input className={inputCls} value={quote.fecha} onChange={(e) => setField({ fecha: e.target.value })} />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs text-text-muted">Vigencia</span>
            <input className={inputCls} value={quote.vigencia} onChange={(e) => setField({ vigencia: e.target.value })} />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs text-text-muted">Atiende</span>
            <input className={inputCls} value={quote.atiende} onChange={(e) => setField({ atiende: e.target.value })} />
          </label>
        </div>
      </section>

      {/* Buscar productos */}
      <section className="mb-8">
        <h2 className="font-heading text-lg text-text mb-3">Agregar productos</h2>
        <div className="relative">
          <input
            className={inputCls}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar en el catálogo (nombre, marca, tipo…)"
          />
          {(searching || results.length > 0) && query.trim() && (
            <div className="absolute z-10 mt-1 w-full rounded-sm border border-border bg-bg shadow-xl max-h-80 overflow-y-auto">
              {searching && results.length === 0 ? (
                <p className="px-4 py-3 text-sm text-text-muted">Buscando…</p>
              ) : results.length === 0 ? (
                <p className="px-4 py-3 text-sm text-text-muted">Sin resultados.</p>
              ) : (
                results.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => addItem(p)}
                    className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-bg-alt transition-colors"
                  >
                    <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-sm bg-bg-alt">
                      {p.featuredImage && (
                        <Image src={p.featuredImage.url} alt={p.title} fill sizes="48px" className="object-cover" unoptimized />
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm text-text">{p.title}</span>
                      <span className="block text-xs text-text-muted">
                        {p.vendor} · {money(parseFloat(p.priceRange?.minVariantPrice?.amount || "0"))}
                      </span>
                    </span>
                    <span className="text-xs uppercase tracking-wider text-leather">Agregar</span>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      </section>

      {/* Productos agregados */}
      <section className="space-y-4">
        {quote.items.length === 0 ? (
          <div className="rounded-sm border border-dashed border-border p-10 text-center text-text-muted">
            Busca arriba y agrega botas a la cotización.
          </div>
        ) : (
          quote.items.map((item) => (
            <div key={item.id} className="rounded-sm border border-border p-4">
              <div className="flex gap-4">
                <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-sm bg-bg-alt">
                  {item.imageUrl && (
                    <Image src={item.imageUrl} alt={item.title} fill sizes="80px" className="object-cover" unoptimized />
                  )}
                </div>
                <div className="min-w-0 flex-1 space-y-2">
                  <input
                    className={inputCls}
                    value={item.title}
                    onChange={(e) => updateItem(item.id, { title: e.target.value })}
                    placeholder="Nombre del producto"
                  />
                  <textarea
                    className={`${inputCls} resize-none`}
                    rows={2}
                    value={item.descripcion}
                    onChange={(e) => updateItem(item.id, { descripcion: e.target.value })}
                    placeholder="Descripción (piel, horma, suela…)"
                  />
                  <select
                    className={`${inputCls} max-w-[160px]`}
                    value={item.sexo}
                    onChange={(e) => updateItem(item.id, { sexo: e.target.value })}
                  >
                    <option value="">Sexo…</option>
                    <option value="Hombre">Hombre</option>
                    <option value="Mujer">Mujer</option>
                    <option value="Unisex">Unisex</option>
                  </select>
                </div>
                <button
                  type="button"
                  onClick={() => removeItem(item.id)}
                  aria-label="Quitar producto"
                  className="h-8 w-8 shrink-0 rounded-full text-text-subtle hover:bg-bg-alt hover:text-terracotta transition-colors"
                >
                  <svg className="mx-auto" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
                </button>
              </div>

              {/* Líneas de talla */}
              <div className="mt-4 border-t border-border/60 pt-3">
                <div className="hidden sm:grid grid-cols-[1fr_1fr_1.2fr_1.2fr_auto] gap-2 px-1 pb-1 text-[11px] uppercase tracking-wider text-text-subtle">
                  <span>Talla MX</span>
                  <span>Cantidad</span>
                  <span>P. unitario</span>
                  <span>Importe</span>
                  <span />
                </div>
                <div className="space-y-2">
                  {item.lines.map((l) => (
                    <div key={l.id} className="grid grid-cols-[1fr_1fr_1.2fr_1.2fr_auto] gap-2 items-center">
                      <input
                        className={inputCls}
                        value={l.talla}
                        onChange={(e) => updateLine(item.id, l.id, { talla: e.target.value })}
                        placeholder="26"
                      />
                      <input
                        type="number"
                        min={0}
                        className={inputCls}
                        value={l.cantidad || ""}
                        onChange={(e) => updateLine(item.id, l.id, { cantidad: parseInt(e.target.value) || 0 })}
                        placeholder="1"
                      />
                      <input
                        type="number"
                        min={0}
                        step="0.01"
                        className={inputCls}
                        value={l.precioUnitario || ""}
                        onChange={(e) => updateLine(item.id, l.id, { precioUnitario: parseFloat(e.target.value) || 0 })}
                        placeholder="0.00"
                      />
                      <span className="px-1 text-sm text-text tabular-nums">
                        {money(l.cantidad * l.precioUnitario)}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeLine(item.id, l.id)}
                        aria-label="Quitar talla"
                        disabled={item.lines.length <= 1}
                        className="h-8 w-8 rounded-full text-text-subtle hover:bg-bg-alt hover:text-terracotta disabled:opacity-30 transition-colors"
                      >
                        <svg className="mx-auto" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /></svg>
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => addLine(item.id)}
                  className="mt-2 text-xs uppercase tracking-wider text-leather hover:text-terracotta transition-colors"
                >
                  + Agregar talla
                </button>
              </div>
            </div>
          ))
        )}
      </section>

      {/* Barra fija de totales + descarga */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-bg/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-6 py-3">
          <div className="text-sm">
            <span className="text-text-muted">Pares:</span>{" "}
            <strong className="text-text">{pares}</strong>
            <span className="mx-3 text-border">|</span>
            <span className="text-text-muted">Total:</span>{" "}
            <strong className="font-heading text-lg text-text">{money(importe)}</strong>
          </div>
          <button
            type="button"
            onClick={download}
            disabled={quote.items.length === 0 || generating}
            className="rounded-full bg-leather px-6 py-3 text-sm uppercase tracking-wider text-bg hover:bg-text disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {generating ? "Generando…" : "Descargar PDF"}
          </button>
        </div>
      </div>
    </div>
  )
}
