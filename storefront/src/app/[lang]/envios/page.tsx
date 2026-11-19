import { ContentPage } from "@/components/ContentPage"
import { Localized } from "@/components/Localized"
import { pageMetadata } from "@/lib/seo"
import { isMX } from "@/lib/market"
import { PLAZO_ENTREGA, PLAZO_ENTREGA_CORTO } from "@/lib/entrega"

/**
 * Una página, dos mercados. `isMX` es constante de build (lib/market.ts), así
 * que la rama que no aplica se elimina del bundle — no es un condicional que
 * corra en el navegador.
 *
 * Existe la rama porque el texto de EE.UU. dice "enviamos a todo Estados Unidos
 * continental" y habla de aduana, aranceles y T-MEC. En botasleon.mx esas cosas
 * son falsas: el envío es nacional y no cruza ninguna aduana.
 *
 * LO ÚNICO QUE COMPARTEN LAS DOS RAMAS ES "ENTREGA SEGURA", y por eso está
 * escrito dos veces en vez de sacado a un componente: dice lo mismo pero no
 * promete lo mismo —en México el paquete no cruza frontera— y la próxima vez
 * que cambie una, lo más probable es que la otra se quede como está.
 */

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
            <strong>El envío es gratis, sin monto mínimo.</strong> A cualquier
            código postal de la República, en cualquier pedido.
          </p>
          <p>
            Todos nuestros precios ya incluyen IVA. No hay cargos adicionales
            después de la compra.
          </p>

          <h2>Tiempos de entrega</h2>
          <p>
            Una vez despachado tu pedido, la entrega toma normalmente de{" "}
            <strong>{PLAZO_ENTREGA.es}</strong> según el destino. Los tiempos
            empiezan a contar desde que el paquete sale, no desde que confirmas
            la compra.
          </p>

          <h2>Entrega segura</h2>
          <p>
            Todos los envíos van <strong>asegurados contra extravío y daños en
            tránsito</strong> y con número de guía para que sigas tu paquete
            desde que sale del taller. Si algo pasa en el camino, te acompañamos
            en la aclaración con la paquetería hasta resolverlo.
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
            <strong>Shipping is free, with no minimum order.</strong> To any
            postal code in Mexico, on every order.
          </p>
          <p>
            All our prices already include Mexican VAT. There are no additional
            charges after purchase.
          </p>

          <h2>Delivery times</h2>
          <p>
            Once your order ships, delivery normally takes{" "}
            <strong>{PLAZO_ENTREGA.en}</strong> depending on the destination.
            Transit times start counting when the package leaves, not when you
            place the order.
          </p>

          <h2>Secure delivery</h2>
          <p>
            Every shipment travels <strong>insured against loss and in-transit
            damage</strong>, with a tracking number so you can follow your parcel
            from the moment it leaves the workshop. If anything happens on the
            way, we walk you through the claim with the carrier until it&rsquo;s
            resolved.
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
            <li><strong>Estados Unidos:</strong> {PLAZO_ENTREGA_CORTO.es}</li>
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

          <h2>Aduana y aranceles</h2>
          <p>
            <strong>No pagas aranceles.</strong> Nuestras botas se fabrican en
            León, Guanajuato, y una mercancía originaria de México entra a
            Estados Unidos libre de arancel bajo el T-MEC (USMCA).
          </p>
          <p>
            Cada pedido sale con su{" "}
            <strong>certificado de origen T-MEC</strong>, su factura comercial y
            la clasificación arancelaria del par: toda la documentación de aduana
            en orden. Desde que Estados Unidos suspendió la exención de minimis,
            ningún paquete se salva del trámite por ser pequeño —todos tienen que
            presentar entrada—, así que esto dejó de ser un detalle: es la
            diferencia entre una bota que llega y una detenida esperando un
            papel.
          </p>
          <p>
            El Tax ID que te pedimos en el carrito es justamente para eso. El
            paquete entra a tu nombre y la aduana no lo libera sin un número de
            contribuyente; no es un cobro ni un trámite que tengas que hacer tú.
          </p>
          <p>
            Lo que el T-MEC no cubre: la paquetería puede cobrar su propia cuota
            de gestión aduanal, y hay estados que cobran impuesto sobre la venta.
            Ninguno de los dos es un arancel y ninguno lo cobramos nosotros.
          </p>

          <h2>Entrega segura</h2>
          <p>
            Trabajamos con DHL y FedEx según el servicio y la urgencia. Todos los
            envíos van <strong>asegurados contra extravío y daños en
            tránsito</strong>. Si algo pasa en el camino, te acompañamos en la
            aclaración con la paquetería hasta resolverlo.
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
            <li><strong>United States:</strong> {PLAZO_ENTREGA_CORTO.en}</li>
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

          <h2>Customs and tariffs</h2>
          <p>
            <strong>You pay no tariffs.</strong> Our boots are made in León,
            Guanajuato, and goods originating in Mexico enter the United States
            duty-free under the USMCA (T-MEC).
          </p>
          <p>
            Every order ships with its{" "}
            <strong>USMCA certificate of origin</strong>, its commercial invoice
            and the tariff classification for the pair — all customs paperwork in
            order. Since the United States suspended the de minimis exemption, no
            parcel gets waved through for being small; every one has to be
            entered. That turned paperwork from a detail into the difference
            between boots that arrive and boots held at the border waiting on a
            document.
          </p>
          <p>
            The Tax ID we ask for in the cart is exactly for this. The parcel is
            entered in your name and customs won&rsquo;t release it without a
            taxpayer number — it is not a charge, and not a filing you have to
            make yourself.
          </p>
          <p>
            What the USMCA does not cover: the carrier may bill its own customs
            brokerage fee, and some states charge sales tax. Neither one is a
            tariff, and neither is charged by us.
          </p>

          <h2>Secure delivery</h2>
          <p>
            We ship with carriers such as DHL and FedEx depending on the
            destination and how quickly you need your order. Every shipment
            travels <strong>insured against loss and in-transit damage</strong>.
            If anything happens on the way, we walk you through the claim with
            the carrier until it&rsquo;s resolved.
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
      ? "Envío gratis a toda la República Mexicana, sin monto mínimo. Tiempos de entrega y rastreo."
      : "Envío a todo Estados Unidos sin aranceles: entramos por el T-MEC con certificado de origen. Tiempos, costos y rastreo.",
  })
}
