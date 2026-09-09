"use client"

import Image from "next/image"
import { LocalizedLink as Link } from "@/components/LocalizedLink"
import { useT } from "@/lib/i18n/context"
import { primerValor } from "@/lib/shopify/facets"
import { admiteCambioDeTalla } from "@/lib/exchange"
import { ENVIO_GRATIS_SIEMPRE } from "@/lib/shipping-policy"
import { ProductDescriptionBody } from "./LocalizedProductContent"
import type { Brand, Product } from "@/lib/shopify/types"

/**
 * Los cuatro acordeones de la ficha: Descripción, Detalles, El taller y
 * Envíos y cambios.
 *
 * Van con <details>/<summary> nativos, no con estado de React: abrir y cerrar
 * lo hace el navegador, funciona antes de que hidrate, lo entiende el teclado
 * y Cmd+F del navegador puede encontrar texto dentro (con `open` heredado del
 * marcado). El único JavaScript aquí es el idioma.
 *
 * "Detalles", NO "Detalles y medidas": altura de caña, tacón, vira y peso no
 * existen en NINGUNO de los 103 productos de Shopify (comprobado contra la
 * Storefront API). Se pinta lo que sí hay —horma, piel, estilo, color y tipo—
 * y las filas que lleguen vacías simplemente no salen.
 */
export function PDPAcordeones({
  product,
  brand,
}: {
  product: Product
  brand?: Brand | null
}) {
  const t = useT()

  // Horma, piel, estilo y color viven en metacampos de taxonomía de Shopify.
  // Cobertura real: horma 98/103, piel 98/103, estilo 93/103, color 103/103,
  // así que cada fila se decide por separado.
  const filas: Array<{ etiqueta: string; valor: string }> = []
  const agregar = (etiqueta: string, valor?: string | null) => {
    if (valor && valor.trim()) filas.push({ etiqueta, valor: valor.trim() })
  }
  agregar(t("pdp.detailToe"), primerValor(product.toeStyle)?.label)
  agregar(t("pdp.detailLeather"), primerValor(product.material)?.label)
  agregar(t("pdp.detailStyle"), primerValor(product.bootStyle)?.label)
  agregar(t("pdp.detailColor"), primerValor(product.color)?.label)
  agregar(t("product.type"), product.productType)

  const cambioDeTalla = admiteCambioDeTalla(product.tags)

  return (
    <div className="mt-10 border-t border-border">
      {/* El signo va por CSS y no por estado: así el +/− ya es correcto en el
          primer pintado del servidor, sin esperar a la hidratación. */}
      <style>{`.acc-signo::after{content:"+"}details[open]>summary .acc-signo::after{content:"−"}`}</style>

      <Acordeon titulo={t("product.description")} abierto>
        <ProductDescriptionBody
          handle={product.handle}
          fallbackHtml={product.descriptionHtml ?? ""}
        />
      </Acordeon>

      <Acordeon titulo={t("pdp.acc.details")}>
        {filas.length > 0 && (
          <dl className="cuerpo grid grid-cols-[auto_1fr] gap-x-6 gap-y-2">
            {filas.map((f) => (
              <div key={f.etiqueta} className="contents">
                <dt className="text-text-muted">{f.etiqueta}</dt>
                <dd className="text-text">{f.valor}</dd>
              </div>
            ))}
          </dl>
        )}
        {/* Los dos mensajes que valían la pena de los cuatro íconos genéricos
            que había bajo el botón. Aquí sí son un detalle del producto; ahí
            arriba eran relleno repetido en las 103 fichas. */}
        <ul className="cuerpo mt-4 space-y-1 text-text-muted">
          <li>{t("trust.leather100")}</li>
          <li>{t("trust.madeInLeon")}</li>
        </ul>
      </Acordeon>

      {/* Sin metaobjeto de marca no hay nada que contar: dos vendors del
          catálogo (Armenta y Botas León) no lo tienen, y una fila vacía es
          peor que ninguna fila. */}
      {brand && (
        <Acordeon titulo={t("pdp.acc.workshop")}>
          <div className="flex items-start gap-4">
            {brand.logo && (
              <span className="logos-talleres shrink-0">
                <Image
                  src={brand.logo.url}
                  alt={brand.logo.altText || brand.name}
                  width={brand.logo.width || 80}
                  height={brand.logo.height || 40}
                />
              </span>
            )}
            <div>
              {brand.tagline && (
                <p className="cuerpo medida-lectura text-text-muted">
                  {brand.tagline}
                </p>
              )}
              <Link
                href={`/marcas/${brand.handle}`}
                className="cuerpo mt-3 inline-block text-leather underline underline-offset-4 transition-colors duration-[180ms] hover:text-text"
              >
                {t("pdp.seeAllFrom").replace("{marca}", brand.name)}
              </Link>
            </div>
          </div>
        </Acordeon>
      )}

      <Acordeon titulo={t("pdp.acc.shipping")}>
        <ul className="cuerpo space-y-2 text-text-muted">
          {/* Por MERCADO, nunca por idioma: botasleon.com/es vende a Estados
              Unidos y ahí el envío gratis sería una promesa falsa. */}
          <li>{t(ENVIO_GRATIS_SIEMPRE ? "promesa.envioMx" : "promesa.envioUs")}</li>
          {cambioDeTalla && (
            <li>
              {t("promesa.cambio")}{" "}
              <span className="nota">{t("promesa.cambioNota")}</span>
            </li>
          )}
        </ul>
        <div className="cuerpo mt-3 flex flex-wrap gap-x-6 gap-y-1">
          <Link
            href="/envios"
            className="text-leather underline underline-offset-4 transition-colors duration-[180ms] hover:text-text"
          >
            {t("help.shipping")}
          </Link>
          <Link
            href="/devoluciones"
            className="text-leather underline underline-offset-4 transition-colors duration-[180ms] hover:text-text"
          >
            {t("help.returns")}
          </Link>
        </div>
      </Acordeon>
    </div>
  )
}

function Acordeon({
  titulo,
  abierto = false,
  children,
}: {
  titulo: string
  abierto?: boolean
  children: React.ReactNode
}) {
  return (
    <details open={abierto} className="group">
      <summary className="acordeon-fila cursor-pointer list-none [&::-webkit-details-marker]:hidden">
        <span>{titulo}</span>
        <span className="acc-signo text-text-muted" aria-hidden="true" />
      </summary>
      <div className="border-b border-border pb-6 pt-4">{children}</div>
    </details>
  )
}
