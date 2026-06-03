import { ContentPage } from "@/components/ContentPage"
import { pageMetadata } from "@/lib/seo"

export default function PrivacidadPage() {
  return (
    <ContentPage
      eyebrow="Legal"
      title="Aviso de privacidad"
      intro="Cómo recopilamos, usamos y protegemos tus datos personales. Última actualización: mayo 2026."
    >
      <h2>1. Responsable</h2>
      <p>
        <strong>BotasLeón</strong>, con domicilio en León, Guanajuato,
        México, es responsable del tratamiento de tus datos personales.
        Contacto para asuntos de privacidad: privacidad@botasleon.com.
      </p>

      <h2>2. Datos que recopilamos</h2>
      <ul>
        <li>
          <strong>Datos de identificación:</strong> nombre, correo
          electrónico, teléfono
        </li>
        <li>
          <strong>Datos de envío:</strong> dirección física, código postal
        </li>
        <li>
          <strong>Datos de pago:</strong> los procesa Shopify Payments; no
          almacenamos números de tarjeta
        </li>
        <li>
          <strong>Datos de navegación:</strong> cookies, IP, dispositivo,
          páginas visitadas (vía Google Analytics y similares)
        </li>
        <li>
          <strong>Datos de pedidos:</strong> historial de compra, talla,
          preferencias
        </li>
      </ul>

      <h2>3. Para qué usamos tus datos</h2>
      <ul>
        <li>Procesar y enviar tus pedidos</li>
        <li>Contactarte sobre tu pedido o consultas</li>
        <li>Mejorar el sitio y la experiencia de compra</li>
        <li>
          Enviarte comunicaciones de marketing (solo si te suscribiste o
          aceptaste)
        </li>
        <li>Cumplir obligaciones fiscales y legales</li>
      </ul>

      <h2>4. Con quién compartimos</h2>
      <p>
        Compartimos los datos mínimos necesarios con:
      </p>
      <ul>
        <li>
          <strong>Shopify</strong>: plataforma de e-commerce y procesador de
          pagos
        </li>
        <li>
          <strong>Paqueterías</strong> (Estafeta, DHL, FedEx): para entregar
          tu pedido
        </li>
        <li>
          <strong>Email marketing</strong> (Klaviyo o similar): si te
          suscribiste al newsletter
        </li>
        <li><strong>Analytics</strong> (Google Analytics): datos agregados de uso</li>
      </ul>
      <p>
        No vendemos tus datos personales a terceros bajo ninguna
        circunstancia.
      </p>

      <h2>5. Tus derechos ARCO</h2>
      <p>
        Conforme a la Ley Federal de Protección de Datos Personales en
        Posesión de Particulares, tienes derecho a:
      </p>
      <ul>
        <li>
          <strong>Acceder</strong> a los datos que tenemos de ti
        </li>
        <li>
          <strong>Rectificar</strong> datos incorrectos o desactualizados
        </li>
        <li>
          <strong>Cancelar</strong> el tratamiento si ya no es necesario
        </li>
        <li>
          <strong>Oponerte</strong> al uso de tus datos para fines
          específicos
        </li>
      </ul>
      <p>
        Para ejercerlos, escribe a privacidad@botasleon.com. Respondemos en
        un plazo máximo de 20 días hábiles.
      </p>

      <h2>6. Cookies</h2>
      <p>
        Usamos cookies estrictamente necesarias para el funcionamiento del
        carrito y sesión, y cookies analíticas para entender uso del sitio.
        Puedes desactivar las opcionales en la configuración de tu navegador.
      </p>

      <h2>7. Conservación</h2>
      <p>
        Conservamos tus datos mientras tengas cuenta activa o mientras sea
        necesario para cumplir obligaciones fiscales (5 años para datos
        relacionados con compras, conforme normativa fiscal mexicana).
      </p>

      <h2>8. Cambios al aviso</h2>
      <p>
        Cualquier cambio sustancial a este aviso se notifica por correo a
        los clientes registrados y se publica en el Sitio con la fecha de
        actualización.
      </p>
    </ContentPage>
  )
}

export const metadata = pageMetadata({
  path: "/privacidad",
  title: "Aviso de privacidad",
  description:
    "Cómo recolectamos, usamos y protegemos tus datos personales conforme a la LFPDPPP.",
})
