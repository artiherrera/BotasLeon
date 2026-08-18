import { ContentPage } from "@/components/ContentPage"
import { Localized } from "@/components/Localized"
import { pageMetadata } from "@/lib/seo"

export default function PrivacidadPage() {
  return (
    <ContentPage
      eyebrow="page.privacidad.eyebrow"
      title="page.privacidad.title"
      intro="page.privacidad.intro"
    >
      <Localized
        es={
          <>
            <h2>1. Responsable</h2>
            <p>
              <strong>BotasLeón</strong>, con domicilio en Blvd. Hilario Medina 407,
              2º piso, Col. Josefina, 37260 León de los Aldama, Guanajuato, México,
              es responsable del tratamiento de tus datos personales. Contacto para
              asuntos de privacidad: contacto@botasleon.com.
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
                Enviarte comunicaciones de marketing (solo si diste tu
                consentimiento)
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
                <strong>Email marketing</strong> (Klaviyo o similar): si diste
                tu consentimiento
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
              Para ejercerlos, escribe a contacto@botasleon.com. Respondemos en
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
          </>
        }
        en={
          <>
            <h2>1. Data Controller</h2>
            <p>
              <strong>BotasLeón</strong>, located at Blvd. Hilario Medina 407,
              2nd floor, Col. Josefina, 37260 León de los Aldama, Guanajuato, Mexico,
              is responsible for processing your personal data. For privacy-related
              matters, contact us at contacto@botasleon.com.
            </p>

            <h2>2. Data We Collect</h2>
            <ul>
              <li>
                <strong>Identification data:</strong> name, email address, phone
                number
              </li>
              <li>
                <strong>Shipping data:</strong> physical address, ZIP/postal code
              </li>
              <li>
                <strong>Payment data:</strong> processed by Shopify Payments; we do
                not store card numbers
              </li>
              <li>
                <strong>Browsing data:</strong> cookies, IP address, device, pages
                visited (via Google Analytics and similar tools)
              </li>
              <li>
                <strong>Order data:</strong> purchase history, size, preferences
              </li>
            </ul>

            <h2>3. How We Use Your Data</h2>
            <ul>
              <li>Process and ship your orders</li>
              <li>Contact you about your order or inquiries</li>
              <li>Improve the site and shopping experience</li>
              <li>
                Send you marketing communications (only if you opted in)
              </li>
              <li>Comply with tax and legal obligations</li>
            </ul>

            <h2>4. Who We Share Data With</h2>
            <p>
              We share only the minimum data necessary with:
            </p>
            <ul>
              <li>
                <strong>Shopify</strong>: e-commerce platform and payment processor
              </li>
              <li>
                <strong>Carriers</strong> (Estafeta, DHL, FedEx): to deliver your
                order
              </li>
              <li>
                <strong>Email marketing</strong> (Klaviyo or similar): if you
                opted in
              </li>
              <li><strong>Analytics</strong> (Google Analytics): aggregated usage data</li>
            </ul>
            <p>
              We never sell your personal data to third parties under any
              circumstances.
            </p>

            <h2>5. Your Privacy Rights</h2>
            <p>
              Under Mexico's Federal Law on the Protection of Personal Data Held by
              Private Parties (LFPDPPP), you have the right to:
            </p>
            <ul>
              <li>
                <strong>Access</strong> the data we hold about you
              </li>
              <li>
                <strong>Rectify</strong> incorrect or outdated data
              </li>
              <li>
                <strong>Cancel</strong> the processing of your data when it is no
                longer necessary
              </li>
              <li>
                <strong>Object</strong> to the use of your data for specific
                purposes
              </li>
            </ul>
            <p>
              To exercise these rights, write to contacto@botasleon.com. We respond
              within a maximum of 20 business days.
            </p>

            <h2>6. Cookies</h2>
            <p>
              We use strictly necessary cookies for the cart and session to
              function, and analytics cookies to understand how the site is used.
              You can disable optional cookies in your browser settings.
            </p>

            <h2>7. Retention</h2>
            <p>
              We retain your data for as long as you maintain an active account or as
              necessary to comply with tax obligations (5 years for purchase-related
              data, in accordance with Mexican tax regulations).
            </p>

            <h2>8. Changes to This Notice</h2>
            <p>
              Any material change to this notice is communicated by email to
              registered customers and published on the Site along with the
              update date.
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
  path: "/privacidad",
  title: "Aviso de privacidad",
  description:
    "Cómo recolectamos, usamos y protegemos tus datos personales conforme a la LFPDPPP.",
  })
}
