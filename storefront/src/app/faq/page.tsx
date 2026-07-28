import { ContentPage } from "@/components/ContentPage"
import { Localized } from "@/components/Localized"
import { pageMetadata } from "@/lib/seo"

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

            <h2>¿Cuánto tarda mi pedido?</h2>
            <p>
              Envíos dentro de México: 2-5 días hábiles según destino. Envíos a
              Estados Unidos: 7-10 días hábiles. Algunas piezas hechas a la
              medida pueden tomar 2-3 semanas adicionales; lo indicamos
              claramente en la página del producto. Más detalles en la página de{" "}
              <a href="/envios">Envíos</a>.
            </p>

            <h2>¿Puedo cambiar la talla si no me queda?</h2>
            <p>
              Sí. Tienes 30 días desde que recibes tu bota para solicitar cambio
              de talla sin costo, dentro de México. La bota debe estar sin uso,
              sin marcas, en su caja original. Detalles completos en{" "}
              <a href="/devoluciones">Devoluciones</a>.
            </p>

            <h2>¿Qué métodos de pago aceptan?</h2>
            <p>
              Tarjetas de crédito y débito (Visa, MasterCard, Amex), Mercado
              Pago, OXXO, SPEI, transferencia bancaria, y meses sin intereses con
              bancos participantes. En USA aceptamos también Apple Pay y Shop
              Pay.
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
              <a href="/contacto">Contacto</a>. Respondemos en menos de 24 horas
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
            <p>
              Orders to the United States typically arrive within 7-10 business
              days. Some made-to-order pieces can take an additional 2-3 weeks,
              which we note clearly on the product page. See our{" "}
              <a href="/envios">Shipping</a> page for more details.
            </p>

            <h2>Can I exchange the size if it doesn't fit?</h2>
            <p>
              Yes. You have 30 days from the day your boots arrive to request a
              size exchange. The boots must be unworn, unmarked, and in their
              original box. See our <a href="/devoluciones">Returns</a> page for
              full details.
            </p>

            <h2>What payment methods do you accept?</h2>
            <p>
              Credit and debit cards (Visa, MasterCard, Amex), Apple Pay, and
              Shop Pay. Additional local payment options are available for orders
              placed within Mexico.
            </p>

            <h2>Do the boots look the same in person as in the photos?</h2>
            <p>
              We do our best to photograph each product in neutral light and
              without heavy retouching. Screen colors can vary slightly. If the
              color of the boots you receive looks substantially different from
              the photo, write to us — we'll make it right.
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

            <h2>Don't see your question here?</h2>
            <p>
              Email us at contacto@botasleon.com or head to{" "}
              <a href="/contacto">Contact</a>. We reply within 24 business hours.
            </p>
          </>
        }
      />
    </ContentPage>
  )
}

export const metadata = pageMetadata({
  path: "/faq",
  title: "Preguntas frecuentes",
  description:
    "Respuestas a las dudas más comunes sobre envíos, tallas, materiales y cuidado de tus botas.",
})
