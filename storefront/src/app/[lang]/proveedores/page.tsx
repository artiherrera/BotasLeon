import { ContentPage } from "@/components/ContentPage"
import { Localized } from "@/components/Localized"
import { pageMetadata } from "@/lib/seo"

export default function ProveedoresPage() {
  return (
    <ContentPage
      eyebrow="page.proveedores.eyebrow"
      title="page.proveedores.title"
      intro="page.proveedores.intro"
    >
      <Localized
        es={
          <>
            <h2>Quiénes somos para ustedes</h2>
            <p>
              Somos canal de venta directa al consumidor final, online, con foco en
              México (CDMX, GDL, MTY) y crecimiento hacia USA. No tenemos tienda
              física propia. Vendemos producto curado, con precios alineados al
              mercado y márgenes sanos.
            </p>

            <h2>Qué ofrecemos</h2>
            <ul>
              <li>Visibilidad en un catálogo curado (no somos marketplace)</li>
              <li>Sesión de fotos profesional para cada modelo (si requieres)</li>
              <li>Texto de descripción y materiales escrito por nosotros</li>
              <li>Posicionamiento en SEO y campañas pagadas</li>
              <li>Atención post-venta consolidada (cambios, devoluciones, soporte)</li>
              <li>Pago a 30 días sobre venta confirmada</li>
            </ul>

            <h2>Qué pedimos</h2>
            <ul>
              <li>Producto hecho en León, con materiales verificables</li>
              <li>Stock mínimo y reposición ágil (24-72 horas)</li>
              <li>
                Precio mayorista que permita margen comercial de 35-45% sobre PVP
              </li>
              <li>Consistencia en tallaje y acabados</li>
              <li>Exclusividad por canal: si comercias online directo, no nos sirves</li>
            </ul>

            <h2>Cómo empezar</h2>
            <p>
              Escribe a <strong>contacto@botasleon.com</strong> con:
            </p>
            <ol>
              <li>Nombre de tu marca / razón social</li>
              <li>Página o catálogo actual (PDF, link)</li>
              <li>Volumen de producción mensual aproximado</li>
              <li>Canales actuales (tiendas, web propia, etc.)</li>
            </ol>
            <p>
              Te respondemos en 5 días hábiles con siguiente paso: catálogo
              compartido bajo NDA, llamada exploratoria, y agendar visita a tu
              taller si seguimos.
            </p>
          </>
        }
        en={
          <>
            <h2>Who we are, for you</h2>
            <p>
              We're a direct-to-consumer online sales channel, focused on Mexico
              (Mexico City, Guadalajara, Monterrey) and growing into the USA. We
              don't have our own brick-and-mortar store. We sell curated product,
              with prices in line with the market and healthy margins.
            </p>

            <h2>What we offer</h2>
            <ul>
              <li>Visibility in a curated catalog (we're not a marketplace)</li>
              <li>A professional photo shoot for each model (if you need one)</li>
              <li>Description and materials copy written by us</li>
              <li>SEO positioning and paid campaigns</li>
              <li>Consolidated after-sales support (exchanges, returns, service)</li>
              <li>Net-30 payment on confirmed sales</li>
            </ul>

            <h2>What we ask</h2>
            <ul>
              <li>Product made in León, with verifiable materials</li>
              <li>Minimum stock and quick restocking (24-72 hours)</li>
              <li>
                Wholesale pricing that allows a 35-45% commercial margin on retail
                price
              </li>
              <li>Consistency in sizing and finishes</li>
              <li>
                Channel exclusivity: if you sell direct-to-consumer online yourself,
                you're not a fit for us
              </li>
            </ul>

            <h2>How to get started</h2>
            <p>
              Write to <strong>contacto@botasleon.com</strong> with:
            </p>
            <ol>
              <li>Your brand name / legal business name</li>
              <li>Your current website or catalog (PDF, link)</li>
              <li>Approximate monthly production volume</li>
              <li>Your current channels (stores, own website, etc.)</li>
            </ol>
            <p>
              We'll reply within 5 business days with the next step: a catalog
              shared under NDA, an exploratory call, and scheduling a visit to your
              workshop if we move forward.
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
  path: "/proveedores",
  title: "Trabaja con nosotros",
  description:
    "Eres taller en León? Aplica para comercializar tus botas en BotasLeón.",
  })
}
