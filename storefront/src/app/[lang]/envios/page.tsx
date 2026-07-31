import { ContentPage } from "@/components/ContentPage"
import { Localized } from "@/components/Localized"
import { pageMetadata } from "@/lib/seo"

export default function EnviosPage() {
  return (
    <ContentPage
      eyebrow="page.envios.eyebrow"
      title="page.envios.title"
      intro="page.envios.intro"
    >
      <Localized
        es={
          <>
            <h2>Cobertura</h2>
            <p>
              Enviamos a toda la República Mexicana y a Estados Unidos continental.
              Para otros países, escríbenos a contacto@botasleon.com y te cotizamos.
            </p>

            <h2>Tiempos de entrega</h2>
            <ul>
              <li><strong>México (CDMX, Guadalajara, Monterrey):</strong> 2-3 días hábiles</li>
              <li><strong>México (resto del país):</strong> 3-5 días hábiles</li>
              <li><strong>Estados Unidos:</strong> 7-10 días hábiles</li>
            </ul>
            <p>
              Los tiempos comienzan a contar desde que tu pedido es enviado (no desde
              que lo confirmas). Recibes tu número de guía por correo electrónico.
            </p>

            <h2>Costos</h2>
            <ul>
              <li><strong>Envío estándar nacional:</strong> $150 MXN (gratis en compras mayores a $3,000)</li>
              <li><strong>Envío express nacional:</strong> $280 MXN</li>
              <li><strong>Envío a Estados Unidos:</strong> calculado al pagar según destino</li>
            </ul>

            <h2>Paqueterías</h2>
            <p>
              Trabajamos con Estafeta, DHL y FedEx según el destino y la urgencia.
              Todos los envíos van con seguro contra extravío y daños en tránsito.
            </p>

            <h2>Rastreo</h2>
            <p>
              Al despachar tu pedido te enviamos el número de guía por correo.
              Puedes rastrearlo en el sitio de la paquetería correspondiente. Si no
              recibes el correo en 24 horas hábiles, escríbenos.
            </p>

            <h2>Direcciones difíciles o foráneas</h2>
            <p>
              Si tu dirección está en una zona de difícil acceso, la paquetería puede
              contactarte para coordinar la entrega o pedir que recojas en sucursal.
              Esto puede agregar 1-2 días al tiempo estimado.
            </p>
          </>
        }
        en={
          <>
            <h2>Coverage</h2>
            <p>
              We ship throughout the continental United States, as well as across
              Mexico. For other countries, email us at contacto@botasleon.com and
              we&rsquo;ll send you a quote.
            </p>

            <h2>Delivery times</h2>
            <ul>
              <li><strong>United States:</strong> estimated 7-10 business days</li>
              <li><strong>Mexico (major cities):</strong> 2-3 business days</li>
              <li><strong>Mexico (rest of the country):</strong> 3-5 business days</li>
            </ul>
            <p>
              Transit times start counting once your order ships (not when you place
              it). You&rsquo;ll receive your tracking number by email.
            </p>

            <h2>Shipping costs</h2>
            <ul>
              <li><strong>Standard shipping:</strong> calculated at checkout based on your destination</li>
              <li><strong>Express shipping:</strong> available at checkout for eligible destinations</li>
              <li><strong>Shipping to the United States:</strong> calculated at checkout based on your destination</li>
            </ul>

            <h2>Carriers</h2>
            <p>
              We ship with carriers such as DHL and FedEx depending on the destination
              and how quickly you need your order. Every shipment includes insurance
              against loss and in-transit damage.
            </p>

            <h2>Tracking</h2>
            <p>
              When your order is dispatched, we email you the tracking number. You can
              follow it on the carrier&rsquo;s website. If you don&rsquo;t receive the
              email within one business day, get in touch.
            </p>

            <h2>Hard-to-reach or remote addresses</h2>
            <p>
              If your address is in a hard-to-reach area, the carrier may contact you
              to coordinate delivery or ask you to pick up your order at a local
              branch. This can add 1-2 days to the estimated time.
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
  path: "/envios",
  title: "Envíos",
  description:
    "Envío a todo México y Estados Unidos. Tiempos, costos y rastreo de pedidos.",
  })
}
