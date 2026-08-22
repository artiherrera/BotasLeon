import type { Incoterm, Nota, TipoNota } from "./types"

/**
 * Datos del vendedor que salen impresos en la nota.
 *
 * El domicilio es el MISMO que ya publica el sitio (Footer.tsx y /visitanos, de
 * donde también sale el LocalBusiness de Schema.org). Se copia aquí en vez de
 * importarse porque son cosas distintas que pueden divergir: si algún día hay
 * bodega aparte del local, cambia una y no la otra.
 *
 * Falta el RFC: no está publicado en el sitio y solo hace falta si se emite
 * factura fiscal. Una nota de venta simple no lo necesita.
 */
export const VENDEDOR = {
  nombre: "BotasLeón",
  // Con salto explícito: dejar que envuelva solo partía "León," de "Gto." y
  // abría un hueco en medio del bloque.
  domicilio: "Blvd. Hilario Medina 407, 2º piso\nCol. Josefina, 37260 León, Gto., México",
  telefono: "+52 479 303 2457",
  rfc: "",
} as const

/**
 * Fracciones arancelarias candidatas (HTSUS).
 *
 * La investigación de agosto 2026 encontró que el catálogo trae cargado
 * `6403.51.90`, que es la línea RESIDUAL "for other persons" — la más cara
 * (10% MFN) — y además de OCHO dígitos, cuando CBP exige DIEZ desde que terminó
 * la exención de minimis.
 *
 * Con el T-MEC bien reclamado el arancel es 0% en cualquiera de estas líneas,
 * pero la clasificación correcta es la red de seguridad si el reclamo falla, y
 * una declaración inexacta ante CBP es sancionable por sí sola.
 *
 * ⚠️ Los últimos dos dígitos van como XX: hay que confirmar la línea estadística
 * exacta con un agente aduanal antes de emitir a Estados Unidos.
 */
export const FRACCIONES = [
  {
    codigo: "6403.51.30.XX",
    etiqueta: "Suela de piel · construcción welt (Goodyear)",
    mfn: "5%",
    nota: "La más barata si el reclamo T-MEC falla. Común en bota vaquera fina.",
  },
  {
    codigo: "6403.51.60.XX",
    etiqueta: "Suela de piel · caballero",
    mfn: "8.5%",
  },
  {
    codigo: "6403.51.90.XX",
    etiqueta: "Suela de piel · dama y unisex (residual)",
    mfn: "10%",
    nota: "Es la que trae hoy el catálogo. La más cara: verificar si de verdad aplica.",
  },
  {
    codigo: "6403.91.60.XX",
    etiqueta: "Suela de hule o poliuretano · caballero",
    mfn: "8.5%",
    nota: "Si la suela NO es de piel, la partida cambia entera a 6403.91.",
  },
] as const

export const PAIS_ORIGEN = "MX"

/**
 * Descripción por defecto para la aduana. Concreta a propósito: "footwear",
 * "sample" o "gift" son causa principal de retención.
 */
export const DESCRIPCION_ADUANA_EN = "Men's leather cowboy boots, bovine leather, made in Mexico"
export const DESCRIPCION_ADUANA_ES = "Botas vaqueras de piel bovina fabricadas en México"

/**
 * Leyenda de certificación de origen T-MEC.
 *
 * Va EN INGLÉS aunque el resto del documento vaya en español: la lee CBP. Por
 * debajo de 2,500 USD de mercancía originaria no se exige certificado formal
 * (19 CFR 182.14(a)(2)) y esta leyenda en la factura basta — pero tiene que ir
 * firmada, con nombre y cargo de quien certifica.
 */
export const LEYENDA_TMEC =
  "I hereby certify that the goods covered by this shipment qualify as " +
  "originating goods for the purposes of preferential tariff treatment " +
  "under the USMCA/T-MEC."

/**
 * Advertencia interna (NO se imprime): la regla de origen del Capítulo 64 exige
 * cambio arancelario EXCEPTO desde la subpartida 6406.10 (cortes ya armados) más
 * 55% de contenido regional por costo neto. Si el taller compra cortes armados
 * —típicamente de China o Vietnam— la bota NO califica y certificar sería falso.
 */
export const ADVERTENCIA_ORIGEN =
  "Antes de firmar: confirma con el taller que se compra PIEL EN PLIEGO (cap. 41) " +
  "y no CORTES ARMADOS (6406.10), y que el contenido regional llega al 55%."

export const INCOTERM_DEFAULT: Incoterm = "DAP"

export const CONDICIONES_DEFAULT = [
  "Producto hecho a pedido: 25 a 35 días naturales de fabricación.",
  "Los tiempos de entrega corren a partir del anticipo confirmado.",
  "Cambios de talla sujetos a disponibilidad; no aplican en modelos a medida.",
].join("\n")

/**
 * Nota nueva. Por defecto NACIONAL: es el caso real de hoy — venta por WhatsApp
 * a un comprador en México, en pesos y en español.
 *
 * El tipo "exportacion" existe en el modelo y en la base (fracción arancelaria,
 * país de origen, declaración T-MEC) pero todavía no tiene pantalla. Cuando
 * haga falta facturar a Estados Unidos ya está el andamio puesto.
 */
export function notaVacia(tipo: TipoNota = "nacional"): Nota {
  return {
    folio: "",
    fecha: new Date().toLocaleDateString("es-MX", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }),
    tipo,
    incoterm: INCOTERM_DEFAULT,
    vendedorNombre: VENDEDOR.nombre,
    vendedorDomicilio: VENDEDOR.domicilio,
    cliente: "",
    compradorDomicilio: "",
    contacto: "",
    entrega: "",
    entregaEstimada: "",
    atiende: "",
    moneda: tipo === "exportacion" ? "USD" : "MXN",
    idioma: tipo === "exportacion" ? "en" : "es",
    certificaNombre: "",
    certificaCargo: "",
    notas: CONDICIONES_DEFAULT,
    items: [],
  }
}
