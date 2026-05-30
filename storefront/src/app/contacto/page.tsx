import { ContentPage } from "@/components/ContentPage"

export default function ContactoPage() {
  return (
    <ContentPage
      eyebrow="Información"
      title="Contacto"
      intro="Estamos para resolver dudas, asesorarte en tallas o ayudarte con tu pedido."
    >
      <h2>Atención a clientes</h2>
      <p>
        <strong>Correo:</strong> hola@botasleon.com<br />
        <strong>WhatsApp:</strong> +52 477 000 0000<br />
        <strong>Horario:</strong> Lunes a viernes 9:00 a 18:00 (CDMX)
      </p>
      <p>
        Respondemos correos en menos de 24 horas hábiles. Por WhatsApp
        usualmente más rápido durante horario.
      </p>

      <h2>Pedidos mayoristas y marcas</h2>
      <p>
        Si tienes una tienda física, vendes online, o representas una marca
        que quiere distribuirse con nosotros, escríbenos a:
      </p>
      <p>
        <strong>Mayoreo:</strong> mayoreo@botasleon.com<br />
        <strong>Marcas / proveedores:</strong> marcas@botasleon.com
      </p>

      <h2>Dirección</h2>
      <p>
        BotasLeón<br />
        León, Guanajuato<br />
        México
      </p>
      <p>
        Por ahora operamos sin tienda física al público. Si quieres ver
        producto antes de comprar, agenda una cita por correo.
      </p>

      <h2>Síguenos</h2>
      <ul>
        <li>Instagram: @botasleon</li>
        <li>Facebook: /botasleon</li>
        <li>TikTok: @botasleon</li>
      </ul>
    </ContentPage>
  )
}

export const metadata = {
  title: "Contacto — BotasLeón",
}
