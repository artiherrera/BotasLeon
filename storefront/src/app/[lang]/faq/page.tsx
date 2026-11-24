import { ContentPage } from "@/components/ContentPage"
import { LocalizedLink as Link } from "@/components/LocalizedLink"
import { Localized } from "@/components/Localized"
import { pageMetadata } from "@/lib/seo"
import { DIAS_AVISO_CAMBIO, DIAS_RETRACTO, HAY_REEMBOLSO } from "@/lib/exchange"
import { isMX } from "@/lib/market"
import { PLAZO_ENTREGA } from "@/lib/entrega"

export default function FaqPage() {
  return (
    <ContentPage
      eyebrow="page.faq.eyebrow"
      title="page.faq.title"
      intro="page.faq.intro"
    >
      <Localized
        es={
          <>
            <h2>¿Las botas son hechas en México?</h2>
            <p>
              Sí. Todas las botas que comercializamos son fabricadas en León,
              Guanajuato — la capital mundial del cuero. Trabajamos directamente
              con talleres locales, muchos con tres generaciones de experiencia.
              No vendemos imitaciones ni botas importadas de Asia.
            </p>

            <h2>¿Qué tipo de piel utilizan?</h2>
            <p>
              Cada bota lleva piel genuina como base — usualmente vacuno. Para
              colecciones exóticas (cocodrilo, avestruz, pitón, mantarraya)
              trabajamos solo con proveedores certificados que cumplen
              regulaciones CITES de comercio responsable. La descripción de cada
              producto especifica el material exacto.
            </p>

            {/* POR MERCADO. Esta respuesta decía "Envíos a Estados Unidos"
                también en botasleon.mx, que vende dentro de México: la página
                no se enteraba del despliegue en el que estaba. La cifra sale
                de lib/entrega.ts, igual que en el carrito y en la ficha. */}
            <h2>¿Cuánto tarda mi pedido?</h2>
            {isMX ? (
              <p>
                Envío gratis a toda la República: una vez despachado, tu pedido
                llega normalmente en <strong>{PLAZO_ENTREGA.es}</strong> según el
                destino. El plazo empieza a contar desde que el paquete sale, no
                desde que confirmas la compra. Las piezas bajo pedido toman más
                tiempo; lo indicamos claramente en la página del producto. Más
                detalles en la página de <Link href="/envios">Envíos</Link>.
              </p>
            ) : (
              <p>
                Envíos a Estados Unidos: la entrega toma de{" "}
                <strong>{PLAZO_ENTREGA.es}</strong> una vez despachado el pedido.
                El plazo empieza a contar desde que el paquete sale, no desde que
                confirmas la compra. Algunas piezas hechas a la medida pueden
                tomar 2-3 semanas adicionales; lo indicamos claramente en la
                página del producto. Más detalles en la página de{" "}
                <Link href="/envios">Envíos</Link>.
              </p>
            )}

            <h2>¿Aceptan cambios de talla o devoluciones?</h2>
            {/* POR MERCADO, y aquí más que en ninguna otra respuesta: en
                botasleon.com el pedido es estadounidense aunque el cliente lea
                en español. Lo que cambia entre los dos no es el cambio de
                talla —desde el 2026-11-24 existe en los dos y en todos los
                modelos— sino el REEMBOLSO, que es de la ley mexicana y de una
                venta mexicana. */}
            {HAY_REEMBOLSO ? (
              <p>
                Sí, y en <strong>todos nuestros modelos</strong>. Tienes{" "}
                <strong>{DIAS_RETRACTO} días hábiles</strong> desde la entrega
                para cancelar la compra y recuperar tu dinero, sin darnos
                ningún motivo: es tu derecho por el artículo 56 de la Ley
                Federal de Protección al Consumidor, y lo respetamos aunque
                hayas comprado en oferta. Y tienes{" "}
                <strong>{DIAS_AVISO_CAMBIO} días naturales</strong> para pedir
                un cambio de talla — lo que vence en ese plazo es el aviso, no
                el cambio. En los dos casos la bota vuelve sin estrenar y en su
                empaque, y el envío de regreso corre por tu cuenta; en el
                cambio, nosotros pagamos el de la talla nueva. Política
                completa en <Link href="/devoluciones">Devoluciones</Link>.
              </p>
            ) : (
              <p>
                <strong>Cambio de talla sí, en todos nuestros modelos.</strong>{" "}
                Avísanos dentro de{" "}
                <strong>{DIAS_AVISO_CAMBIO} días naturales</strong> desde la
                entrega; lo que vence en ese plazo es el aviso, no el cambio.
                Nosotros pagamos el envío de la talla nueva, pero el regreso
                desde Estados Unidos es un envío internacional de más de 100
                dólares y lo paga el cliente, así que conviene revisar la{" "}
                <Link href="/guia-tallas">guía de tallas</Link> y escribirnos
                por WhatsApp antes de comprar. Lo que no hacemos en pedidos a
                Estados Unidos es devolver el dinero: el paquete cruzaría la
                aduana dos veces. Política completa en{" "}
                <Link href="/devoluciones">Devoluciones</Link>.
              </p>
            )}

            {/* ARANCELES — SOLO EN EL MERCADO AMERICANO. En México la
                pregunta no existe: no hay aduana que cruzar. Por mercado y no
                por idioma, porque este mismo español lo lee la diáspora en
                botasleon.com y ahí sí hay frontera.
                Aquí va la letra chica que la ficha no lleva: el arancel es
                cero, pero la cuota de gestión de la paquetería y el impuesto
                estatal no son aranceles. Quien llega a esta página quiere el
                detalle; quien está viendo la bota solo quiere saber si le van a
                cobrar al recibirla. */}
            {!isMX && (
              <>
                <h2>¿Tengo que pagar aranceles o impuestos de importación?</h2>
                <p>
                  <strong>No.</strong> Nuestras botas se fabrican en León,
                  Guanajuato, y una mercancía originaria de México entra a
                  Estados Unidos <strong>libre de arancel bajo el T-MEC</strong>{" "}
                  (USMCA). Cada pedido sale con su certificado de origen T-MEC,
                  su factura comercial y la clasificación arancelaria del par:
                  toda la documentación de aduana en orden desde que el paquete
                  deja el taller. El Tax ID que te pedimos en el carrito es para
                  esa entrada —el paquete se declara a tu nombre y la aduana no
                  lo libera sin un número de contribuyente—, no es un cobro.
                </p>
                <p>
                  Dos cosas que el T-MEC no cubre: la paquetería puede cobrar su
                  propia cuota de gestión aduanal, y hay estados que cobran
                  impuesto sobre la venta. Ninguno de los dos es un arancel y
                  ninguno lo cobramos nosotros. Detalle completo en{" "}
                  <Link href="/envios">Envíos</Link>.
                </p>
              </>
            )}

            <h2>¿Qué métodos de pago aceptan?</h2>
            <p>
              Tarjetas de crédito y débito (Visa, MasterCard, Amex), Apple Pay y
              Shop Pay.
            </p>

            <h2>¿Las botas se ven igual en persona que en la foto?</h2>
            <p>
              Hacemos lo posible por fotografiar el producto con luz neutra y sin
              retoque agresivo. Los colores de pantalla pueden variar
              ligeramente. Si al recibir la bota el color te parece
              sustancialmente distinto al de la foto, escríbenos — lo resolvemos.
            </p>

            <h2>¿Cómo cuido mis botas para que duren?</h2>
            <p>
              Limpia con paño seco después de cada uso. Aplica grasa o crema para
              cuero cada 3 meses (sin sobrehidratar). Evita mojarlas; si se
              mojan, sécalas a temperatura ambiente, nunca al sol o con secador.
              Guárdalas con horma de madera o papel adentro para que mantengan la
              forma.
            </p>

            <h2>¿Trabajan con distribuidores o mayoristas?</h2>
            <p>
              Sí. Si tienes una tienda física o proyecto de reventa, escríbenos a
              contacto@botasleon.com con los detalles. Manejamos precios
              mayoristas a partir de cierto volumen mínimo y enviamos catálogo
              completo bajo NDA.
            </p>

            <h2>¿Mi duda no está aquí?</h2>
            <p>
              Escríbenos a contacto@botasleon.com o ve a{" "}
              <Link href="/contacto">Contacto</Link>. Respondemos en menos de 24 horas
              hábiles.
            </p>
          </>
        }
        en={
          <>
            <h2>Are the boots made in Mexico?</h2>
            <p>
              Yes. Every boot we sell is made in León, Guanajuato — the world
              capital of leather. We work directly with local workshops, many
              with three generations of experience. We never sell imitations or
              boots imported from Asia.
            </p>

            <h2>What kind of leather do you use?</h2>
            <p>
              Every boot is built on genuine leather as its base — usually
              cowhide. For exotic collections (crocodile, ostrich, python,
              stingray) we work only with certified suppliers that comply with
              CITES responsible-trade regulations. Each product description
              specifies the exact material.
            </p>

            <h2>How long will my order take?</h2>
            {isMX ? (
              <p>
                Free shipping anywhere in Mexico: once dispatched, your order
                normally arrives in <strong>{PLAZO_ENTREGA.en}</strong> depending
                on the destination. Transit time starts when the package leaves,
                not when you place the order. Made-to-order pieces take longer,
                which we note clearly on the product page. See our{" "}
                <Link href="/envios">Shipping</Link> page for more details.
              </p>
            ) : (
              <p>
                Orders to the United States arrive in{" "}
                <strong>{PLAZO_ENTREGA.en}</strong> once dispatched. Transit time
                starts when the package leaves, not when you place the order. Some
                made-to-order pieces can take an additional 2-3 weeks, which we
                note clearly on the product page. See our{" "}
                <Link href="/envios">Shipping</Link> page for more details.
              </p>
            )}

            <h2>Can I return or exchange my order?</h2>
            {/* El mercado manda, no el idioma. Hoy esta rama mexicana no se
                pinta —la .mx publica solo español y /en redirige con 308—,
                pero se escribe igual: si algún día se publica inglés en la
                .mx, una respuesta fija le negaría a un comprador MEXICANO el
                reembolso al que sí tiene derecho por ley. */}
            {HAY_REEMBOLSO ? (
              <p>
                Yes, and on <strong>every model we sell</strong>. You have{" "}
                <strong>{DIAS_RETRACTO} business days</strong> from delivery to
                cancel the purchase and get your money back, with no reason
                needed — that is your right under article 56 of Mexico&apos;s
                consumer protection law, and it applies even if you bought on
                sale. You also have{" "}
                <strong>{DIAS_AVISO_CAMBIO} calendar days</strong> to request a
                size exchange; what expires in that window is the notice, not
                the exchange. Either way the boots come back unworn and in
                their box, and return shipping is on you; on an exchange we pay
                to ship the new size. Full policy on{" "}
                <Link href="/devoluciones">Returns</Link>.
              </p>
            ) : (
              <p>
                <strong>Size exchanges, yes — on every model we sell.</strong>{" "}
                Tell us within{" "}
                <strong>{DIAS_AVISO_CAMBIO} calendar days</strong> of delivery;
                what expires in that window is the notice, not the exchange. We
                pay to ship the new size, but the return from the United States
                is an international shipment costing over $100 and the customer
                covers it — so it is worth checking our{" "}
                <Link href="/guia-tallas">size guide</Link> and messaging us on
                WhatsApp before you order. What we don&apos;t do on U.S. orders
                is refund money: the parcel would have to clear customs twice.
                See our <Link href="/devoluciones">Returns</Link> page for full
                details.
              </p>
            )}

            {!isMX && (
              <>
                <h2>Will I have to pay tariffs or import duties?</h2>
                <p>
                  <strong>No.</strong> Our boots are made in León, Guanajuato,
                  and goods originating in Mexico enter the United States{" "}
                  <strong>duty-free under the USMCA</strong> (T-MEC). Every order
                  ships with its USMCA certificate of origin, its commercial
                  invoice and the tariff classification for the pair — all
                  customs paperwork in order before the parcel leaves the
                  workshop. The Tax ID we ask for in the cart is for that entry:
                  the parcel is declared in your name and customs won&apos;t
                  release it without a taxpayer number. It is not a charge.
                </p>
                <p>
                  Two things the USMCA does not cover: the carrier may bill its
                  own customs brokerage fee, and some states charge sales tax.
                  Neither one is a tariff, and neither is charged by us. Full
                  detail on our <Link href="/envios">Shipping</Link> page.
                </p>
              </>
            )}

            <h2>What payment methods do you accept?</h2>
            <p>
              Credit and debit cards (Visa, MasterCard, Amex), Apple Pay, and
              Shop Pay.
            </p>

            <h2>Do the boots look the same in person as in the photos?</h2>
            <p>
              We do our best to photograph each product in neutral light and
              without heavy retouching. Screen colors can vary slightly. If the
              color of the boots you receive looks substantially different from
              the photo, write to us — we&apos;ll make it right.
            </p>

            <h2>How do I care for my boots so they last?</h2>
            <p>
              Wipe them with a dry cloth after each wear. Apply leather grease or
              conditioner every 3 months (without over-conditioning). Keep them
              away from water; if they do get wet, let them dry at room
              temperature — never in the sun or with a hair dryer. Store them
              with a wooden shoe tree or paper inside so they hold their shape.
            </p>

            <h2>Do you work with distributors or wholesalers?</h2>
            <p>
              Yes. If you run a brick-and-mortar store or a resale project, email
              us at contacto@botasleon.com with the details. We offer wholesale
              pricing above a minimum order volume and share our full catalog
              under NDA.
            </p>

            <h2>Don&apos;t see your question here?</h2>
            <p>
              Email us at contacto@botasleon.com or head to{" "}
              <Link href="/contacto">Contact</Link>. We reply within 24 business hours.
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
  path: "/faq",
  title: "Preguntas frecuentes",
  description:
    "Respuestas a las dudas más comunes sobre envíos, tallas, materiales y cuidado de tus botas.",
  })
}
