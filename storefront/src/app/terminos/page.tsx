import { ContentPage } from "@/components/ContentPage"
import { Localized } from "@/components/Localized"
import { pageMetadata } from "@/lib/seo"

export default function TerminosPage() {
  return (
    <ContentPage
      eyebrow="page.terminos.eyebrow"
      title="page.terminos.title"
      intro="page.terminos.intro"
    >
      <Localized
        es={
          <>
            <h2>1. Aceptación</h2>
            <p>
              Al acceder y usar el sitio botasleon.com (en adelante "el Sitio") y
              sus servicios, aceptas estos Términos y Condiciones en su totalidad.
              Si no estás de acuerdo, no uses el Sitio.
            </p>

            <h2>2. Identificación del responsable</h2>
            <p>
              El Sitio es operado por <strong>BotasLeón</strong>, con domicilio en
              León, Guanajuato, México. Para asuntos legales o de privacidad,
              escribe a contacto@botasleon.com.
            </p>

            <h2>3. Productos y precios</h2>
            <p>
              Los productos exhibidos están sujetos a disponibilidad. Los precios
              se muestran en pesos mexicanos (MXN) e incluyen el IVA aplicable.
              Nos reservamos el derecho de modificar precios sin previo aviso, pero
              siempre se respetará el precio mostrado al confirmar tu pedido.
            </p>

            <h2>4. Pedidos y pagos</h2>
            <p>
              Al confirmar un pedido aceptas pagar el monto total (productos +
              envío + impuestos aplicables). Los pagos se procesan a través de
              Shopify Payments y nuestros proveedores autorizados; no almacenamos
              datos de tarjetas. Un pedido se considera aceptado únicamente al
              confirmarse el pago.
            </p>

            <h2>5. Envíos y entregas</h2>
            <p>
              Aplican los plazos y condiciones detallados en{" "}
              <a href="/envios">Envíos</a>. Los tiempos son estimados; no nos
              responsabilizamos por retrasos imputables a la paquetería o a
              circunstancias de fuerza mayor.
            </p>

            <h2>6. Cambios y devoluciones</h2>
            <p>
              Tu derecho a cambios y devoluciones está descrito en{" "}
              <a href="/devoluciones">Devoluciones</a>. Cumplimos con la PROFECO y
              normativa mexicana aplicable de protección al consumidor.
            </p>

            <h2>7. Propiedad intelectual</h2>
            <p>
              Todo contenido del Sitio (textos, fotos, logo, código) es propiedad
              de BotasLeón o de sus licenciantes. No autorizamos reproducción,
              distribución ni uso comercial sin permiso por escrito.
            </p>

            <h2>8. Limitación de responsabilidad</h2>
            <p>
              BotasLeón no se responsabiliza por daños indirectos, lucro cesante o
              cualquier daño derivado del uso o imposibilidad de uso del Sitio,
              más allá del valor del pedido afectado.
            </p>

            <h2>9. Modificaciones</h2>
            <p>
              Nos reservamos el derecho de modificar estos Términos en cualquier
              momento. Los cambios entran en vigor al publicarse. Tu uso continuado
              del Sitio implica aceptación de los términos vigentes.
            </p>

            <h2>10. Ley aplicable y jurisdicción</h2>
            <p>
              Estos Términos se rigen por las leyes de los Estados Unidos
              Mexicanos. Cualquier controversia se someterá a los tribunales
              competentes de León, Guanajuato.
            </p>
          </>
        }
        en={
          <>
            <h2>1. Acceptance</h2>
            <p>
              By accessing and using the botasleon.com website (hereinafter "the
              Site") and its services, you accept these Terms and Conditions in
              full. If you do not agree, do not use the Site.
            </p>

            <h2>2. Identification of the responsible party</h2>
            <p>
              The Site is operated by <strong>BotasLeón</strong>, with its
              registered address in León, Guanajuato, Mexico. For legal or privacy
              matters, write to contacto@botasleon.com.
            </p>

            <h2>3. Products and prices</h2>
            <p>
              The products displayed are subject to availability. Prices are shown
              in Mexican pesos (MXN) and include any applicable VAT. We reserve the
              right to modify prices without prior notice, but the price shown when
              you confirm your order will always be honored.
            </p>

            <h2>4. Orders and payments</h2>
            <p>
              By confirming an order you agree to pay the total amount (products +
              shipping + applicable taxes). Payments are processed through Shopify
              Payments and our authorized providers; we do not store card data. An
              order is considered accepted only once payment is confirmed.
            </p>

            <h2>5. Shipping and delivery</h2>
            <p>
              The timeframes and conditions detailed in{" "}
              <a href="/envios">Shipping</a> apply. Delivery times are estimates; we
              are not responsible for delays attributable to the carrier or to
              circumstances of force majeure.
            </p>

            <h2>6. Exchanges and returns</h2>
            <p>
              Orders shipped to the United States are final sale. Our full exchange
              and return terms are described in{" "}
              <a href="/devoluciones">Returns</a>.
            </p>

            <h2>7. Intellectual property</h2>
            <p>
              All content on the Site (text, photos, logo, code) is the property of
              BotasLeón or its licensors. We do not authorize reproduction,
              distribution, or commercial use without written permission.
            </p>

            <h2>8. Limitation of liability</h2>
            <p>
              BotasLeón is not liable for indirect damages, loss of profits, or any
              damage arising from the use of or inability to use the Site, beyond
              the value of the affected order.
            </p>

            <h2>9. Modifications</h2>
            <p>
              We reserve the right to modify these Terms at any time. Changes take
              effect upon publication. Your continued use of the Site constitutes
              acceptance of the terms in force.
            </p>

            <h2>10. Governing law and jurisdiction</h2>
            <p>
              These Terms are governed by the laws of the United Mexican States.
              Any dispute will be submitted to the competent courts of León,
              Guanajuato.
            </p>
          </>
        }
      />
    </ContentPage>
  )
}

export const metadata = pageMetadata({
  path: "/terminos",
  title: "Términos y condiciones",
  description:
    "Términos de uso del sitio y condiciones de venta de BotasLeón.",
})
