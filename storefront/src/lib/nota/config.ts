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
 * Fracciones arancelarias (HTSUS) para bota vaquera de corte de piel.
 *
 * QUÉ DECIDE CUÁL VA
 * ──────────────────
 * La partida 6403 es "calzado con corte de PIEL". Dentro de ella mandan dos
 * cosas, en este orden:
 *
 *   1. LA SUELA.   De piel  -> 6403.51    De hule o poliuretano -> 6403.91
 *   2. PARA QUIÉN. Caballero -> .60       Dama y unisex -> .90
 *
 * Y por encima de ambas: si la construcción es WELT (Goodyear), es .30, que
 * además es la de arancel más bajo.
 *
 * El catálogo de Shopify trae el género de los 99 productos (59 masculino, 40
 * femenino) pero NO trae la suela: `footwear-material` describe el corte. Por
 * eso la suela se pregunta por nota y el valor por defecto es piel, que es lo
 * habitual en bota vaquera fina.
 *
 * IMPORTANTE SOBRE EL ARANCEL: con el T-MEC bien reclamado, TODAS estas líneas
 * pagan 0%. El porcentaje de abajo es lo que se pagaría si el reclamo falla —
 * o sea, la red de seguridad, no el costo esperado. Por eso no conviene elegir
 * "la más barata" sino la que de verdad describe el producto: una declaración
 * inexacta ante CBP es sancionable por sí sola, cobre o no cobre arancel.
 *
 * ⚠️ LOS DOS ÚLTIMOS DÍGITOS VAN COMO XX. CBP exige diez desde que terminó la
 * exención de minimis, y el sufijo estadístico hay que confirmarlo con un
 * agente aduanal. No los invento aquí: un número inventado en una declaración
 * es peor que un hueco evidente.
 */
export type Suela = "piel" | "hule"

export type Fraccion = {
  codigo: string
  etiqueta: string
  mfnSiFallaTmec: string
}

export const FRACCIONES: Record<string, Fraccion> = {
  "51.30": { codigo: "6403.51.30.XX", etiqueta: "Suela de piel · construcción welt (Goodyear)", mfnSiFallaTmec: "5%" },
  "51.60": { codigo: "6403.51.60.XX", etiqueta: "Suela de piel · caballero", mfnSiFallaTmec: "8.5%" },
  "51.90": { codigo: "6403.51.90.XX", etiqueta: "Suela de piel · dama y unisex", mfnSiFallaTmec: "10%" },
  "91.30": { codigo: "6403.91.30.XX", etiqueta: "Suela de hule o PU · construcción welt", mfnSiFallaTmec: "5%" },
  "91.60": { codigo: "6403.91.60.XX", etiqueta: "Suela de hule o PU · caballero", mfnSiFallaTmec: "8.5%" },
  "91.90": { codigo: "6403.91.90.XX", etiqueta: "Suela de hule o PU · dama y unisex", mfnSiFallaTmec: "10%" },
}

/**
 * Sugerencia por producto. `welt` gana sobre el género porque la construcción
 * define una línea propia en el arancel.
 */
export function sugerirFraccion(
  sexo: string,
  suela: Suela = "piel",
  welt = false
): Fraccion {
  const familia = suela === "hule" ? "91" : "51"
  if (welt) return FRACCIONES[`${familia}.30`]
  const esCaballero = sexo === "Hombre" || sexo === "masculino"
  return FRACCIONES[`${familia}.${esCaballero ? "60" : "90"}`]
}

/**
 * Pieles CITES presentes en el catálogo.
 *
 * Son los handles del metacampo `footwear-material` de Shopify: hay 11
 * productos de pitón y 7 de caimán. Exportar cualquiera de ellos a Estados
 * Unidos NO es cuestión de arancel — exige permiso del USFWS, formato 3-177,
 * despacho por un puerto designado, y el trámite corre entre 8 y 12 semanas.
 *
 * La nota de venta bloquea la exportación de estos materiales a propósito: es
 * mucho más barato descubrirlo al capturar que cuando el paquete está retenido
 * en la aduana.
 */
export const MATERIALES_CITES = ["piton", "pitón", "caiman", "caimán", "cocodrilo"] as const

export function esCites(material: string): boolean {
  const m = (material || "").toLowerCase()
  return MATERIALES_CITES.some((c) => m.includes(c))
}

/** Materiales CITES detectados en una nota. Vacío = se puede exportar. */
export function citesEnNota(items: Array<{ title: string; descripcion: string }>): string[] {
  return items
    .filter((it) => esCites(`${it.title} ${it.descripcion}`))
    .map((it) => it.title)
}

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
