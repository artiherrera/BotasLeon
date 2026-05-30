import { ContentPage } from "@/components/ContentPage"

export default function DevolucionesPage() {
  return (
    <ContentPage
      eyebrow="Información"
      title="Cambios y devoluciones"
      intro="Nuestra política de cambio de talla y devolución, paso a paso."
    >
      <h2>Cambio de talla</h2>
      <p>
        Tienes <strong>30 días naturales</strong> desde que recibes tu pedido
        para solicitar cambio de talla, sin costo adicional dentro de México.
        Para envíos internacionales aplica una tarifa logística reducida.
      </p>

      <h3>Requisitos</h3>
      <ul>
        <li>La bota debe estar sin uso, sin marcas en la suela ni en la piel</li>
        <li>En su caja original, con etiquetas y accesorios</li>
        <li>Acompañada del comprobante de compra</li>
      </ul>

      <h2>Devolución por defecto de fabricación</h2>
      <p>
        Si tu bota tiene un defecto de fabricación, escríbenos en los primeros
        7 días con fotos del problema. La reemplazamos sin costo o te
        reembolsamos íntegramente. Cubrimos el envío de regreso.
      </p>

      <h2>Devolución por arrepentimiento</h2>
      <p>
        Si simplemente cambiaste de opinión, tienes 14 días para devolver el
        producto en las mismas condiciones de cambio de talla. El reembolso se
        procesa al mismo método de pago en 5-10 días hábiles. El costo del
        envío de regreso lo asume el cliente.
      </p>

      <h2>Cómo iniciar un cambio o devolución</h2>
      <ol>
        <li>
          Escribe a <strong>hola@botasleon.com</strong> con tu número de pedido
          y motivo
        </li>
        <li>
          Te respondemos en menos de 24 horas hábiles con la guía de envío
          prepagada (para cambios dentro de México)
        </li>
        <li>Empacas la bota como te llegó y la entregas en cualquier sucursal de la paquetería</li>
        <li>
          Al recibirla, validamos el estado y procesamos el cambio o reembolso
          en 3 días hábiles
        </li>
      </ol>

      <h2>Productos NO aceptados para devolución</h2>
      <ul>
        <li>Botas hechas a la medida o personalizadas</li>
        <li>Productos en outlet o liquidación final (se indica en la página del producto)</li>
        <li>Botas con signos de uso, marcas o modificaciones del cliente</li>
      </ul>
    </ContentPage>
  )
}

export const metadata = {
  title: "Devoluciones — BotasLeón",
}
