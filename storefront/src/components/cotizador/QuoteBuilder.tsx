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
  fmtMoney,
  usFromSexo,
  DEFAULT_NOTAS,
  defaultNotas,
} from "@/lib/cotizacion/types"
import {
  quotesEnabled,
  listQuotes,
  insertQuote,
  updateQuote,
  deleteQuote,
  type SavedQuote,
} from "@/lib/cotizacion/store"
import type { Product } from "@/lib/shopify/types"

const uid = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2)

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
    moneda: "MXN",
    idioma: "es",
    notas: DEFAULT_NOTAS,
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
  const [flashId, setFlashId] = useState<string | null>(null) // resalta la ficha recién agregada
  // Guardado compartido (Supabase)
  const [savedId, setSavedId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState("")
  const [showSaved, setShowSaved] = useState(false)
  const [savedList, setSavedList] = useState<SavedQuote[] | null>(null)
  const [savedSearch, setSavedSearch] = useState("")

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
        const r = await searchProducts(q, 6, "ES") // interno: siempre en español (fuente)
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
  const money = (n: number) => fmtMoney(n, quote.moneda)

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

  // Ítem MANUAL (para productos descatalogados que ya no salen en la búsqueda).
  // Queda en blanco y editable: nombre, descripción, precio, tallas — todo a mano.
  const addManualItem = () => {
    const id = uid()
    const item: QuoteItem = {
      id,
      productHandle: "",
      title: "",
      descripcion: "",
      sexo: "",
      imageUrl: null,
      lines: [{ id: uid(), talla: "", cantidad: 1, precioUnitario: 0 }],
    }
    setQuote((q) => ({ ...q, items: [...q.items, item] }))
    setFlashId(id)
    setTimeout(() => setFlashId((f) => (f === id ? null : f)), 1500)
    // Feedback: baja a la ficha nueva y enfoca el nombre.
    setTimeout(() => {
      const el = document.getElementById(`ci-title-${id}`)
      el?.scrollIntoView({ behavior: "smooth", block: "center" })
      ;(el as HTMLInputElement | null)?.focus()
    }, 60)
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

  // ── guardado compartido (Supabase) ──
  const saveQuote = async () => {
    if (!quotesEnabled() || saving || quote.items.length === 0) return
    setSaving(true)
    try {
      const row = savedId ? await updateQuote(savedId, quote) : await insertQuote(quote)
      setSavedId(row.id)
      setSaveMsg("Guardada ✓")
      setTimeout(() => setSaveMsg(""), 2500)
    } catch (e) {
      console.error("[cotizador] guardar:", e)
      alert("No se pudo guardar la cotización. Revisa la conexión.")
    } finally {
      setSaving(false)
    }
  }
  const openSavedPanel = async () => {
    setShowSaved(true)
    setSavedList(null)
    try {
      setSavedList(await listQuotes())
    } catch (e) {
      console.error("[cotizador] listar:", e)
      setSavedList([])
    }
  }
  const openSaved = (sq: SavedQuote) => {
    setQuote(sq.data)
    setSavedId(sq.id)
    setShowSaved(false)
  }
  const duplicateSaved = (sq: SavedQuote) => {
    setQuote({ ...sq.data, folio: `${sq.data.folio}-copia` })
    setSavedId(null)
    setShowSaved(false)
  }
  const removeSaved = async (id: string) => {
    if (!confirm("¿Eliminar esta cotización guardada?")) return
    try {
      await deleteQuote(id)
      setSavedList((l) => (l ? l.filter((x) => x.id !== id) : l))
      if (savedId === id) setSavedId(null)
    } catch (e) {
      console.error("[cotizador] eliminar:", e)
    }
  }
  const newQuote = () => {
    setQuote(initialQuote())
    setSavedId(null)
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
        {quotesEnabled() && (
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={openSavedPanel}
              className="rounded-full border border-leather px-4 py-2 text-sm text-leather hover:bg-text hover:text-bg transition-colors"
            >
              Cotizaciones guardadas
            </button>
            <button type="button" onClick={newQuote} className="text-sm text-text-muted hover:text-text transition-colors">
              + Nueva
            </button>
            {savedId && (
              <span className="text-xs text-text-subtle">Editando · {quote.folio}</span>
            )}
          </div>
        )}
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
            <span className="mb-1 block text-xs text-text-muted">Moneda</span>
            <select
              className={inputCls}
              value={quote.moneda}
              onChange={(e) => setField({ moneda: e.target.value === "USD" ? "USD" : "MXN" })}
            >
              <option value="MXN">Pesos (MXN)</option>
              <option value="USD">Dólares (USD)</option>
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-xs text-text-muted">Idioma del PDF</span>
            <select
              className={inputCls}
              value={quote.idioma}
              onChange={(e) => {
                const next = e.target.value === "en" ? "en" : "es"
                // Cambia las notas al idioma nuevo SOLO si no las han personalizado.
                setQuote((q) => ({
                  ...q,
                  idioma: next,
                  notas: q.notas === defaultNotas(q.idioma) ? defaultNotas(next) : q.notas,
                }))
              }}
            >
              <option value="es">Español</option>
              <option value="en">Inglés</option>
            </select>
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

        {/* Producto manual — para descatalogados que ya no salen en la búsqueda */}
        <button
          type="button"
          onClick={addManualItem}
          className="mt-4 inline-flex items-center gap-2 rounded-full border-2 border-dashed border-leather px-5 py-2.5 text-sm font-medium text-leather transition-all hover:bg-text hover:text-bg active:scale-95"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14" /></svg>
          Agregar producto manual (descatalogado)
        </button>
      </section>

      {/* Productos agregados */}
      <section className="space-y-4">
        {quote.items.length === 0 ? (
          <div className="rounded-sm border border-dashed border-border p-10 text-center text-text-muted">
            Busca arriba y agrega botas a la cotización.
          </div>
        ) : (
          quote.items.map((item) => (
            <div
              key={item.id}
              className={`rounded-sm border p-4 transition-all ${
                flashId === item.id ? "border-leather ring-2 ring-leather/60" : "border-border"
              }`}
            >
              <div className="flex gap-4">
                <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-sm bg-bg-alt">
                  {item.imageUrl && (
                    <Image src={item.imageUrl} alt={item.title} fill sizes="80px" className="object-cover" unoptimized />
                  )}
                </div>
                <div className="min-w-0 flex-1 space-y-2">
                  <input
                    id={`ci-title-${item.id}`}
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
                    <div key={l.id} className="grid grid-cols-[1fr_1fr_1.2fr_1.2fr_auto] gap-2 items-start">
                      <div>
                        <input
                          className={inputCls}
                          value={l.talla}
                          onChange={(e) => updateLine(item.id, l.id, { talla: e.target.value })}
                          placeholder="26"
                        />
                        {usFromSexo(l.talla, item.sexo) && (
                          <span className="mt-0.5 block text-[11px] text-text-subtle">
                            US {usFromSexo(l.talla, item.sexo)}
                          </span>
                        )}
                      </div>
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

      {/* Notas / condiciones editables (salen al pie del PDF) */}
      <section className="mt-8 rounded-sm border border-border bg-bg-alt/40 p-5">
        <h2 className="font-heading text-lg text-text mb-1">Notas y condiciones</h2>
        <p className="mb-3 text-xs text-text-muted">
          Salen al pie del PDF. Una condición por línea — edítalas libremente.
        </p>
        <textarea
          className={`${inputCls} resize-y`}
          rows={4}
          value={quote.notas}
          onChange={(e) => setField({ notas: e.target.value })}
          placeholder="Una condición por línea…"
        />
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
          <div className="flex items-center gap-3">
            {saveMsg && <span className="text-xs font-medium text-leather">{saveMsg}</span>}
            {quotesEnabled() && (
              <button
                type="button"
                onClick={saveQuote}
                disabled={quote.items.length === 0 || saving}
                className=" border border-leather px-5 py-3 text-sm text-leather hover:bg-text hover:text-bg disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {saving ? "Guardando…" : savedId ? "Guardar cambios" : "Guardar"}
              </button>
            )}
            <button
              type="button"
              onClick={download}
              disabled={quote.items.length === 0 || generating}
              className=" bg-text px-6 py-3 text-sm text-bg hover:bg-text disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {generating ? "Generando…" : "Descargar PDF"}
            </button>
          </div>
        </div>
      </div>

      {/* Panel de cotizaciones guardadas (compartidas) */}
      {showSaved && (
        <div
          className="fixed inset-0 z-40 flex items-start justify-center bg-black/50 p-4 sm:p-8"
          onClick={() => setShowSaved(false)}
        >
          <div
            className="mt-4 w-full max-w-2xl rounded-sm bg-bg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border p-4">
              <h2 className="font-heading text-lg text-text">Cotizaciones guardadas</h2>
              <button
                type="button"
                onClick={() => setShowSaved(false)}
                aria-label="Cerrar"
                className="h-8 w-8 rounded-full text-text-subtle hover:bg-bg-alt hover:text-text transition-colors"
              >
                ✕
              </button>
            </div>
            <div className="p-4">
              <input
                className={inputCls}
                placeholder="Buscar por cliente o folio…"
                value={savedSearch}
                onChange={(e) => setSavedSearch(e.target.value)}
              />
              <div className="mt-3 max-h-[60vh] divide-y divide-border/60 overflow-y-auto">
                {savedList === null ? (
                  <p className="py-6 text-center text-sm text-text-muted">Cargando…</p>
                ) : (
                  (() => {
                    const q = savedSearch.trim().toLowerCase()
                    const filtered = q
                      ? savedList.filter((s) => `${s.cliente} ${s.folio}`.toLowerCase().includes(q))
                      : savedList
                    if (filtered.length === 0)
                      return <p className="py-6 text-center text-sm text-text-muted">Sin cotizaciones.</p>
                    return filtered.map((s) => (
                      <div key={s.id} className="flex items-center gap-3 py-3">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-text">
                            {s.cliente || "(sin cliente)"}
                          </p>
                          <p className="text-xs text-text-muted">
                            {s.folio} · {s.pares} pares ·{" "}
                            {new Intl.NumberFormat(s.moneda === "USD" ? "en-US" : "es-MX", {
                              style: "currency",
                              currency: s.moneda || "MXN",
                              maximumFractionDigits: 0,
                            }).format(s.total || 0)}{" "}
                            · {new Date(s.updated_at).toLocaleDateString("es-MX")}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => openSaved(s)}
                          className="text-xs uppercase tracking-wider text-leather hover:text-terracotta transition-colors"
                        >
                          Abrir
                        </button>
                        <button
                          type="button"
                          onClick={() => duplicateSaved(s)}
                          className="text-xs text-text-muted hover:text-text transition-colors"
                        >
                          Duplicar
                        </button>
                        <button
                          type="button"
                          onClick={() => removeSaved(s.id)}
                          aria-label="Eliminar"
                          className="h-7 w-7 rounded-full text-text-subtle hover:bg-bg-alt hover:text-terracotta transition-colors"
                        >
                          ✕
                        </button>
                      </div>
                    ))
                  })()
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
