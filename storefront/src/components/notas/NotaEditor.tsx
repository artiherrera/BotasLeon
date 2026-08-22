"use client"

import { useEffect, useState } from "react"
import { TablaFracciones } from "./TablaFracciones"
import { CONDICIONES_DEFAULT, notaVacia, citesEnNota, sugerirFraccion } from "@/lib/nota/config"
import {
  cancelarNota, emitirNota, insertNota, listNotas, listPagos,
  registrarPago, updateNota, type NotaGuardada,
} from "@/lib/nota/store"
import type { FormaPago, Nota, NotaItem, Pago, QuoteLine } from "@/lib/nota/types"
import { fmtMoney, importeItem, importeTotal, totalPagado, totalPares } from "@/lib/nota/types"

/**
 * Editor de notas de venta.
 *
 * TODO es modificable mientras la nota esté en borrador: el nombre del producto,
 * su descripción, la talla, la cantidad, el precio, los domicilios, el folio y
 * la fracción arancelaria. Nada se hereda bloqueado del catálogo — los precios
 * de estas ventas se arman al momento y rara vez coinciden con los de la tienda.
 *
 * Lo único que se congela es lo ya emitido, y para eso está cancelar y emitir
 * de nuevo: una nota emitida es el registro de que se cobró dinero.
 */

const uid = () => Math.random().toString(36).slice(2, 9)

const lineaVacia = (): QuoteLine => ({
  id: uid(), talla: "", cantidad: 1, precioUnitario: 0,
})

const itemVacio = (): NotaItem => ({
  id: uid(), productHandle: "", title: "", descripcion: "", sexo: "Hombre",
  imageUrl: null, suela: "piel", lines: [lineaVacia()],
})

const inp =
  "w-full border border-border bg-bg px-2.5 py-2 text-sm focus:border-leather focus:outline-none"
const et = "block text-[11px] text-text-muted mb-1"

export function NotaEditor() {
  const [nota, setNota] = useState<Nota>(() => notaVacia("nacional"))
  const [id, setId] = useState<string | null>(null)
  const [estado, setEstado] = useState<string>("borrador")
  const [pagos, setPagos] = useState<Pago[]>([])
  const [lista, setLista] = useState<NotaGuardada[]>([])
  const [msg, setMsg] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [ocupado, setOcupado] = useState(false)

  const editable = estado === "borrador"
  const total = importeTotal(nota.items)
  const pagado = totalPagado(pagos)
  const cites = citesEnNota(nota.items)

  const set = <K extends keyof Nota>(k: K, v: Nota[K]) =>
    setNota((n) => ({ ...n, [k]: v }))

  const setItem = (i: number, parche: Partial<NotaItem>) =>
    setNota((n) => ({
      ...n,
      items: n.items.map((it, j) => (j === i ? { ...it, ...parche } : it)),
    }))

  const setLinea = (i: number, j: number, parche: Partial<QuoteLine>) =>
    setNota((n) => ({
      ...n,
      items: n.items.map((it, x) =>
        x !== i ? it : { ...it, lines: it.lines.map((l, y) => (y === j ? { ...l, ...parche } : l)) }
      ),
    }))

  const recargar = () => listNotas().then(setLista).catch(() => {})
  useEffect(() => { recargar() }, [])

  async function correr(fn: () => Promise<void>, ok: string) {
    setOcupado(true); setError(null); setMsg(null)
    try { await fn(); setMsg(ok) }
    catch (e) { setError(e instanceof Error ? e.message : "Algo falló") }
    finally { setOcupado(false) }
  }

  const guardar = () =>
    correr(async () => {
      const fila = id ? await updateNota(id, nota) : await insertNota(nota)
      setId(fila.id); setEstado(fila.estado)
      // El folio lo genera Postgres en el alta: se refleja de vuelta.
      setNota((n) => ({ ...n, folio: fila.folio }))
      await recargar()
    }, "Guardado")

  const emitir = () =>
    correr(async () => {
      if (!id) throw new Error("Guarda la nota antes de emitirla")
      const folio = await emitirNota(id)
      setEstado("emitida"); setNota((n) => ({ ...n, folio }))
      await recargar()
    }, "Emitida — ya no se puede modificar")

  const cancelar = () =>
    correr(async () => {
      if (!id) return
      const motivo = window.prompt("¿Por qué se cancela?") || ""
      if (!motivo) throw new Error("Hace falta un motivo")
      await cancelarNota(id, motivo)
      setEstado("cancelada"); await recargar()
    }, "Cancelada")

  const descargar = () =>
    correr(async () => {
      const { generarNotaPdf } = await import("@/lib/nota/pdf")
      const blob = await generarNotaPdf(nota, pagos, estado === "cancelada")
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url; a.download = `${nota.folio || "nota"}.pdf`; a.click()
      URL.revokeObjectURL(url)
    }, "PDF descargado")

  const abonar = () =>
    correr(async () => {
      if (!id) throw new Error("Guarda la nota primero")
      const m = Number(window.prompt("¿De cuánto es el abono?") || 0)
      if (!m || m <= 0) throw new Error("Monto inválido")
      const forma = (window.prompt("efectivo, transferencia, tarjeta, deposito u otro", "transferencia") ||
        "efectivo") as FormaPago
      await registrarPago(id, m, forma)
      setPagos(await listPagos(id))
    }, "Abono registrado")

  async function abrir(f: NotaGuardada) {
    setId(f.id); setEstado(f.estado)
    setNota({ ...notaVacia(), ...f.data, folio: f.folio })
    setPagos(await listPagos(f.id).catch(() => []))
    setMsg(null); setError(null)
  }

  function nueva() {
    setId(null); setEstado("borrador"); setPagos([])
    setNota(notaVacia("nacional")); setMsg(null); setError(null)
  }

  return (
    <div className="grid lg:grid-cols-[260px_1fr] gap-8">
      {/* ── Notas guardadas ── */}
      <aside>
        <button onClick={nueva} className="w-full bg-text py-2.5 text-sm text-bg hover:bg-leather-light transition-colors mb-3">
          Nota nueva
        </button>
        <div className="border border-border divide-y divide-border max-h-[70vh] overflow-y-auto">
          {lista.length === 0 && <p className="p-3 text-xs text-text-muted">Todavía no hay notas.</p>}
          {lista.map((f) => (
            <button key={f.id} onClick={() => abrir(f)}
              className={`w-full text-left p-3 hover:bg-bg-alt transition-colors ${id === f.id ? "bg-bg-alt" : ""}`}>
              <div className="flex justify-between text-xs">
                <span className="font-mono">{f.folio}</span>
                <span className={f.estado === "cancelada" ? "text-leather" : "text-text-muted"}>{f.estado}</span>
              </div>
              <div className="text-sm truncate">{f.cliente || "Sin cliente"}</div>
              <div className="text-xs text-text-muted tabular-nums">{fmtMoney(Number(f.total), f.moneda as "MXN" | "USD")}</div>
            </button>
          ))}
        </div>
      </aside>

      <div>
        {!editable && (
          <p className="mb-4 border-l-2 border-leather bg-bg-alt p-3 text-sm">
            Esta nota está <strong>{estado}</strong>. Ya no se puede modificar — si algo
            quedó mal, cancélala y emite una nueva.
          </p>
        )}
        {cites.length > 0 && (
          <p className="mb-4 border-l-2 border-leather bg-bg-alt p-3 text-sm">
            <strong>Piel CITES detectada</strong> en: {cites.join(", ")}. Exportar pitón o
            caimán a Estados Unidos exige permiso del USFWS y de 8 a 12 semanas de trámite.
            Para venta nacional no aplica.
          </p>
        )}

        {/* ── Encabezado ── */}
        <div className="grid sm:grid-cols-3 gap-3 mb-5">
          <div><label className={et}>Folio</label>
            <input className={inp} value={nota.folio} disabled={!editable}
              placeholder="Lo genera el sistema" onChange={(e) => set("folio", e.target.value)} /></div>
          <div><label className={et}>Fecha</label>
            <input className={inp} value={nota.fecha} disabled={!editable} onChange={(e) => set("fecha", e.target.value)} /></div>
          <div><label className={et}>Atiende</label>
            <input className={inp} value={nota.atiende} disabled={!editable} onChange={(e) => set("atiende", e.target.value)} /></div>
          <div><label className={et}>Tipo</label>
            <select className={inp} value={nota.tipo} disabled={!editable}
              onChange={(e) => set("tipo", e.target.value as Nota["tipo"])}>
              <option value="nacional">Nacional</option>
              <option value="exportacion">Exportación</option>
            </select></div>
          <div><label className={et}>Moneda</label>
            <select className={inp} value={nota.moneda} disabled={!editable}
              onChange={(e) => set("moneda", e.target.value as Nota["moneda"])}>
              <option value="MXN">MXN</option><option value="USD">USD</option>
            </select></div>
          <div><label className={et}>Idioma del PDF</label>
            <select className={inp} value={nota.idioma} disabled={!editable}
              onChange={(e) => set("idioma", e.target.value as Nota["idioma"])}>
              <option value="es">Español</option><option value="en">Inglés</option>
            </select></div>
        </div>

        {/* ── Partes ── */}
        <div className="grid sm:grid-cols-2 gap-4 mb-5">
          <div className="space-y-3">
            <div><label className={et}>Vendedor</label>
              <input className={inp} value={nota.vendedorNombre} disabled={!editable}
                onChange={(e) => set("vendedorNombre", e.target.value)} /></div>
            <div><label className={et}>Domicilio del vendedor</label>
              <textarea className={inp} rows={2} value={nota.vendedorDomicilio} disabled={!editable}
                onChange={(e) => set("vendedorDomicilio", e.target.value)} /></div>
          </div>
          <div className="space-y-3">
            <div><label className={et}>Cliente</label>
              <input className={inp} value={nota.cliente} disabled={!editable}
                onChange={(e) => set("cliente", e.target.value)} /></div>
            <div><label className={et}>Domicilio del cliente</label>
              <textarea className={inp} rows={2} value={nota.compradorDomicilio} disabled={!editable}
                onChange={(e) => set("compradorDomicilio", e.target.value)} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className={et}>Contacto</label>
                <input className={inp} value={nota.contacto} disabled={!editable}
                  onChange={(e) => set("contacto", e.target.value)} /></div>
              <div><label className={et}>Entrega estimada</label>
                <input type="date" className={inp} value={nota.entregaEstimada} disabled={!editable}
                  onChange={(e) => set("entregaEstimada", e.target.value)} /></div>
            </div>
          </div>
        </div>

        {/* ── Partidas ── */}
        {nota.items.map((it, i) => (
          <div key={it.id} className="border border-border p-4 mb-3">
            <div className="grid sm:grid-cols-[1fr_140px_120px_auto] gap-3 mb-3">
              <div><label className={et}>Producto</label>
                <input className={inp} value={it.title} disabled={!editable}
                  placeholder="Nombre como debe salir impreso"
                  onChange={(e) => setItem(i, { title: e.target.value })} /></div>
              <div><label className={et}>Para</label>
                <select className={inp} value={it.sexo} disabled={!editable}
                  onChange={(e) => setItem(i, { sexo: e.target.value })}>
                  <option>Hombre</option><option>Mujer</option><option>Unisex</option>
                </select></div>
              <div><label className={et}>Suela</label>
                <select className={inp} value={it.suela ?? "piel"} disabled={!editable}
                  onChange={(e) => setItem(i, { suela: e.target.value as "piel" | "hule" })}>
                  <option value="piel">Piel</option><option value="hule">Hule / PU</option>
                </select></div>
              {editable && (
                <button onClick={() => setNota((n) => ({ ...n, items: n.items.filter((_, j) => j !== i) }))}
                  className="self-end pb-2 text-xs text-text-muted hover:text-leather">Quitar</button>
              )}
            </div>
            <div className="mb-3"><label className={et}>Descripción</label>
              <input className={inp} value={it.descripcion} disabled={!editable}
                placeholder="Piel, horma, suela…"
                onChange={(e) => setItem(i, { descripcion: e.target.value })} /></div>

            {it.lines.map((l, j) => (
              <div key={l.id} className="grid grid-cols-[1fr_90px_1fr_110px_auto] gap-2 mb-2 items-end">
                <div><label className={et}>Talla MX</label>
                  <input className={inp} value={l.talla} disabled={!editable}
                    onChange={(e) => setLinea(i, j, { talla: e.target.value })} /></div>
                <div><label className={et}>Cant.</label>
                  <input type="number" min={1} className={inp} value={l.cantidad} disabled={!editable}
                    onChange={(e) => setLinea(i, j, { cantidad: Number(e.target.value) })} /></div>
                <div><label className={et}>Precio unitario</label>
                  <input type="number" min={0} step="0.01" className={inp} value={l.precioUnitario} disabled={!editable}
                    onChange={(e) => setLinea(i, j, { precioUnitario: Number(e.target.value) })} /></div>
                <div className="pb-2 text-right text-sm tabular-nums">
                  {fmtMoney(l.cantidad * l.precioUnitario, nota.moneda)}
                </div>
                {editable && it.lines.length > 1 && (
                  <button onClick={() => setNota((n) => ({ ...n, items: n.items.map((x, y) =>
                    y !== i ? x : { ...x, lines: x.lines.filter((_, z) => z !== j) }) }))}
                    className="pb-2 text-xs text-text-muted hover:text-leather">×</button>
                )}
              </div>
            ))}
            {editable && (
              <button onClick={() => setItem(i, { lines: [...it.lines, lineaVacia()] })}
                className="text-xs text-leather underline underline-offset-4">+ otra talla</button>
            )}

            {nota.tipo === "exportacion" && (
              <div className="mt-4">
                <TablaFracciones sexo={it.sexo} suela={it.suela ?? "piel"}
                  valor={it.aduana?.fraccion ?? sugerirFraccion(it.sexo, it.suela ?? "piel").codigo}
                  onElegir={(codigo) => setItem(i, {
                    aduana: { fraccion: codigo, paisOrigen: "MX",
                      descripcionEn: it.aduana?.descripcionEn ?? "" },
                  })} />
              </div>
            )}
            <p className="mt-3 text-right text-xs text-text-muted">
              Subtotal: {fmtMoney(importeItem(it), nota.moneda)}
            </p>
          </div>
        ))}

        {editable && (
          <button onClick={() => setNota((n) => ({ ...n, items: [...n.items, itemVacio()] }))}
            className="mb-5 border border-leather px-4 py-2 text-sm text-leather hover:bg-text hover:text-bg transition-colors">
            + Agregar producto
          </button>
        )}

        <div className="mb-5"><label className={et}>Condiciones (una por renglón)</label>
          <textarea className={inp} rows={3} value={nota.notas} disabled={!editable}
            placeholder={CONDICIONES_DEFAULT} onChange={(e) => set("notas", e.target.value)} /></div>

        {/* ── Totales ── */}
        <div className="border-t border-border pt-4 mb-5 text-sm">
          <div className="flex justify-between text-text-muted"><span>Pares</span><span>{totalPares(nota.items)}</span></div>
          <div className="flex justify-between text-lg text-leather mt-1">
            <span>Total</span><span className="tabular-nums">{fmtMoney(total, nota.moneda)}</span></div>
          {pagado > 0 && (
            <div className="flex justify-between mt-1"><span>Saldo</span>
              <span className="tabular-nums">{fmtMoney(total - pagado, nota.moneda)}</span></div>
          )}
        </div>

        {msg && <p className="mb-3 text-sm text-leather">{msg}</p>}
        {error && <p className="mb-3 text-sm text-leather">{error}</p>}

        <div className="flex flex-wrap gap-2">
          {editable && <button onClick={guardar} disabled={ocupado}
            className="bg-text px-5 py-2.5 text-sm text-bg hover:bg-leather-light disabled:opacity-50 transition-colors">Guardar</button>}
          {editable && id && <button onClick={emitir} disabled={ocupado}
            className="border border-leather px-5 py-2.5 text-sm text-leather hover:bg-text hover:text-bg transition-colors">Emitir</button>}
          {id && estado !== "cancelada" && <button onClick={abonar} disabled={ocupado}
            className="border border-border px-5 py-2.5 text-sm hover:border-leather transition-colors">Registrar abono</button>}
          <button onClick={descargar} disabled={ocupado}
            className="border border-border px-5 py-2.5 text-sm hover:border-leather transition-colors">Descargar PDF</button>
          {id && estado !== "cancelada" && <button onClick={cancelar} disabled={ocupado}
            className="ml-auto text-sm text-text-muted hover:text-leather">Cancelar nota</button>}
        </div>
      </div>
    </div>
  )
}
