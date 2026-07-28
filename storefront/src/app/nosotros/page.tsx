import { ContentPage } from "@/components/ContentPage"
import { Localized } from "@/components/Localized"
import { pageMetadata } from "@/lib/seo"

export default function NosotrosPage() {
  return (
    <ContentPage
      eyebrow="page.nosotros.eyebrow"
      title="page.nosotros.title"
      intro="page.nosotros.intro"
    >
      <Localized
        es={
          <>
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
          </>
        }
        en={
          <>
            <h2>Who we are</h2>
            <p>
              BotasLeón is a multi-brand curator of Mexican boots. We're not
              manufacturers — we're curators. We walk the workshops of León, inspect
              every pair, and bring only the ones worth it into the catalog.
            </p>

            <h2>Why León</h2>
            <p>
              León, Guanajuato has been the world capital of leather for{" "}
              <strong>380 years</strong>. Seven of every ten Mexican boots are made
              here. This is home to workshops with three generations of experience,
              tanners who know every kind of hide, and artisans who stitch by hand
              when the model calls for it.
            </p>
            <p>
              We were born here, we live here, we know the people who make the boots.
              That direct relationship is what lets us guarantee quality with no
              middlemen.
            </p>

            <h2>How we select</h2>
            <p>Every product passes through three filters before it enters the catalog:</p>
            <ol>
              <li>
                <strong>Verified origin:</strong> we know the workshop, we see how it
                works, we know where its leather comes from.
              </li>
              <li>
                <strong>Build quality:</strong> we check the stitching, sole, last,
                and finish. If something isn't convincing, it doesn't make the cut.
              </li>
              <li>
                <strong>True to the brand:</strong> a boot we'd recommend to our own
                family, not just to a customer.
              </li>
            </ol>

            <h2>Our promise</h2>
            <ul>
              <li>If it's a cowboy boot, it's made in León</li>
              <li>If we say leather, it's leather (no PU, no synthetic)</li>
              <li>If we say exotic, it comes with its CITES certificate</li>
              <li>If it doesn't fit, we'll exchange it</li>
              <li>If it's defective, we'll replace it</li>
            </ul>

            <h2>Let's talk</h2>
            <p>
              Have questions about leather, about a particular boot, about which one
              to order? Write to us at contacto@botasleon.com — we reply fast, and
              without a script.
            </p>
          </>
        }
      />
    </ContentPage>
  )
}

export const metadata = pageMetadata({
  path: "/nosotros",
  title: "Nosotros",
  description:
    "380 años de tradición artesanal en León, Guanajuato — curaduría de talleres y compromiso con el cuero.",
})
