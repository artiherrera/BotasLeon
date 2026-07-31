import { ContentPage } from "@/components/ContentPage"
import { Localized } from "@/components/Localized"
import { pageMetadata } from "@/lib/seo"

export default function GuiaTallasPage() {
  return (
    <ContentPage
      eyebrow="page.guiaTallas.eyebrow"
      title="page.guiaTallas.title"
      intro="page.guiaTallas.intro"
    >
      <Localized
        es={
          <>
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
                <tr><th scope="col" className="border border-border p-2 text-left">MX (cm)</th><th scope="col" className="border border-border p-2 text-left">US</th><th scope="col" className="border border-border p-2 text-left">EU</th></tr>
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
                <tr><th scope="col" className="border border-border p-2 text-left">MX (cm)</th><th scope="col" className="border border-border p-2 text-left">US</th><th scope="col" className="border border-border p-2 text-left">EU</th></tr>
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
              Escríbenos a contacto@botasleon.com con tu medida en cm y el modelo que te
              interesa. Te asesoramos sin compromiso.
            </p>
          </>
        }
        en={
          <>
            <h2>Measure your foot</h2>
            <p>
              Do it at the end of the day (feet swell slightly and we want the
              larger measurement). You&apos;ll need: a blank sheet of paper, a pencil, a ruler.
            </p>
            <ol>
              <li>Stand on the paper with your heel against a wall</li>
              <li>With the pencil, mark the tip of your longest toe</li>
              <li>Measure the distance from the wall to the mark in centimeters</li>
              <li>If your feet are asymmetric (common), use the longer foot</li>
            </ol>
            <p>
              That measurement in centimeters is your size on the Mexican scale. For example, 26.5 cm = size 26.5 MX.
            </p>

            <h2>Conversion chart</h2>
            <p>All of our boots use Mexican sizing. If you know your size on another scale, this chart will point you to the right fit:</p>

            <h3>Men</h3>
            <table className="w-full border-collapse my-4 text-sm">
              <thead className="bg-bg-alt text-text">
                <tr><th scope="col" className="border border-border p-2 text-left">MX (cm)</th><th scope="col" className="border border-border p-2 text-left">US</th><th scope="col" className="border border-border p-2 text-left">EU</th></tr>
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

            <h3>Women</h3>
            <table className="w-full border-collapse my-4 text-sm">
              <thead className="bg-bg-alt text-text">
                <tr><th scope="col" className="border border-border p-2 text-left">MX (cm)</th><th scope="col" className="border border-border p-2 text-left">US</th><th scope="col" className="border border-border p-2 text-left">EU</th></tr>
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

            <h2>How cowboy boots fit</h2>
            <p>
              Traditional cowboy boots have a narrow opening and a snug instep.{" "}
              <strong>The first wear is always tight</strong> at the instep — that&apos;s
              normal. The leather gives after 2&ndash;3 wears and your foot finds its shape.
            </p>
            <p>
              If you&apos;re between two sizes and want immediate comfort, size up.
              If you want a premium long-term fit, size down.
            </p>

            <h2>Still have questions?</h2>
            <p>
              Write to us at contacto@botasleon.com with your measurement in cm and the model
              you&apos;re interested in. We&apos;ll help you out, no strings attached.
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
  path: "/guia-tallas",
  title: "Guía de tallas",
  description:
    "Tabla de equivalencias MX ↔ US para botas de hombre, mujer y niños. Cómo medir tu pie.",
  })
}
