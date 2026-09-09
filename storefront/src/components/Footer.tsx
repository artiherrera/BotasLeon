"use client"

import Image from "next/image"
import { LocalizedLink as Link } from "@/components/LocalizedLink"
import { EnlaceOtroMercado } from "./EnlaceOtroMercado"
import { PaymentBadges } from "./PaymentBadges"
import { SocialIcons } from "./SocialIcons"
import { whatsappHref } from "@/lib/whatsapp"
import { useLocale } from "@/lib/i18n/context"
import { isMX } from "@/lib/market"

/**
 * Pie del storefront. Cuatro columnas + barra inferior.
 *
 * Va sobre PLATO con texto tinta. Antes era una banda oscura, la segunda del
 * sitio: ahora la única superficie oscura es la de cifras de la portada, y el
 * pie cierra con la misma superficie cálida en la que se apoyan las fotos.
 * Ojo con text-bg aquí: sobre plato es prácticamente invisible.
 *
 * Client component para traducir la interfaz (ES/EN) con useT. Los datos
 * factuales (dirección, WhatsApp, correo) NO se traducen.
 */

// Los enlaces de columna comparten estilo: cuerpo de 15px y subrayado al pasar
// el cursor, sin gastar el acento cuero, que tiene sus cuatro usos.
const ENLACE = "cuerpo text-text underline-offset-4 hover:underline"

export function Footer() {
  const { locale, t } = useLocale()
  // El catálogo trae los precios horneados: pertenece al MERCADO y no al
  // idioma. Mismo criterio que CatalogButton.tsx.
  // El visor HTML, no el PDF a pelo: Chrome en Android y los navegadores
  // dentro de Instagram y Facebook DESCARGAN un .pdf en vez de abrirlo, y de
  // ahí no se vuelve a la tienda. Va por MERCADO y no por idioma porque el
  // catálogo trae los precios horneados: el de México está en pesos.
  const catalogoPdf = isMX ? "/catalogo-es.html" : "/catalogo-en.html"

  return (
    <footer className="mt-24 bg-plate text-text">
      <div className="contenedor py-16 grid grid-cols-2 md:grid-cols-4 gap-10">
        <div className="col-span-2 md:col-span-1">
          <Link
            href="/"
            aria-label={t("a11y.home")}
            className="inline-block mb-3 transition-opacity duration-[180ms] hover:opacity-80"
          >
            <Image
              src="/logo_botasleon.png"
              alt="BotasLeón"
              width={800}
              height={220}
              className="h-10 md:h-12 w-auto"
            />
          </Link>
          <p className="cuerpo text-text-muted max-w-xs">
            {t("footer.blurb")}
          </p>

          {/* Datos de contacto visibles — transparencia de negocio (requisito
              anti-"Misrepresentation" de Google Merchant + confianza). */}
          <address className="mt-5 not-italic cuerpo text-text-muted space-y-1.5">
            <p>
              Blvd. Hilario Medina 407, 2º piso
              <br />
              Col. Josefina, 37260 León, Gto., México
            </p>
            <p>
              <a
                href={whatsappHref(locale)}
                target="_blank"
                rel="noopener noreferrer"
                className="underline-offset-4 hover:text-text hover:underline"
              >
                WhatsApp: +52 479 303 2457
              </a>
            </p>
            <p>
              <a
                href="mailto:contacto@botasleon.com"
                className="underline-offset-4 hover:text-text hover:underline"
              >
                contacto@botasleon.com
              </a>
            </p>
          </address>

          {/* Redes sociales — heredan el color del pie */}
          <div className="mt-5 text-text-muted">
            <SocialIcons size="md" />
          </div>
        </div>

        <div>
          <h4 className="eyebrow text-text-muted mb-4">{t("footer.shop")}</h4>
          <ul className="space-y-2.5">
            <li><Link href="/hombre" className={ENLACE}>{t("nav.men")}</Link></li>
            <li><Link href="/mujer" className={ENLACE}>{t("nav.women")}</Link></li>
            <li><Link href="/marcas" className={ENLACE}>{t("nav.brands")}</Link></li>
            <li><Link href="/outlet" className={ENLACE}>{t("nav.outlet")}</Link></li>
            {/* El catálogo salió de la barra de la cabecera para hacerle sitio
                al buscador; ésta es su puerta en escritorio. Va al PDF, no al
                visor HTML, porque aquí lo que se ofrece es descargarlo. */}
            <li>
              <a
                href={catalogoPdf}
                target="_blank"
                rel="noopener noreferrer"
                className={ENLACE}
              >
                {t("footer.catalogDownload")}
              </a>
            </li>
            {/* Accesorios oculto hasta que haya productos dados de alta. Re-enable en sync con MegaMenu/CategoryShowcase. */}
          </ul>
        </div>

        <div>
          <h4 className="eyebrow text-text-muted mb-4">{t("nav.help")}</h4>
          <ul className="space-y-2.5">
            <li><Link href="/envios" className={ENLACE}>{t("help.shipping")}</Link></li>
            <li><Link href="/devoluciones" className={ENLACE}>{t("help.returns")}</Link></li>
            <li><Link href="/guia-tallas" className={ENLACE}>{t("help.sizeGuide")}</Link></li>
            <li><Link href="/contacto" className={ENLACE}>{t("help.contact")}</Link></li>
            <li><Link href="/visitanos" className={ENLACE}>{t("nav.visit")}</Link></li>
            <li><Link href="/faq" className={ENLACE}>{t("help.faq")}</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="eyebrow text-text-muted mb-4">{t("nav.company")}</h4>
          <ul className="space-y-2.5">
            <li><Link href="/nosotros" className={ENLACE}>{t("company.about")}</Link></li>
            <li><Link href="/proveedores" className={ENLACE}>{t("company.suppliers")}</Link></li>
            <li><Link href="/terminos" className={ENLACE}>{t("company.terms")}</Link></li>
            <li><Link href="/privacidad" className={ENLACE}>{t("company.privacy")}</Link></li>
          </ul>
        </div>
      </div>

      {/* La línea normal (--color-border) sobre plato da 1.13:1 y no se ve:
          los divisores de esta superficie usan border-border-plate. */}
      <div className="border-t border-border-plate">
        {/* PaymentBadges en su propio row centrado. El texto "Procesado
            por Shopify" ya vive dentro del componente — no duplicar. */}
        <div className="contenedor pt-6 pb-4 flex justify-center">
          <PaymentBadges />
        </div>
      </div>

      <div className="border-t border-border-plate">
        <div className="contenedor py-6 flex flex-col sm:flex-row items-center justify-between gap-3 nota">
          <p>© {new Date().getFullYear()} BotasLeón · León, Guanajuato, México.</p>
          {/* Solo aparece en la .mx: la vuelta al sitio en dólares. */}
          <EnlaceOtroMercado className="text-text-muted" />
          <p>{t("footer.madeIn")}</p>
        </div>
      </div>
    </footer>
  )
}
