import { ContentPage } from "@/components/ContentPage"
import { Localized } from "@/components/Localized"
import { pageMetadata } from "@/lib/seo"
import { isMX } from "@/lib/market"
import { FREE_SHIPPING_THRESHOLD } from "@/lib/shipping-policy"

/**
 * Una página, dos mercados. `isMX` es constante de build (lib/market.ts), así
 * que la rama que no aplica se elimina del bundle — no es un condicional que
 * corra en el navegador.
 *
 * Existe la rama porque el texto de EE.UU. dice "enviamos a todo Estados Unidos
 * continental" y "cualquier cargo de importación corre por cuenta del
 * comprador". En botasleon.mx las dos cosas son falsas: el envío es nacional y
 * no cruza ninguna aduana.
 */

/** Umbral con separador de miles. El ?? nunca dispara en un build MX. */
const UMBRAL = (FREE_SHIPPING_THRESHOLD ?? 3999).toLocaleString("es-MX")

function EnviosMexico() {
  return (
    <Localized
      es={
        <>
          <h2>Cobertura</h2>
          <p>
            Enviamos a toda la República Mexicana. Si tu código postal está en una
            zona sin cobertura de paquetería, te contactamos para buscar una
            alternativa antes de cobrarte.
          </p>

          <h2>Costos</h2>
          <p>
            <strong>Envío gratis en pedidos de ${UMBRAL} MXN o más.</strong> Por
            debajo de ese monto, el costo se calcula al pagar según tu código
            postal y la paquetería. Lo ves antes de confirmar el pedido.
          </p>
          <p>
            Todos nuestros precios ya incluyen IVA. No hay cargos adicionales
            después de la compra.
          </p>

          <h2>Tiempos de entrega</h2>
          <p>
            Una vez despachado tu pedido, la entrega toma normalmente entre 3 y 7
            días hábiles según el destino. Los tiempos empiezan a contar desde que
            el paquete sale, no desde que confirmas la compra.
          </p>

          <h2>Rastreo</h2>
          <p>
            Al despachar tu pedido te enviamos el número de guía por correo. Si no
            lo recibes dentro de 24 horas hábiles, escríbenos a
            contacto@botasleon.com.
          </p>

          <h2>Direcciones foráneas o de difícil acceso</h2>
          <p>
            Si tu dirección está en una zona de difícil acceso, la paquetería puede
            contactarte para coordinar la entrega o pedirte que recojas en
            sucursal. Esto puede agregar 1 o 2 días al tiempo estimado.
          </p>
        </>
      }
      en={
        <>
          <h2>Coverage</h2>
          <p>
            We ship anywhere in Mexico. If your postal code falls outside carrier
            coverage, we&rsquo;ll contact you to find an alternative before
            charging you.
          </p>

          <h2>Shipping costs</h2>
          <p>
            <strong>Free shipping on orders of ${UMBRAL} MXN or more.</strong>{" "}
            Below that, shipping is calculated at checkout based on your postal
            code and carrier. You see it before confirming your order.
          </p>
          <p>
            All our prices already include Mexican VAT. There are no additional
            charges after purchase.
          </p>

          <h2>Delivery times</h2>
          <p>
            Once your order ships, delivery normally takes 3 to 7 business days
            depending on the destination. Transit times start counting when the
            package leaves, not when you place the order.
          </p>

          <h2>Tracking</h2>
          <p>
            When your order is dispatched we email you the tracking number. If you
            don&rsquo;t receive it within one business day, write to
            contacto@botasleon.com.
          </p>

          <h2>Remote or hard-to-reach addresses</h2>
          <p>
            If your address is in a hard-to-reach area, the carrier may contact you
            to coordinate delivery or ask you to collect your order at a local
            branch. This can add 1 or 2 days to the estimate.
          </p>
        </>
      }
    />
  )
}

function EnviosEstadosUnidos() {
  return (
    <Localized
      es={
        <>
          <h2>Cobertura</h2>
          <p>
            Enviamos a todo Estados Unidos continental. Para otros destinos,
            escríbenos a contacto@botasleon.com y te cotizamos.
          </p>

          <h2>Tiempos de entrega</h2>
          <ul>
            <li><strong>Estados Unidos:</strong> 7-10 días hábiles</li>
          </ul>
          <p>
            Los tiempos comienzan a contar desde que tu pedido es enviado (no desde
            que lo confirmas). Recibes tu número de guía por correo electrónico.
          </p>

          <h2>Costos</h2>
          <p>
            El costo del envío se calcula al momento de pagar, según tu
            dirección y el servicio de paquetería. Lo ves antes de confirmar
            el pedido — nunca hay cargos sorpresa después.
          </p>
          <p>
            Cualquier trámite o cargo de importación corre por cuenta del comprador
            y no está incluido en el total.
          </p>

          <h2>Paqueterías</h2>
          <p>
            Trabajamos con DHL y FedEx según el servicio y la urgencia.
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
            We ship throughout the continental United States. For other
            destinations, email us at contacto@botasleon.com and we&rsquo;ll
            send you a quote.
          </p>

          <h2>Delivery times</h2>
          <ul>
            <li><strong>United States:</strong> estimated 7-10 business days</li>
          </ul>
          <p>
            Transit times start counting once your order ships (not when you place
            it). You&rsquo;ll receive your tracking number by email.
          </p>

          <h2>Shipping costs</h2>
          <p>
            Shipping is calculated at checkout based on your address and the
            carrier service. You see it before confirming your order — never a
            surprise charge afterwards.
          </p>
          <p>
            Any import formalities or charges are the buyer&rsquo;s responsibility
            and are not included in the total.
          </p>

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
  )
}

export default function EnviosPage() {
  return (
    <ContentPage
      eyebrow="page.envios.eyebrow"
      title="page.envios.title"
      intro="page.envios.intro"
    >
      {isMX ? <EnviosMexico /> : <EnviosEstadosUnidos />}
    </ContentPage>
  )
}

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  return pageMetadata({
    locale: lang,
    path: "/envios",
    title: "Envíos",
    description: isMX
      ? `Envíos a toda la República Mexicana. Gratis en pedidos de $${UMBRAL} MXN o más. Tiempos, costos y rastreo.`
      : "Envío a todo Estados Unidos. Tiempos, costos y rastreo de pedidos.",
  })
}
