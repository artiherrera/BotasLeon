import { ContentPage } from "@/components/ContentPage"
import { pageMetadata } from "@/lib/seo"

export default function FaqPage() {
  return (
    <ContentPage
      eyebrow="Información"
      title="Preguntas frecuentes"
      intro="Lo que más nos preguntan, en un solo lugar."
    >
      <h2>¿Las botas son hechas en México?</h2>
      <p>
        Sí. Todas las botas que comercializamos son fabricadas en León,
        Guanajuato — la capital mundial del cuero. Trabajamos directamente con
        talleres locales, muchos con tres generaciones de experiencia. No
        vendemos imitaciones ni botas importadas de Asia.
      </p>

      <h2>¿Qué tipo de piel utilizan?</h2>
      <p>
        Cada bota lleva piel genuina como base — usualmente vacuno. Para
        colecciones exóticas (cocodrilo, avestruz, pitón, mantarraya)
        trabajamos solo con proveedores certificados que cumplen regulaciones
        CITES de comercio responsable. La descripción de cada producto
        especifica el material exacto.
      </p>

      <h2>¿Cuánto tarda mi pedido?</h2>
      <p>
        Envíos dentro de México: 2-5 días hábiles según destino. Envíos a
        Estados Unidos: 7-10 días hábiles. Algunas piezas hechas a la medida
        pueden tomar 2-3 semanas adicionales; lo indicamos claramente en la
        página del producto. Más detalles en la página de{" "}
        <a href="/envios">Envíos</a>.
      </p>

      <h2>¿Puedo cambiar la talla si no me queda?</h2>
      <p>
        Sí. Tienes 30 días desde que recibes tu bota para solicitar cambio de
        talla sin costo, dentro de México. La bota debe estar sin uso, sin
        marcas, en su caja original. Detalles completos en{" "}
        <a href="/devoluciones">Devoluciones</a>.
      </p>

      <h2>¿Qué métodos de pago aceptan?</h2>
      <p>
        Tarjetas de crédito y débito (Visa, MasterCard, Amex), Mercado Pago,
        OXXO, SPEI, transferencia bancaria, y meses sin intereses con bancos
        participantes. En USA aceptamos también Apple Pay y Shop Pay.
      </p>

      <h2>¿Las botas se ven igual en persona que en la foto?</h2>
      <p>
        Hacemos lo posible por fotografiar el producto con luz neutra y sin
        retoque agresivo. Los colores de pantalla pueden variar ligeramente.
        Si al recibir la bota el color te parece sustancialmente distinto al
        de la foto, escríbenos — lo resolvemos.
      </p>

      <h2>¿Cómo cuido mis botas para que duren?</h2>
      <p>
        Limpia con paño seco después de cada uso. Aplica grasa o crema para
        cuero cada 3 meses (sin sobrehidratar). Evita mojarlas; si se mojan,
        sécalas a temperatura ambiente, nunca al sol o con secador. Guárdalas
        con horma de madera o papel adentro para que mantengan la forma.
      </p>

      <h2>¿Trabajan con distribuidores o mayoristas?</h2>
      <p>
        Sí. Si tienes una tienda física o proyecto de reventa, escríbenos a
        contacto@botasleon.com con los detalles. Manejamos precios mayoristas a
        partir de cierto volumen mínimo y enviamos catálogo completo bajo NDA.
      </p>

      <h2>¿Mi duda no está aquí?</h2>
      <p>
        Escríbenos a contacto@botasleon.com o ve a{" "}
        <a href="/contacto">Contacto</a>. Respondemos en menos de 24 horas
        hábiles.
      </p>
    </ContentPage>
  )
}

export const metadata = pageMetadata({
  path: "/faq",
  title: "Preguntas frecuentes",
  description:
    "Respuestas a las dudas más comunes sobre envíos, tallas, materiales y cuidado de tus botas.",
})
