import {
  Document,
  Page,
  View,
  Text,
  StyleSheet,
  pdf,
} from "@react-pdf/renderer"
import { bothSizes } from "@/lib/cotizacion/types"
import type { Nota, NotaItem, Pago } from "./types"
import { fmtMoney, importeItem, importeTotal, totalPagado, totalPares } from "./types"
import { LEYENDA_TMEC } from "./config"

/**
 * PDF de la nota de venta. Se importa dinámicamente al descargar, igual que el
 * del cotizador: @react-pdf/renderer pesa demasiado para cargarlo en todo el
 * sitio por una sección interna.
 *
 * Mantiene la identidad del PDF de cotización a propósito — el cliente que
 * recibió una cotización y luego una nota debe ver el mismo documento.
 */

const C = {
  leather: "#3B2A20",
  brown: "#8B5A2B",
  text: "#1F1814",
  muted: "#5A4F44",
  subtle: "#8A7E6E",
  cream: "#F4E9D8",
  border: "#D8D0C2",
  rojo: "#8C2F2F",
}

const W = { desc: 210, talla: 96, cant: 46, punit: 85, importe: 94 }

const STR = {
  es: {
    titulo: "NOTA DE VENTA", folio: "Folio", fecha: "Fecha", cliente: "Cliente",
    contacto: "Contacto", entrega: "Entrega", atiende: "Atiende", vendedor: "Vendedor",
    desc: "DESCRIPCIÓN", talla: "TALLA", cant: "CANT.", punit: "P. UNITARIO", importe: "IMPORTE",
    pares: "Total de pares", total: "TOTAL", pagado: "Pagado", saldo: "SALDO PENDIENTE",
    condiciones: "Condiciones", cancelada: "CANCELADA", abonos: "Abonos recibidos",
    origen: "País de origen", fraccion: "Fracción arancelaria",
  },
  en: {
    titulo: "COMMERCIAL INVOICE", folio: "No.", fecha: "Date", cliente: "Buyer",
    contacto: "Contact", entrega: "Ship to", atiende: "Rep", vendedor: "Seller",
    desc: "DESCRIPTION", talla: "SIZE", cant: "QTY", punit: "UNIT PRICE", importe: "AMOUNT",
    pares: "Total pairs", total: "TOTAL", pagado: "Paid", saldo: "BALANCE DUE",
    condiciones: "Terms", cancelada: "VOID", abonos: "Payments received",
    origen: "Country of origin", fraccion: "HTS code",
  },
}

const s = StyleSheet.create({
  page: { paddingTop: 32, paddingHorizontal: 32, paddingBottom: 52, fontSize: 9, color: C.text },
  marca: { fontSize: 20, color: C.leather, letterSpacing: 1 },
  titulo: { fontSize: 9, color: C.brown, letterSpacing: 2, marginTop: 2 },
  cabecera: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start",
    borderBottomWidth: 2, borderBottomColor: C.leather, paddingBottom: 10, marginBottom: 12 },
  metaFila: { flexDirection: "row", justifyContent: "flex-end", marginBottom: 2 },
  metaEt: { color: C.subtle, marginRight: 6 },
  partes: { flexDirection: "row", gap: 18, marginBottom: 12 },
  parte: { flex: 1, backgroundColor: C.cream, padding: 9 },
  parteEt: { fontSize: 7, color: C.brown, letterSpacing: 1, marginBottom: 3 },
  parteNombre: { fontSize: 10, color: C.leather, marginBottom: 2 },
  parteLinea: { color: C.muted, lineHeight: 1.4 },
  thead: { flexDirection: "row", backgroundColor: C.leather, paddingVertical: 5, paddingHorizontal: 6 },
  th: { color: "#FFF", fontSize: 7, letterSpacing: 0.8 },
  fila: { flexDirection: "row", paddingVertical: 6, paddingHorizontal: 6,
    borderBottomWidth: 0.5, borderBottomColor: C.border },
  nombre: { fontSize: 9, color: C.leather },
  detalle: { fontSize: 7.5, color: C.subtle, marginTop: 1 },
  der: { textAlign: "right" },
  totales: { marginTop: 10, alignSelf: "flex-end", width: 250 },
  totalFila: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 3 },
  totalGrande: { flexDirection: "row", justifyContent: "space-between",
    borderTopWidth: 1.5, borderTopColor: C.leather, marginTop: 4, paddingTop: 6 },
  saldoFila: { flexDirection: "row", justifyContent: "space-between",
    backgroundColor: C.cream, marginTop: 4, padding: 6 },
  bloque: { marginTop: 16, borderTopWidth: 0.5, borderTopColor: C.border, paddingTop: 8 },
  bloqueEt: { fontSize: 7, color: C.brown, letterSpacing: 1, marginBottom: 4 },
  chico: { color: C.muted, lineHeight: 1.5 },
  firma: { marginTop: 26, flexDirection: "row", justifyContent: "flex-end" },
  lineaFirma: { width: 200, borderTopWidth: 0.5, borderTopColor: C.muted, paddingTop: 4,
    textAlign: "center", color: C.subtle, fontSize: 7.5 },
  sello: { position: "absolute", top: 200, left: 120, fontSize: 60, color: C.rojo,
    opacity: 0.18, transform: "rotate(-24deg)" },
  pie: { position: "absolute", bottom: 24, left: 32, right: 32, textAlign: "center",
    fontSize: 7, color: C.subtle },
})

function Fila({ it, nota, L }: { it: NotaItem; nota: Nota; L: Record<string, string> }) {
  // Una partida puede llevar varias tallas: se imprime un renglón por talla,
  // porque el comprador necesita ver qué talla corresponde a qué importe.
  return (
    <>
      {it.lines.map((l, i) => (
        <View key={l.id} style={s.fila} wrap={false}>
          <View style={{ width: W.desc }}>
            {i === 0 && <Text style={s.nombre}>{it.title}</Text>}
            {i === 0 && !!it.descripcion && <Text style={s.detalle}>{it.descripcion}</Text>}
          </View>
          <Text style={{ width: W.talla }}>{bothSizes(l.talla, it.sexo)}</Text>
          <Text style={[s.der, { width: W.cant }]}>{l.cantidad}</Text>
          <Text style={[s.der, { width: W.punit }]}>
            {fmtMoney(l.precioUnitario, nota.moneda)}
          </Text>
          <Text style={[s.der, { width: W.importe }]}>
            {fmtMoney(l.cantidad * l.precioUnitario, nota.moneda)}
          </Text>
        </View>
      ))}
      {it.lines.length > 1 && (
        <View style={[s.fila, { borderBottomWidth: 0, paddingVertical: 2 }]}>
          <Text style={{ width: W.desc + W.talla + W.cant + W.punit }} />
          <Text style={[s.der, { width: W.importe, color: C.muted }]}>
            {fmtMoney(importeItem(it), nota.moneda)}
          </Text>
        </View>
      )}
    </>
  )
}

export function NotaDoc({
  nota,
  pagos = [],
  cancelada = false,
}: {
  nota: Nota
  pagos?: Pago[]
  cancelada?: boolean
}) {
  const L = STR[nota.idioma === "en" ? "en" : "es"]
  const total = importeTotal(nota.items)
  const pagado = totalPagado(pagos)
  const saldo = total - pagado
  const exporta = nota.tipo === "exportacion"

  return (
    <Document title={`${L.titulo} ${nota.folio}`}>
      <Page size="A4" style={s.page}>
        {/* Una nota cancelada se conserva, no se borra: el sello evita que se
            confunda con una viva si alguien la imprime. */}
        {cancelada && <Text style={s.sello}>{L.cancelada}</Text>}

        <View style={s.cabecera}>
          <View>
            <Text style={s.marca}>BotasLeón</Text>
            <Text style={s.titulo}>{L.titulo}</Text>
          </View>
          <View>
            <View style={s.metaFila}>
              <Text style={s.metaEt}>{L.folio}</Text>
              <Text style={{ color: C.leather }}>{nota.folio || "—"}</Text>
            </View>
            <View style={s.metaFila}>
              <Text style={s.metaEt}>{L.fecha}</Text>
              <Text>{nota.fecha}</Text>
            </View>
            {!!nota.atiende && (
              <View style={s.metaFila}>
                <Text style={s.metaEt}>{L.atiende}</Text>
                <Text>{nota.atiende}</Text>
              </View>
            )}
          </View>
        </View>

        <View style={s.partes}>
          <View style={s.parte}>
            <Text style={s.parteEt}>{L.vendedor}</Text>
            <Text style={s.parteNombre}>{nota.vendedorNombre}</Text>
            {nota.vendedorDomicilio.split("\n").map((l, i) => (
              <Text key={i} style={s.parteLinea}>
                {l}
              </Text>
            ))}
          </View>
          <View style={s.parte}>
            <Text style={s.parteEt}>{L.cliente}</Text>
            <Text style={s.parteNombre}>{nota.cliente || "—"}</Text>
            {!!nota.compradorDomicilio && (
              <Text style={s.parteLinea}>{nota.compradorDomicilio}</Text>
            )}
            {!!nota.contacto && <Text style={s.parteLinea}>{nota.contacto}</Text>}
            {!!nota.entrega && (
              <Text style={s.parteLinea}>
                {L.entrega}: {nota.entrega}
              </Text>
            )}
          </View>
        </View>

        <View style={s.thead}>
          <Text style={[s.th, { width: W.desc }]}>{L.desc}</Text>
          <Text style={[s.th, { width: W.talla }]}>{L.talla}</Text>
          <Text style={[s.th, s.der, { width: W.cant }]}>{L.cant}</Text>
          <Text style={[s.th, s.der, { width: W.punit }]}>{L.punit}</Text>
          <Text style={[s.th, s.der, { width: W.importe }]}>{L.importe}</Text>
        </View>

        {nota.items.map((it) => (
          <Fila key={it.id} it={it} nota={nota} L={L} />
        ))}

        <View style={s.totales}>
          <View style={s.totalFila}>
            <Text style={{ color: C.muted }}>{L.pares}</Text>
            <Text>{totalPares(nota.items)}</Text>
          </View>
          <View style={s.totalGrande}>
            <Text style={{ fontSize: 11, color: C.leather }}>{L.total}</Text>
            <Text style={{ fontSize: 11, color: C.leather }}>
              {fmtMoney(total, nota.moneda)}
            </Text>
          </View>
          {/* El saldo solo aparece si hay abonos: en una venta pagada de
              contado, un renglón "saldo 0" solo genera dudas. */}
          {pagado > 0 && (
            <>
              <View style={s.totalFila}>
                <Text style={{ color: C.muted }}>{L.pagado}</Text>
                <Text>−{fmtMoney(pagado, nota.moneda)}</Text>
              </View>
              <View style={s.saldoFila}>
                <Text style={{ color: C.leather }}>{L.saldo}</Text>
                <Text style={{ color: C.leather }}>{fmtMoney(saldo, nota.moneda)}</Text>
              </View>
            </>
          )}
        </View>

        {pagos.length > 1 && (
          <View style={s.bloque}>
            <Text style={s.bloqueEt}>{L.abonos.toUpperCase()}</Text>
            {pagos.map((p) => (
              <Text key={p.id} style={s.chico}>
                {new Date(p.pagadoEn).toLocaleDateString("es-MX")} · {p.forma}
                {p.referencia ? ` · ${p.referencia}` : ""} ·{" "}
                {fmtMoney(p.monto, nota.moneda)}
              </Text>
            ))}
          </View>
        )}

        {/* Bloque de exportación: hoy no se usa (las notas son nacionales), pero
            queda listo para cuando haya que facturar a Estados Unidos. */}
        {exporta && (
          <View style={s.bloque}>
            <Text style={s.bloqueEt}>USMCA / T-MEC</Text>
            <Text style={s.chico}>
              {L.origen}: México · {L.fraccion}:{" "}
              {nota.items[0]?.aduana?.fraccion || "—"}
            </Text>
            <Text style={[s.chico, { marginTop: 4 }]}>{LEYENDA_TMEC}</Text>
            {!!nota.certificaNombre && (
              <Text style={[s.chico, { marginTop: 6 }]}>
                {nota.certificaNombre}
                {nota.certificaCargo ? ` · ${nota.certificaCargo}` : ""}
              </Text>
            )}
          </View>
        )}

        {!!nota.notas.trim() && (
          <View style={s.bloque}>
            <Text style={s.bloqueEt}>{L.condiciones.toUpperCase()}</Text>
            {nota.notas.split("\n").filter(Boolean).map((linea, i) => (
              <Text key={i} style={s.chico}>
                · {linea}
              </Text>
            ))}
          </View>
        )}

        <View style={s.firma}>
          <Text style={s.lineaFirma}>{nota.atiende || nota.vendedorNombre}</Text>
        </View>

        <Text style={s.pie} fixed>
          {nota.vendedorNombre} · {nota.vendedorDomicilio.replace(/\n/g, ", ")}
        </Text>
      </Page>
    </Document>
  )
}

export async function generarNotaPdf(
  nota: Nota,
  pagos: Pago[] = [],
  cancelada = false
): Promise<Blob> {
  return pdf(<NotaDoc nota={nota} pagos={pagos} cancelada={cancelada} />).toBlob()
}
