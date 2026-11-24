import { ContentPage } from "@/components/ContentPage"
import { LocalizedLink as Link } from "@/components/LocalizedLink"
import { Localized } from "@/components/Localized"
import { pageMetadata } from "@/lib/seo"
import {
  DIAS_AVISO_CAMBIO,
  DIAS_REEMBOLSO_BANCO,
  DIAS_REEMBOLSO_SHOPIFY,
  DIAS_RETRACTO,
  HAY_REEMBOLSO,
} from "@/lib/exchange"

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
            <p>Se aceptan cambios en caso de:</p>
            <ul>
              <li>Defecto de fabricación.</li>
              <li>Error en el producto enviado.</li>
              <li>
                <strong>Que la talla no te quede</strong>, en{" "}
                <strong>todos nuestros modelos</strong>. Desde el 24 de
                noviembre de 2026 ya no hay que revisar bota por bota: el
                cambio de talla aplica en el catálogo entero.
              </li>
            </ul>
            {HAY_REEMBOLSO ? (
              <>
                <h2>6 bis. Devolución del dinero: tus 5 días hábiles</h2>
                <p>
                  <strong>
                    Tienes {DIAS_RETRACTO} días hábiles desde que recibes el
                    paquete para cancelar la compra y recuperar tu dinero.
                  </strong>{" "}
                  No tienes que darnos un motivo: si no te convenció, basta con
                  que nos avises dentro de ese plazo.
                </p>
                <p>
                  No es una cortesía nuestra, es tu derecho. Lo da el artículo
                  56 de la Ley Federal de Protección al Consumidor, y lo
                  respetamos aunque hayas comprado en oferta.
                </p>
                <ul>
                  <li>La bota tiene que volver sin estrenar y en su empaque.</li>
                  <li>
                    El envío de regreso corre por tu cuenta, que es lo que marca
                    la misma ley.
                  </li>
                  <li>
                    Te reembolsamos el precio que pagaste al método de pago
                    original.
                  </li>
                </ul>
                {/* EL PLAZO DEL DINERO, que hasta el 2026-11-24 el sitio no
                    decía en ninguna parte. Lo preguntó el dueño —"el reembolso
                    es según Shopify, ¿cuánto tarda?"— y la respuesta no es un
                    número nuestro: el cobro lo hace Shopify Payments y el
                    último tramo lo decide el banco emisor. Se publica porque
                    callarlo es garantizar el "¿dónde está mi dinero?" del día
                    diez, con todo hecho bien. Las cifras salen de
                    lib/exchange.ts. */}
                <p>
                  <strong>¿Cuánto tarda en llegarte?</strong> El reembolso sale
                  al mismo método con el que pagaste, en cuanto la bota vuelve
                  a León. De ahí lo mueve Shopify —hasta{" "}
                  {DIAS_REEMBOLSO_SHOPIFY} días hábiles— y lo abona tu banco,
                  que puede tardar hasta {DIAS_REEMBOLSO_BANCO} días hábiles
                  más en reflejarlo; si pagaste con tarjeta de crédito, puede
                  aparecer hasta tu siguiente corte. Ese último tramo no lo
                  controlamos nosotros, pero si se pasa de ese plazo
                  escríbenos: podemos darte el número de rastreo del reembolso
                  para que tu banco lo busque.
                </p>
                <p>
                  Pasados esos {DIAS_RETRACTO} días hábiles sigue habiendo{" "}
                  <strong>cambio de talla</strong> durante{" "}
                  {DIAS_AVISO_CAMBIO} días naturales — lo que no hay es
                  devolución de dinero por haber elegido mal el color o el
                  modelo.
                </p>
              </>
            ) : (
              <>
                <h2>6 bis. Devoluciones de dinero</h2>
                <p>
                  Los pedidos con envío a Estados Unidos{" "}
                  <strong>no admiten devolución de dinero</strong>: el paquete
                  tendría que cruzar la aduana dos veces y el envío
                  internacional de regreso cuesta más de lo que vale el pedido.
                  Lo que sí admiten es <strong>cambio de talla</strong>, con las
                  condiciones de abajo.
                </p>
              </>
            )}

            <h2>7. Condiciones de cambio</h2>
            <ul>
              <li>1 cambio por pedido.</li>
              <li>
                <strong>
                  Avísanos dentro de {DIAS_AVISO_CAMBIO} días naturales
                </strong>{" "}
                contados desde que la paquetería marca el paquete como
                entregado. Lo que vence en ese plazo es el <em>aviso</em>, no el
                cambio: una vez que nos escribiste, lo que tarde el paquete en
                volver a León no corre en tu contra.
              </li>
              <li>Producto sin estrenar y sin uso exterior.</li>
              <li>En su empaque original, con todo lo que venía dentro.</li>
              <li>
                El envío de regreso corre por cuenta del cliente. Nosotros
                pagamos el envío de la talla nueva.
                {!HAY_REEMBOLSO && (
                  <>
                    {" "}
                    <strong>
                      Desde Estados Unidos ese regreso es un envío internacional
                      y cuesta más de 100 dólares,
                    </strong>{" "}
                    así que conviene escribirnos por WhatsApp antes de comprar
                    y asegurar la talla a la primera.
                  </>
                )}
              </li>
              <li>
                Sujeto a que haya existencia de la talla que pides. Si no la
                hay, te ofrecemos otro modelo o un saldo a favor para una
                compra futura.
              </li>
            </ul>

            <h2>8. Restricciones</h2>
            <p>
              <strong>
                El cambio de talla aplica en todos nuestros modelos.
              </strong>{" "}
              Ya no hay que revisar bota por bota: si está en el catálogo,
              admite cambio. Las únicas excepciones son:
            </p>
            <ul>
              <li>Productos personalizados o hechos a la medida.</li>
              <li>
                Los modelos que lo indiquen expresamente en su página, si
                alguna vez tuviéramos que excluir alguno.
              </li>
            </ul>
            <p>
              <strong>
                Las botas en oferta, liquidación, Hot Sale, Buen Fin y Black
                Friday también admiten cambio de talla.
              </strong>{" "}
              La rebaja no quita el derecho al cambio
              {HAY_REEMBOLSO ? ", ni el de devolver dentro de tus " : ""}
              {HAY_REEMBOLSO ? `${DIAS_RETRACTO} días hábiles` : ""}.
            </p>

            <h2>9. Proceso</h2>
            <p>
              Envía tu solicitud por correo a <strong>contacto@botasleon.com</strong>{" "}
              o por WhatsApp al <strong>479 303 2457</strong>. Para un cambio de
              talla basta con tu número de pedido y la talla que necesitas; para
              un defecto o un error en el envío, la evidencia es obligatoria:
            </p>
            <ul>
              <li>Fotos</li>
              <li>Video (si aplica)</li>
              <li>Número de pedido</li>
            </ul>
            <p>
              No mandes el paquete de regreso sin avisar antes: sin solicitud
              previa no podemos recibirlo.
            </p>

            <h2>10. Garantías</h2>
            <ul>
              <li>15 días naturales.</li>
              <li>Solo defectos de fabricación confirmados.</li>
              <li>La empresa cubre los envíos en garantía validada.</li>
            </ul>

            <h2>11. Devoluciones de dinero</h2>
            {HAY_REEMBOLSO ? (
              <p>
                Dentro de tus {DIAS_RETRACTO} días hábiles (punto 6 bis), sin
                necesidad de motivo. Fuera de ese plazo, en los casos de
                defecto de fabricación o error en el envío. El reembolso se
                regresa al método de pago original o a la cuenta que nos
                indiques.
              </p>
            ) : (
              <p>
                En los casos de defecto de fabricación confirmado o error en el
                envío. El reembolso se regresa al método de pago original o a la
                cuenta indicada.
              </p>
            )}

            {/* FUERA DEL TERNARIO: el plazo vale para los dos mercados. En
                Estados Unidos no hay reembolso por talla, pero sí por defecto
                de fabricación o error de envío, y ese dinero tarda lo mismo. */}
            <p>
              Siempre al método de pago original, y con los tiempos de la
              pasarela: hasta {DIAS_REEMBOLSO_SHOPIFY} días hábiles en salir y
              hasta {DIAS_REEMBOLSO_BANCO} días hábiles más en que tu banco lo
              abone.
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
            <h2>Size exchanges, on every model</h2>
            <p>
              <strong>
                If your boots don&apos;t fit, you can exchange them for another
                size — on any model in our catalog.
              </strong>{" "}
              No checking pair by pair: if we sell it, it can be exchanged. The
              only exceptions are custom or made-to-measure orders.
            </p>
            <ul>
              <li>
                <strong>
                  Tell us within {DIAS_AVISO_CAMBIO} calendar days
                </strong>{" "}
                of the carrier marking your parcel as delivered. What expires in
                that window is the <em>notice</em>, not the exchange — once
                you&apos;ve written to us, however long the parcel takes to get
                back to León doesn&apos;t count against you.
              </li>
              <li>One exchange per order, unworn and in its original box.</li>
              <li>
                You cover return shipping and we cover shipping the new size.
                {!HAY_REEMBOLSO && (
                  <>
                    {" "}
                    <strong>
                      From the United States that return is an international
                      shipment and costs over $100,
                    </strong>{" "}
                    so it&apos;s worth messaging us on WhatsApp before you order
                    and getting the size right the first time.
                  </>
                )}
              </li>
              <li>
                Subject to the size being in stock. If it isn&apos;t, we&apos;ll
                offer another model or store credit.
              </li>
            </ul>
            <p>
              Boots bought on sale, clearance, Hot Sale or Black Friday can be
              exchanged too. A discount doesn&apos;t cost you the right to an
              exchange.
            </p>

            {HAY_REEMBOLSO ? (
              <>
                <h2>Your {DIAS_RETRACTO} business days to change your mind</h2>
                <p>
                  <strong>
                    You have {DIAS_RETRACTO} business days from delivery to
                    cancel the purchase and get your money back
                  </strong>
                  , with no reason needed. This isn&apos;t a courtesy — it is
                  your right under article 56 of Mexico&apos;s consumer
                  protection law, and it applies even if you bought on sale. The
                  boots must come back unworn and in their box, and return
                  shipping is on you, which is what that same law provides.
                </p>
                <p>
                  The money goes back to whatever you paid with. Shopify sends
                  it within {DIAS_REEMBOLSO_SHOPIFY} business days, then your
                  bank posts it — up to {DIAS_REEMBOLSO_BANCO} business days
                  more, and on a credit card it can land on your next
                  statement.
                </p>
              </>
            ) : (
              <>
                <h2>Refunds on U.S. orders</h2>
                <p>
                  Orders shipped to the United States{" "}
                  <strong>are not eligible for a money refund</strong>: the
                  parcel would have to clear customs twice and the international
                  return costs more than the order is worth. Size exchanges, as
                  above, are available.
                </p>
              </>
            )}

            <h2>Get your size right the first time</h2>
            <p>
              Review our <Link href="/guia-tallas">size guide</Link> before
              ordering — our sizes run in Mexican (cm), U.S. and EU scales. If
              you have any doubt about sizing or a specific pair, message us
              first at <strong>contacto@botasleon.com</strong>{" "}
              and we&apos;ll help you choose the right fit. It&apos;s free, and it beats paying
              for a return.
            </p>

            <h2>A problem with your order?</h2>
            <p>
              If something arrives incorrect or damaged, email us at{" "}
              <strong>contacto@botasleon.com</strong>{" "}
              within 7 days of delivery with photos, and we&apos;ll do our best to make it right. Confirmed
              manufacturing defects are covered for 15 days, and on a validated
              warranty claim we pay the shipping both ways.
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
    HAY_REEMBOLSO
      ? `Cambio de talla en todos los modelos, avisando dentro de ${DIAS_AVISO_CAMBIO} días naturales, y ${DIAS_RETRACTO} días hábiles para devolver y recuperar tu dinero.`
      : `Cambio de talla en todos los modelos, avisando dentro de ${DIAS_AVISO_CAMBIO} días naturales tras la entrega. Política de envíos, cambios y garantías de Botas León.`,
  })
}
