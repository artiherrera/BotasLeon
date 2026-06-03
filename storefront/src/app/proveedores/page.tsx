import { ContentPage } from "@/components/ContentPage"
import { pageMetadata } from "@/lib/seo"

export default function ProveedoresPage() {
  return (
    <ContentPage
      eyebrow="Empresa"
      title="Para marcas y proveedores"
      intro="Si tu casa de calzado quiere distribuirse en BotasLeón, esto es lo que ofrecemos y lo que pedimos."
    >
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
        Escribe a <strong>marcas@botasleon.com</strong> con:
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
    </ContentPage>
  )
}

export const metadata = pageMetadata({
  path: "/proveedores",
  title: "Trabaja con nosotros",
  description:
    "Eres taller en León? Aplica para comercializar tus botas en BotasLeón.",
})
