import { ContentPage } from "@/components/ContentPage"
import { Localized } from "@/components/Localized"
import { pageMetadata } from "@/lib/seo"

export default function DevolucionesPage() {
  return (
    <ContentPage
      eyebrow="page.devoluciones.eyebrow"
      title="page.devoluciones.title"
      intro="page.devoluciones.intro"
    >
      <Localized
        es={
          <>
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
                Escribe a <strong>contacto@botasleon.com</strong> con tu número de pedido
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
          </>
        }
        en={
          <>
            <h2>Size exchange</h2>
            <p>
              You have <strong>30 calendar days</strong> from the day you receive
              your order to request a size exchange. For international shipments,
              including the United States, a reduced logistics fee applies.
            </p>

            <h3>Requirements</h3>
            <ul>
              <li>The boots must be unworn, with no marks on the sole or the leather</li>
              <li>In their original box, with all tags and accessories</li>
              <li>Accompanied by proof of purchase</li>
            </ul>

            <h2>Returns for manufacturing defects</h2>
            <p>
              If your boots have a manufacturing defect, contact us within the first
              7 days with photos of the issue. We&apos;ll replace them at no cost or
              issue a full refund, and we cover return shipping.
            </p>

            <h2>Change-of-mind returns</h2>
            <p>
              If you simply change your mind, you have 14 days to return the product
              in the same condition required for a size exchange. Your refund is
              issued to the original payment method within 5-10 business days. Return
              shipping is the customer&apos;s responsibility.
            </p>

            <h2>How to start an exchange or return</h2>
            <ol>
              <li>
                Email <strong>contacto@botasleon.com</strong> with your order number
                and the reason
              </li>
              <li>
                We reply within 24 business hours with your return instructions;
                prepaid shipping labels apply to exchanges within Mexico
              </li>
              <li>Pack the boots exactly as they arrived and drop them off at the carrier location shown in your instructions</li>
              <li>
                Once we receive them, we inspect their condition and process your
                exchange or refund within 3 business days
              </li>
            </ol>

            <h2>Products NOT eligible for return</h2>
            <ul>
              <li>Made-to-measure or personalized boots</li>
              <li>Outlet or final-sale items (marked on the product page)</li>
              <li>Boots showing signs of wear, marks, or customer modifications</li>
            </ul>
          </>
        }
      />
    </ContentPage>
  )
}

export const metadata = pageMetadata({
  path: "/devoluciones",
  title: "Devoluciones y cambios",
  description:
    "Cambio de talla sin costo durante 30 días. Política completa de devoluciones.",
})
