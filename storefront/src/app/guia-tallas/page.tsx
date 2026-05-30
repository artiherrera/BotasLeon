import { ContentPage } from "@/components/ContentPage"

export default function GuiaTallasPage() {
  return (
    <ContentPage
      eyebrow="Información"
      title="Guía de tallas"
      intro="Cómo encontrar tu talla exacta en cualquiera de las escalas que manejamos."
    >
      <h2>Mide tu pie</h2>
      <p>
        Hazlo al final del día (los pies se hinchan ligeramente y queremos la
        medida más grande). Necesitas: hoja blanca, lápiz, regla.
      </p>
      <ol>
        <li>Pisa la hoja con el talón pegado a una pared</li>
        <li>Marca con el lápiz el punto más largo de tu dedo más adelantado</li>
        <li>Mide la distancia entre la pared y la marca en centímetros</li>
        <li>Si es asimétrico (común), usa el pie más largo</li>
      </ol>
      <p>
        Ese centímetro es tu talla en escala mexicana. Por ejemplo, 26.5 cm = talla 26.5 MX.
      </p>

      <h2>Tabla de conversión</h2>
      <p>Todas nuestras botas se manejan en talla mexicana. Si conoces tu talla en otra escala, esta tabla te orienta:</p>

      <h3>Hombre</h3>
      <table className="w-full border-collapse my-4 text-sm">
        <thead className="bg-bg-alt text-text">
          <tr><th className="border border-border p-2 text-left">MX (cm)</th><th className="border border-border p-2 text-left">US</th><th className="border border-border p-2 text-left">EU</th></tr>
        </thead>
        <tbody>
          {[
            ["25", "7", "39"],
            ["25.5", "7.5", "40"],
            ["26", "8", "41"],
            ["26.5", "8.5", "41.5"],
            ["27", "9", "42"],
            ["27.5", "9.5", "42.5"],
            ["28", "10", "43"],
            ["28.5", "10.5", "44"],
            ["29", "11", "45"],
            ["30", "12", "46"],
          ].map(([mx, us, eu]) => (
            <tr key={mx}>
              <td className="border border-border p-2">{mx}</td>
              <td className="border border-border p-2">{us}</td>
              <td className="border border-border p-2">{eu}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3>Mujer</h3>
      <table className="w-full border-collapse my-4 text-sm">
        <thead className="bg-bg-alt text-text">
          <tr><th className="border border-border p-2 text-left">MX (cm)</th><th className="border border-border p-2 text-left">US</th><th className="border border-border p-2 text-left">EU</th></tr>
        </thead>
        <tbody>
          {[
            ["22", "5", "35"],
            ["22.5", "5.5", "36"],
            ["23", "6", "36.5"],
            ["23.5", "6.5", "37"],
            ["24", "7", "37.5"],
            ["24.5", "7.5", "38"],
            ["25", "8", "39"],
            ["25.5", "8.5", "39.5"],
            ["26", "9", "40"],
            ["27", "10", "41"],
          ].map(([mx, us, eu]) => (
            <tr key={mx}>
              <td className="border border-border p-2">{mx}</td>
              <td className="border border-border p-2">{us}</td>
              <td className="border border-border p-2">{eu}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2>Ajuste de las botas vaqueras</h2>
      <p>
        Las botas vaqueras tradicionales tienen una entrada estrecha y el
        empeine ajustado. <strong>El primer uso es siempre apretado</strong>
        en el empeine — es normal. La piel cede después de 2-3 usos y el pie
        encuentra su forma.
      </p>
      <p>
        Si estás entre dos tallas y quieres comodidad inmediata, elige la
        mayor. Si quieres un ajuste premium a largo plazo, elige la menor.
      </p>

      <h2>¿Aún tienes dudas?</h2>
      <p>
        Escríbenos a hola@botasleon.com con tu medida en cm y el modelo que te
        interesa. Te asesoramos sin compromiso.
      </p>
    </ContentPage>
  )
}

export const metadata = {
  title: "Guía de tallas — BotasLeón",
}
