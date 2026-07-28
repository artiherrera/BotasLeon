import type { Locale } from "./config"

/**
 * Diccionario de la interfaz (ES/EN). Una entrada por cadena visible del "chrome"
 * del sitio (menús, botones, footer, textos de confianza...). Los NOMBRES de las
 * botas NO viven aquí — son modelos/marca y no se traducen; sus descripciones se
 * manejan en Shopify (Translate & Adapt) en la Fase 2.
 *
 * Convención de llaves: namespace por punto (nav.*, footer.*, a11y.*). Para
 * agregar una cadena nueva: añade su llave aquí con {es, en} y úsala con t("llave").
 */
type Entry = Record<Locale, string>

export const DICTIONARY: Record<string, Entry> = {
  // ── Navegación principal ──────────────────────────────────────────────
  "nav.men": { es: "Hombre", en: "Men" },
  "nav.women": { es: "Mujer", en: "Women" },
  "nav.brands": { es: "Marcas", en: "Brands" },
  "nav.outlet": { es: "Outlet", en: "Outlet" },
  "nav.visit": { es: "Visítanos", en: "Visit Us" },
  "nav.byStyle": { es: "Por estilo", en: "By style" },

  // Estilos (sub-categorías) + su descripción corta
  "style.western": { es: "Vaqueras", en: "Cowboy" },
  "style.western.desc": { es: "Caña alta, silueta tradicional", en: "Tall shaft, traditional silhouette" },
  "style.booties": { es: "Botines", en: "Ankle boots" },
  "style.booties.desc": { es: "Caña corta, tobillera", en: "Short shaft, ankle height" },
  "style.classic": { es: "Clásicas", en: "Classic" },
  "style.classic.desc": { es: "Caña media, lisas, sin grabado", en: "Mid shaft, smooth, no tooling" },
  "style.ranch": { es: "Rancho", en: "Ranch" },
  "style.ranch.desc": { es: "Faena y campo", en: "Work & field" },
  "style.exotic": { es: "Exóticas", en: "Exotic" },
  "style.exotic.desc": { es: "Avestruz, cocodrilo, pitón", en: "Ostrich, crocodile, python" },
  "style.tall": { es: "Largas", en: "Tall" },
  "style.tall.desc": { es: "Sobre la rodilla, fashion", en: "Over-the-knee, fashion" },

  // CTAs del menú
  "nav.cta.men": { es: "Ver todas las botas de hombre", en: "Shop all men's boots" },
  "nav.cta.women": { es: "Ver todas las botas de mujer", en: "Shop all women's boots" },
  "nav.brands.all": { es: "Ver todas las marcas", en: "See all brands" },
  "nav.brands.desc": {
    es: "Casas de calzado de León que comercializamos",
    en: "León bootmakers we carry",
  },
  "nav.seeAll": { es: "Ver todo", en: "See all" },
  "nav.explore": { es: "Explorar", en: "Explore" },

  // Banda de propuesta de valor (menú móvil)
  "promo.msi": { es: "3, 6 y 9 meses sin intereses", en: "3, 6 & 9 months interest-free" },
  "promo.shipping": { es: "Envío a todo MX y USA", en: "Shipping across MX & USA" },

  // Secciones de ayuda / empresa
  "nav.help": { es: "Ayuda", en: "Help" },
  "nav.company": { es: "Empresa", en: "Company" },
  "help.sizeGuide": { es: "Guía de tallas", en: "Size guide" },
  "help.shipping": { es: "Envíos", en: "Shipping" },
  "help.returns": { es: "Devoluciones", en: "Returns" },
  "help.faq": { es: "Preguntas frecuentes", en: "FAQ" },
  "help.contact": { es: "Contacto", en: "Contact" },
  "company.about": { es: "Nosotros", en: "About us" },
  "company.suppliers": { es: "Proveedores", en: "Suppliers" },
  "company.terms": { es: "Términos", en: "Terms" },
  "company.privacy": { es: "Privacidad", en: "Privacy" },

  // ── Página de producto ───────────────────────────────────────────────
  "product.description": { es: "Descripción", en: "Description" },
  "product.type": { es: "Tipo", en: "Type" },

  // ── Footer ────────────────────────────────────────────────────────────
  "footer.shop": { es: "Tienda", en: "Shop" },
  "footer.blurb": {
    es: "Botas premium fabricadas en León, Guanajuato. Tradición artesanal mexicana en cada par.",
    en: "Premium boots handcrafted in León, Guanajuato. Mexican artisan tradition in every pair.",
  },
  "footer.madeIn": { es: "Hecho con orgullo en México.", en: "Proudly made in Mexico." },
  "brand.taglineShort": {
    es: "380 años de tradición · León, Gto.",
    en: "380 years of tradition · León, Gto.",
  },

  // ── Accesibilidad / labels de íconos ─────────────────────────────────
  "a11y.home": { es: "BotasLeón — Inicio", en: "BotasLeón — Home" },
  "a11y.search": { es: "Buscar", en: "Search" },
  "a11y.account": { es: "Mi cuenta", en: "My account" },
  "a11y.cart": { es: "Carrito", en: "Cart" },
  "a11y.openMenu": { es: "Abrir menú", en: "Open menu" },
  "a11y.closeMenu": { es: "Cerrar menú", en: "Close menu" },
  "a11y.nav": { es: "Navegación", en: "Navigation" },
  "a11y.language": { es: "Idioma", en: "Language" },
}
