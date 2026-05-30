import { ContentPage } from "@/components/ContentPage"

export default function EnviosPage() {
  return (
    <ContentPage
      eyebrow="Información"
      title="Envíos"
      intro="Cómo llegan tus botas a tu puerta, con qué tiempos y costos."
    >
      <h2>Cobertura</h2>
      <p>
        Enviamos a toda la República Mexicana y a Estados Unidos continental.
        Para otros países, escríbenos a hola@botasleon.com y te cotizamos.
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
    </ContentPage>
  )
}

export const metadata = {
  title: "Envíos — BotasLeón",
}
