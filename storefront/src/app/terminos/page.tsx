import { ContentPage } from "@/components/ContentPage"
import { pageMetadata } from "@/lib/seo"

export default function TerminosPage() {
  return (
    <ContentPage
      eyebrow="Legal"
      title="Términos y condiciones"
      intro="Al usar BotasLeón aceptas estos términos. Última actualización: mayo 2026."
    >
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
    </ContentPage>
  )
}

export const metadata = pageMetadata({
  path: "/terminos",
  title: "Términos y condiciones",
  description:
    "Términos de uso del sitio y condiciones de venta de BotasLeón.",
})
