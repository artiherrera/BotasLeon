import { ContentPage } from "@/components/ContentPage"
import { LocalizedLink as Link } from "@/components/LocalizedLink"
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
            <p>
              En <strong>Botas León</strong> estamos comprometidos con vender y
              distribuir productos hechos en México, de forma artesanal y con los
              más altos estándares de calidad.
            </p>

            <h2>1. Naturaleza artesanal del producto</h2>
            <p>
              Todas las pieles utilizadas provienen de criaderos autorizados y
              cuentan con procesos de curtido de alta calidad. Al tratarse de
              materiales naturales:
            </p>
            <ul>
              <li>Pueden existir marcas o variaciones propias del origen del material.</li>
              <li>Cada pieza es única e irrepetible.</li>
              <li>
                El proceso artesanal implica intervención manual, por lo que pueden
                existir ligeras variaciones que <strong>no se consideran defectos</strong>.
              </li>
            </ul>

            <h2>2. Envíos y procesamiento</h2>
            <ul>
              <li><strong>Procesamiento:</strong> hasta 48 horas hábiles tras la confirmación de pago.</li>
              <li><strong>Productos en stock:</strong> envío inmediato.</li>
              <li><strong>Productos bajo pedido:</strong> fabricación de 25 a 35 días hábiles.</li>
            </ul>
            <p>Se pueden enviar pedidos desde distintas ubicaciones sin costo adicional.</p>

            <h2>3. Paquetería y entrega</h2>
            <p>
              Trabajamos con paqueterías externas (FedEx, DHL, UPS, Estafeta u
              otras según la zona). Una vez entregado el paquete al transportista:
            </p>
            <ul>
              <li>La responsabilidad del traslado recae en la empresa logística.</li>
              <li>Pueden existir hasta 2 intentos de entrega.</li>
              <li>Si el cliente no recibe el paquete, este puede ser devuelto.</li>
            </ul>

            <h2>4. Incidencias con paquetería</h2>
            <p>Botas León no es responsable directo por:</p>
            <ul>
              <li>Retrasos</li>
              <li>Pérdidas</li>
              <li>Daños</li>
              <li>Errores de entrega</li>
            </ul>
            <p>
              Sin embargo, damos acompañamiento al cliente en el proceso de
              aclaración. Toda resolución depende de la paquetería o la aseguradora.
            </p>

            <h2>5. Responsabilidad del cliente</h2>
            <p>
              El cliente es responsable de proporcionar datos correctos de envío.
              Errores en la dirección o los datos pueden generar costos adicionales.
            </p>

            <h2>6. Cambios y devoluciones</h2>
            <p>Se aceptan únicamente en caso de:</p>
            <ul>
              <li>Defecto de fabricación.</li>
              <li>Error en el producto enviado.</li>
            </ul>
            <p><strong>No se realizan reembolsos por:</strong></p>
            <ul>
              <li>Talla incorrecta elegida por el cliente.</li>
              <li>Color o modelo seleccionado por el cliente.</li>
              <li>Preferencias personales.</li>
            </ul>

            <h2>7. Condiciones de cambio</h2>
            <ul>
              <li>1 cambio por pedido.</li>
              <li>Dentro de 7 días naturales.</li>
              <li>Producto sin uso exterior.</li>
              <li>En su empaque original.</li>
            </ul>

            <h2>8. Restricciones</h2>
            <p>No hay cambios ni devoluciones en:</p>
            <ul>
              <li>Liquidación</li>
              <li>Promociones</li>
              <li>Hot Sale / Buen Fin</li>
              <li>Productos personalizados</li>
            </ul>

            <h2>9. Proceso</h2>
            <p>
              Envía tu solicitud por correo a <strong>contacto@botasleon.com</strong>{" "}
              o por WhatsApp al <strong>479 303 2457</strong>, con evidencia
              obligatoria:
            </p>
            <ul>
              <li>Fotos</li>
              <li>Video (si aplica)</li>
              <li>Número de pedido</li>
            </ul>

            <h2>10. Garantías</h2>
            <ul>
              <li>15 días naturales.</li>
              <li>Solo defectos de fabricación confirmados.</li>
              <li>La empresa cubre los envíos en garantía validada.</li>
            </ul>

            <h2>11. Devoluciones de dinero</h2>
            <p>
              Solo en casos autorizados. El reembolso se regresa al método de pago
              original o a la cuenta indicada.
            </p>

            <h2>12. Aceptación</h2>
            <p>Toda compra implica la aceptación total de esta política.</p>

            <h2>Contacto</h2>
            <p>
              WhatsApp: <strong>479 303 2457</strong> · Correo:{" "}
              <strong>contacto@botasleon.com</strong>
            </p>
          </>
        }
        en={
          <>
            <h2>All U.S. orders are final sale</h2>
            <p>
              Orders shipped to the United States are <strong>final sale</strong>.
              We do not offer returns or exchanges on U.S. orders, so please make
              sure of your size before you order.
            </p>

            <h2>Get your size right the first time</h2>
            <p>
              Because U.S. orders can&apos;t be exchanged, review our{" "}
              <Link href="/guia-tallas">size guide</Link> before ordering. Our sizes run
              in Mexican (cm), U.S., and EU scales. If you have any doubt about
              sizing or a specific pair, message us first at{" "}
              <strong>contacto@botasleon.com</strong> and we&apos;ll help you choose
              the right fit.
            </p>

            <h2>A problem with your order?</h2>
            <p>
              If something arrives incorrect or damaged, email us at{" "}
              <strong>contacto@botasleon.com</strong> within 7 days of delivery with
              photos, and we&apos;ll do our best to make it right.
            </p>
          </>
        }
      />
    </ContentPage>
  )
}

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  return pageMetadata({
    locale: lang,
  path: "/devoluciones",
  title: "Cambios, devoluciones y garantías",
  description:
    "Política de envíos, cambios, devoluciones y garantías de Botas León. Cambios solo por defecto de fabricación o error en el envío.",
  })
}
