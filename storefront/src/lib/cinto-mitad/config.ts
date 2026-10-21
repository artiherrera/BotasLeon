import "server-only"

/**
 * LOS CÓDIGOS DEL CINTO A MITAD, Y POR QUÉ EXISTEN.
 *
 * En México cada bota trae su descuento automático de producto ("🔥 Hoy te
 * ahorras $X") y la promoción del cinto era otro descuento automático del tipo
 * "Compra X y llévate Y". Shopify no deja que la bota que ACTIVA una promoción
 * de ese tipo lleve además su propio descuento de producto, así que con bota y
 * cinto en el mismo carrito solo se aplicaba el mayor de los dos. Medido:
 * El Mesteño ($4,699, −$580) + El Jinete ($999) cobraba $5,118 y el cinto
 * salía entero.
 *
 * La salida es que el descuento del cinto deje de ser automático y pase a ser
 * un CÓDIGO que el sitio aplica solo. Un código de monto fijo sobre la línea
 * del cinto sí convive con el descuento de producto de la bota, porque la bota
 * ya no "activa" nada: solo acompaña.
 *
 * POR QUÉ ESTE ARCHIVO ES DE SERVIDOR. `server-only` hace que el build falle
 * si alguien lo importa desde un componente de cliente. Los códigos no deben
 * viajar en el JavaScript del navegador: cualquiera los leería del bundle y
 * los usaría sin comprar botas.
 *
 * MANTENIMIENTO: si cambia el precio de un cinto, cambia su código en Shopify
 * y cambia aquí. Los dos, o el sitio aplica un monto que no corresponde. El
 * monto que se cobra lo decide Shopify, no este archivo — aquí solo se
 * documenta para que se note la diferencia al revisar.
 */

export type CodigoCinto = {
  /** Handles de los cintos que ese código descuenta. */
  handles: string[]
  codigo: string
  /** Lo que descuenta en Shopify. Solo para ordenar y para el registro. */
  descuento: number
  /** Precio de lista, para el registro. */
  precio: number
}

export const CODIGOS_CINTO: CodigoCinto[] = [
  {
    handles: [
      "el-jinete-en-piel-granulada-negra",
      "el-jinete-en-piel-granulada-cafe",
      "el-jinete-en-nobuck-negro",
    ],
    codigo: "CINTOMITAD-JINETE-JRWNU",
    descuento: 499.5,
    precio: 999,
  },
  {
    handles: ["el-bravo-en-piel-labrada-cafe"],
    codigo: "CINTOMITAD-BRAVO-DMJEU",
    descuento: 649.5,
    precio: 1299,
  },
  {
    handles: ["el-caporal-en-piel-labrada-cafe"],
    codigo: "CINTOMITAD-CAPORAL-M8HM7",
    descuento: 699.5,
    precio: 1399,
  },
]

/** Todos los códigos que el sitio administra. Lo que no esté aquí es del cliente. */
export const TODOS_LOS_CODIGOS = CODIGOS_CINTO.map((c) => c.codigo)

/** El código que le toca a un cinto, o null si ese cinto no entra en la promoción. */
export function codigoDeCinto(handle: string): CodigoCinto | null {
  return CODIGOS_CINTO.find((c) => c.handles.includes(handle)) ?? null
}
