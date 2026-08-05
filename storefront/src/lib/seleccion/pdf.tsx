import {
  Document,
  Page,
  View,
  Text,
  Image,
  StyleSheet,
  pdf,
} from "@react-pdf/renderer"
import { formatMoney, saleInfo } from "@/lib/utils"
import { msiMonthly, MSI_DISPLAY_MONTHS } from "@/lib/msi"

/**
 * PDF de marca de una SELECCIÓN de productos — el resultado de una búsqueda o
 * de filtros en el listado, con foto + nombre + marca + precio de cada bota.
 *
 * Se genera en el navegador (dynamic import al momento de descargar; no pesa en
 * el resto del sitio) y devuelve un Blob. Reutiliza las MISMAS funciones de
 * precio del sitio (formatMoney/saleInfo/msiMonthly) para que el precio del PDF
 * sea idéntico al que ve el usuario en las cards.
 */

export type SeleccionItem = {
  title: string
  brand: string
  imageUrl: string | null
  amount: string // precio ya resuelto por idioma (MXN en es, USD en en)
  currency: string
  compareAt: string | null
}

export type SeleccionMeta = {
  contexto: string // "Hombre · Exóticas · Marca: Cabrera"
  fecha: string
  locale: "es" | "en"
}

const C = {
  leather: "#3B2A20",
  brown: "#8B5A2B",
  text: "#1F1814",
  muted: "#5A4F44",
  subtle: "#8A7E6E",
  terracotta: "#8B3A24",
  cream: "#F4E9D8",
  border: "#D8D0C2",
  white: "#FFFFFF",
}

const STR = {
  es: { subtitle: "SELECCIÓN DE PRODUCTOS", products: "productos", product: "producto", from: "Desde", perMonth: "al mes", msi: "MSI" },
  en: { subtitle: "PRODUCT SELECTION", products: "products", product: "product", from: "From", perMonth: "/mo", msi: "MSI" },
}

const s = StyleSheet.create({
  page: {
    paddingTop: 30,
    paddingBottom: 46,
    paddingHorizontal: 28,
    fontSize: 9,
    color: C.text,
    fontFamily: "Helvetica",
  },
  headerRule: { borderTopWidth: 2, borderTopColor: C.leather, marginHorizontal: 120 },
  brand: {
    fontFamily: "Times-Roman",
    fontSize: 22,
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
  },
  contextRow: {
    marginTop: 12,
    marginBottom: 14,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  contextText: { fontSize: 10, color: C.text, fontFamily: "Helvetica-Bold", flex: 1, paddingRight: 8 },
  contextMeta: { fontSize: 8, color: C.subtle, textAlign: "right" },
  // Grid
  grid: { flexDirection: "row", flexWrap: "wrap" },
  card: { width: "33.33%", padding: 6 },
  cardInner: { borderWidth: 1, borderColor: C.border, borderRadius: 3, overflow: "hidden" },
  imgBox: {
    height: 150,
    backgroundColor: C.cream,
    alignItems: "center",
    justifyContent: "center",
  },
  img: { width: "100%", height: 150, objectFit: "contain" },
  imgPlaceholder: { width: "100%", height: 150, backgroundColor: C.cream },
  cardBody: { paddingHorizontal: 8, paddingTop: 6, paddingBottom: 8 },
  title: { fontSize: 8.5, fontFamily: "Helvetica-Bold", color: C.text, lineHeight: 1.25 },
  cardBrand: { fontSize: 7.5, color: C.muted, marginTop: 2 },
  priceRow: { marginTop: 5, flexDirection: "row", alignItems: "baseline" },
  price: { fontSize: 11, fontFamily: "Helvetica-Bold", color: C.text },
  priceSale: { fontSize: 11, fontFamily: "Helvetica-Bold", color: C.terracotta },
  compareAt: { fontSize: 8, color: C.subtle, textDecoration: "line-through", marginLeft: 5 },
  msi: { fontSize: 7, color: C.brown, marginTop: 2 },
  footer: {
    position: "absolute",
    bottom: 22,
    left: 28,
    right: 28,
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: C.border,
    paddingTop: 6,
  },
  footerText: { fontSize: 7.5, letterSpacing: 1, color: C.subtle },
})

function Card({ item, L }: { item: SeleccionItem; L: (typeof STR)["es"] }) {
  const sale = saleInfo(item.amount, item.compareAt)
  const monthly = msiMonthly(item.amount, item.currency)
  const src = item.imageUrl
    ? `${item.imageUrl}${item.imageUrl.includes("?") ? "&" : "?"}width=360`
    : null
  return (
    <View style={s.card} wrap={false}>
      <View style={s.cardInner}>
        <View style={s.imgBox}>
          {src ? (
            // eslint-disable-next-line jsx-a11y/alt-text -- react-pdf Image no es HTML img
            <Image style={s.img} src={src} />
          ) : (
            <View style={s.imgPlaceholder} />
          )}
        </View>
        <View style={s.cardBody}>
          <Text style={s.title}>{item.title}</Text>
          {item.brand ? <Text style={s.cardBrand}>{item.brand}</Text> : null}
          <View style={s.priceRow}>
            <Text style={sale.onSale ? s.priceSale : s.price}>
              {formatMoney(item.amount, item.currency)}
            </Text>
            {sale.onSale && item.compareAt ? (
              <Text style={s.compareAt}>{formatMoney(item.compareAt, item.currency)}</Text>
            ) : null}
          </View>
          {monthly ? (
            <Text style={s.msi}>
              {`${L.from} ${formatMoney(monthly, item.currency)} ${L.perMonth} · ${MSI_DISPLAY_MONTHS} ${L.msi}`}
            </Text>
          ) : null}
        </View>
      </View>
    </View>
  )
}

function SeleccionDoc({ items, meta }: { items: SeleccionItem[]; meta: SeleccionMeta }) {
  const L = STR[meta.locale] ?? STR.es
  const totalWord = items.length === 1 ? L.product : L.products
  return (
    <Document title={`BotasLeón · ${meta.contexto}`}>
      <Page size="A4" style={s.page}>
        {/* Marca */}
        <View style={s.headerRule} />
        <Text style={s.brand}>BOTAS LEÓN</Text>
        <Text style={s.brandSub}>{L.subtitle}</Text>
        <View style={s.headerRule} />

        {/* Contexto (búsqueda/filtros) + fecha + total */}
        <View style={s.contextRow}>
          <Text style={s.contextText}>{meta.contexto}</Text>
          <Text style={s.contextMeta}>
            {`${items.length} ${totalWord}`}
            {"\n"}
            {meta.fecha}
          </Text>
        </View>

        {/* Grid */}
        <View style={s.grid}>
          {items.map((it, i) => (
            <Card key={i} item={it} L={L} />
          ))}
        </View>

        {/* Footer */}
        <View style={s.footer} fixed>
          <Text style={s.footerText}>BOTAS LEÓN · www.botasleon.com</Text>
          <Text
            style={s.footerText}
            render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`}
          />
        </View>
      </Page>
    </Document>
  )
}

export async function generateSeleccionPdf(
  items: SeleccionItem[],
  meta: SeleccionMeta
): Promise<Blob> {
  return await pdf(<SeleccionDoc items={items} meta={meta} />).toBlob()
}
