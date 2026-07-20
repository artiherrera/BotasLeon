import { ContentPage } from "@/components/ContentPage"
import { pageMetadata } from "@/lib/seo"

export default function NosotrosPage() {
  return (
    <ContentPage
      eyebrow="Empresa"
      title="Nosotros"
      intro="Curamos las mejores botas hechas en León para llevarlas directo a tu puerta."
    >
      <h2>Lo que somos</h2>
      <p>
        BotasLeón es una comercializadora multi-marca de botas mexicanas. No
        somos fabricantes — somos curadores. Recorremos los talleres de León,
        verificamos cada par, y traemos solo los que valen la pena al catálogo.
      </p>

      <h2>Por qué León</h2>
      <p>
        León, Guanajuato es la capital mundial del cuero desde hace{" "}
        <strong>380 años</strong>. Aquí se hacen 7 de cada 10 botas
        mexicanas. Aquí están los talleres con tres generaciones de
        experiencia, los curtidores que conocen cada tipo de piel, y los
        artesanos que cosen a mano cuando el modelo lo amerita.
      </p>
      <p>
        Nosotros nacimos aquí, vivimos aquí, conocemos a la gente que hace las
        botas. Esa relación directa es lo que nos permite garantizar calidad
        sin intermediarios.
      </p>

      <h2>Cómo seleccionamos</h2>
      <p>Cada producto pasa por tres filtros antes de entrar al catálogo:</p>
      <ol>
        <li>
          <strong>Origen verificado:</strong> conocemos al taller, vemos cómo
          trabaja, sabemos de dónde viene su piel.
        </li>
        <li>
          <strong>Calidad de construcción:</strong> revisamos costuras, suela,
          horma, terminados. Si algo no convence, no entra.
        </li>
        <li>
          <strong>Coherencia con la marca:</strong> que sea bota que
          recomendaríamos a nuestra familia, no solo a un cliente.
        </li>
      </ol>

      <h2>Nuestra promesa</h2>
      <ul>
        <li>Si la bota es vaquera, es hecha en León</li>
        <li>Si decimos cuero, es cuero (no PU ni sintético)</li>
        <li>Si decimos exótica, viene con su certificado CITES</li>
        <li>Si no te queda, te la cambiamos</li>
        <li>Si tiene defecto, te la reponemos</li>
      </ul>

      <h2>Hablemos</h2>
      <p>
        ¿Tienes preguntas sobre cuero, sobre alguna bota, sobre cuál pedir?
        Escríbenos a contacto@botasleon.com — respondemos rápido y sin guion.
      </p>
    </ContentPage>
  )
}

export const metadata = pageMetadata({
  path: "/nosotros",
  title: "Nosotros",
  description:
    "380 años de tradición artesanal en León, Guanajuato — curaduría de talleres y compromiso con el cuero.",
})
