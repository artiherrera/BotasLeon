import {
  Document,
  Page,
  View,
  Text,
  Image,
  StyleSheet,
  pdf,
} from "@react-pdf/renderer"
import type { Quote, QuoteItem } from "./types"
import { totalPares, importeTotal } from "./types"

/**
 * Generación del PDF de cotización de mayoreo con la identidad de BotasLeón.
 * Se importa dinámicamente al momento de descargar (no pesa en el resto del
 * sitio). Devuelve un Blob para disparar la descarga.
 */

const C = {
  leather: "#3B2A20",
  brown: "#8B5A2B",
  text: "#1F1814",
  muted: "#5A4F44",
  subtle: "#8A7E6E",
  cream: "#F4E9D8",
  border: "#D8D0C2",
  white: "#FFFFFF",
}

// Anchos de columna (A4 útil ≈ 531pt con padding 32).
const W = { foto: 60, desc: 179, sexo: 52, talla: 52, cant: 40, punit: 72, importe: 76 }

const money = (n: number) =>
  new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n)

const s = StyleSheet.create({
  page: {
    paddingTop: 32,
    paddingBottom: 56,
    paddingHorizontal: 32,
    fontSize: 9,
    color: C.text,
    fontFamily: "Helvetica",
  },
  // Header de marca
  headerRule: { borderTopWidth: 2, borderTopColor: C.leather, marginHorizontal: 90 },
  brand: {
    fontFamily: "Times-Roman",
    fontSize: 24,
    letterSpacing: 6,
    textAlign: "center",
    color: C.leather,
    marginTop: 6,
  },
  brandSub: {
    fontSize: 8,
    letterSpacing: 3,
    textAlign: "center",
    color: C.brown,
    marginTop: 2,
    marginBottom: 6,
  },
  // Meta
  metaRow: { flexDirection: "row", marginTop: 14, marginBottom: 12 },
  metaCol: { flex: 1, flexDirection: "column", gap: 3 },
  metaLine: { flexDirection: "row" },
  metaLabel: { width: 56, color: C.brown, fontFamily: "Helvetica-Bold", fontSize: 8 },
  metaValue: { flex: 1, color: C.text, fontSize: 9 },
  // Tabla
  thead: {
    flexDirection: "row",
    backgroundColor: C.leather,
    color: C.white,
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  th: { fontFamily: "Helvetica-Bold", fontSize: 7.5, letterSpacing: 0.5, color: C.white },
  item: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  fotoCell: { width: W.foto, alignItems: "center", justifyContent: "center" },
  foto: { width: 50, height: 50, objectFit: "contain" },
  fotoPlaceholder: {
    width: 50,
    height: 50,
    backgroundColor: C.cream,
    borderWidth: 1,
    borderColor: C.border,
  },
  descCell: { width: W.desc, paddingHorizontal: 6, justifyContent: "center" },
  descTitle: { fontFamily: "Helvetica-Bold", fontSize: 9, color: C.text },
  descText: { fontSize: 7.5, color: C.muted, marginTop: 2, lineHeight: 1.3 },
  sexoCell: { width: W.sexo, justifyContent: "center", color: C.muted },
  // Columna derecha con las líneas de talla
  linesCol: { flex: 1, flexDirection: "column" },
  lineRow: { flexDirection: "row", minHeight: 16, alignItems: "center" },
  cTalla: { width: W.talla, textAlign: "center" },
  cCant: { width: W.cant, textAlign: "center" },
  cPunit: { width: W.punit, textAlign: "right", paddingRight: 6 },
  cImporte: { width: W.importe, textAlign: "right", fontFamily: "Helvetica-Bold" },
  // Totales
  totalsWrap: { flexDirection: "row", justifyContent: "flex-end", marginTop: 16 },
  totalsBox: { width: 240 },
  totalPares: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: C.cream,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  totalImporte: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: C.leather,
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginTop: 4,
  },
  totalLabel: { fontFamily: "Helvetica-Bold", fontSize: 9, color: C.text },
  totalValue: { fontFamily: "Helvetica-Bold", fontSize: 9, color: C.text },
  totalImporteLabel: { fontFamily: "Helvetica-Bold", fontSize: 10, color: C.white },
  totalImporteValue: { fontFamily: "Helvetica-Bold", fontSize: 12, color: C.white },
  // Notas + footer
  notes: { marginTop: 18, gap: 3 },
  note: { fontSize: 7.5, color: C.subtle },
  footer: {
    position: "absolute",
    bottom: 24,
    left: 32,
    right: 32,
    textAlign: "center",
    fontSize: 7.5,
    letterSpacing: 1.5,
    color: C.subtle,
    borderTopWidth: 1,
    borderTopColor: C.border,
    paddingTop: 8,
  },
})

function ItemRows({ item }: { item: QuoteItem }) {
  const lines = item.lines.length ? item.lines : [{ id: "x", talla: "", cantidad: 0, precioUnitario: 0 }]
  return (
    <View style={s.item} wrap={false}>
      <View style={s.fotoCell}>
        {item.imageUrl ? (
          // eslint-disable-next-line jsx-a11y/alt-text -- react-pdf Image no es HTML img (no lleva alt)
          <Image style={s.foto} src={`${item.imageUrl}${item.imageUrl.includes("?") ? "&" : "?"}width=200`} />
        ) : (
          <View style={s.fotoPlaceholder} />
        )}
      </View>
      <View style={s.descCell}>
        <Text style={s.descTitle}>{item.title}</Text>
        {item.descripcion ? <Text style={s.descText}>{item.descripcion}</Text> : null}
      </View>
      <View style={s.sexoCell}>
        <Text>{item.sexo}</Text>
      </View>
      <View style={s.linesCol}>
        {lines.map((l) => (
          <View key={l.id} style={s.lineRow}>
            <Text style={s.cTalla}>{l.talla}</Text>
            <Text style={s.cCant}>{l.cantidad || ""}</Text>
            <Text style={s.cPunit}>{l.precioUnitario ? money(l.precioUnitario) : ""}</Text>
            <Text style={s.cImporte}>
              {l.cantidad && l.precioUnitario ? money(l.cantidad * l.precioUnitario) : ""}
            </Text>
          </View>
        ))}
      </View>
    </View>
  )
}

function QuoteDoc({ quote }: { quote: Quote }) {
  const pares = totalPares(quote.items)
  const importe = importeTotal(quote.items)

  return (
    <Document title={quote.folio}>
      <Page size="A4" style={s.page}>
        {/* Marca */}
        <View style={s.headerRule} />
        <Text style={s.brand}>BOTAS LEÓN</Text>
        <Text style={s.brandSub}>COTIZACIÓN DE MAYOREO</Text>
        <View style={s.headerRule} />

        {/* Meta */}
        <View style={s.metaRow}>
          <View style={s.metaCol}>
            <MetaLine label="Folio" value={quote.folio} />
            <MetaLine label="Fecha" value={quote.fecha} />
            <MetaLine label="Vigencia" value={quote.vigencia} />
          </View>
          <View style={s.metaCol}>
            <MetaLine label="Cliente" value={quote.cliente} />
            <MetaLine label="Atiende" value={quote.atiende} />
            <MetaLine label="Contacto" value={quote.contacto} />
          </View>
        </View>

        {/* Tabla */}
        <View style={s.thead} fixed>
          <Text style={[s.th, { width: W.foto, textAlign: "center" }]}>FOTO</Text>
          <Text style={[s.th, { width: W.desc, paddingHorizontal: 6 }]}>DESCRIPCIÓN</Text>
          <Text style={[s.th, { width: W.sexo }]}>SEXO</Text>
          <Text style={[s.th, { width: W.talla, textAlign: "center" }]}>TALLA MX</Text>
          <Text style={[s.th, { width: W.cant, textAlign: "center" }]}>CANT.</Text>
          <Text style={[s.th, { width: W.punit, textAlign: "right", paddingRight: 6 }]}>P. UNITARIO</Text>
          <Text style={[s.th, { width: W.importe, textAlign: "right" }]}>IMPORTE</Text>
        </View>

        {quote.items.map((item) => (
          <ItemRows key={item.id} item={item} />
        ))}

        {/* Totales */}
        <View style={s.totalsWrap}>
          <View style={s.totalsBox}>
            <View style={s.totalPares}>
              <Text style={s.totalLabel}>Total de pares</Text>
              <Text style={s.totalValue}>{pares}</Text>
            </View>
            <View style={s.totalImporte}>
              <Text style={s.totalImporteLabel}>IMPORTE TOTAL (MXN)</Text>
              <Text style={s.totalImporteValue}>{money(importe)}</Text>
            </View>
          </View>
        </View>

        {/* Notas */}
        <View style={s.notes}>
          <Text style={s.note}>Precios de mayoreo expresados en pesos mexicanos (MXN).</Text>
          <Text style={s.note}>
            Cotización vigente {quote.vigencia}, sujeta a disponibilidad de inventario y tallas.
          </Text>
          <Text style={s.note}>
            Los precios no incluyen gastos de envío. Tiempos de entrega a confirmar según volumen.
          </Text>
        </View>

        <Text style={s.footer} fixed>
          BOTAS LEÓN · www.botasleon.com
        </Text>
      </Page>
    </Document>
  )
}

function MetaLine({ label, value }: { label: string; value: string }) {
  return (
    <View style={s.metaLine}>
      <Text style={s.metaLabel}>{label}</Text>
      <Text style={s.metaValue}>{value}</Text>
    </View>
  )
}

export async function generateQuotePdf(quote: Quote): Promise<Blob> {
  return await pdf(<QuoteDoc quote={quote} />).toBlob()
}
