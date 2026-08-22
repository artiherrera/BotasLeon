/**
 * Previsualiza el PDF de la nota de venta sin levantar el sitio:
 *
 *   npx tsx scripts/preview-nota.tsx /tmp/nota.pdf
 *   pdftoppm -png -r 110 /tmp/nota.pdf /tmp/nota   # para verlo como imagen
 *
 * El `import React` de abajo NO hace falta en el resto del proyecto (Next usa
 * el runtime automático de JSX), pero tsx compila este archivo suelto con el
 * runtime clásico y sin él revienta con "React is not defined".
 */
import React from "react"
import { renderToFile } from "@react-pdf/renderer"
import { NotaDoc } from "./src/lib/nota/pdf"
import { notaVacia } from "./src/lib/nota/config"

const nota = notaVacia("nacional")
nota.folio = "NV-2026-0002"
nota.cliente = "Ferretería y Botas del Bajío"
nota.compradorDomicilio = "Av. Juárez 1200, Centro, 37000 León, Gto."
nota.contacto = "477 123 4567"
nota.atiende = "Arturo Herrera"
nota.items = [
  { id: "a", productHandle: "bota-estephania", title: "Bota Estephania", descripcion: "Piel de res, horma redonda, suela de cuero", sexo: "Mujer", imageUrl: null,
    lines: [ { id: "l1", talla: "24", cantidad: 2, precioUnitario: 4499 }, { id: "l2", talla: "25", cantidad: 1, precioUnitario: 4499 } ] },
  { id: "b", productHandle: "bota-110", title: "Bota 110 Crazy Café", descripcion: "8 Segundos", sexo: "Hombre", imageUrl: null,
    lines: [ { id: "l3", talla: "27", cantidad: 1, precioUnitario: 2599 } ] },
]
const pagos = [
  { id: "p1", monto: 5000, forma: "transferencia" as const, referencia: "SPEI 8821", pagadoEn: "2026-08-20T10:00:00Z" },
  { id: "p2", monto: 3000, forma: "efectivo" as const, referencia: "", pagadoEn: "2026-08-21T16:30:00Z" },
]
void (async () => {
  await renderToFile(<NotaDoc nota={nota} pagos={pagos} />, process.argv[2])
  console.log("PDF escrito")
})()
