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

  // ── Encabezados de categoría ─────────────────────────────────────────
  "cat.women.eyebrow": { es: "Mujer", en: "Women" },
  "cat.women.title": { es: "Botas para mujer", en: "Women's Boots" },
  "cat.women.desc": {
    es: "Vaqueras, clásicas, largas y de fashion en cuero auténtico. Tradición artesanal mexicana con silueta contemporánea.",
    en: "Cowboy, classic, tall and fashion boots in genuine leather. Mexican artisan tradition with a contemporary silhouette.",
  },
  "cat.men.eyebrow": { es: "Hombre", en: "Men" },
  "cat.men.title": { es: "Botas para hombre", en: "Men's Boots" },
  "cat.men.desc": {
    es: "Vaqueras, clásicas y botas de rancho hechas en León. Cada par seleccionado por su construcción, ajuste y durabilidad.",
    en: "Cowboy, classic and ranch boots handmade in León. Every pair chosen for its construction, fit and durability.",
  },
  "cat.kids.eyebrow": { es: "Niños", en: "Kids" },
  "cat.kids.title": { es: "Botas para niños", en: "Kids' Boots" },
  "cat.kids.desc": {
    es: "Vaqueras y clásicas miniatura, mismas marcas y misma construcción que las de adulto. Para los pies que más crecen.",
    en: "Miniature cowboy and classic boots — same brands and build as the grown-up pairs. For the feet that grow the fastest.",
  },

  // ── Filtros (listado) ────────────────────────────────────────────────
  "filters.title": { es: "Filtros", en: "Filters" },
  "filters.close": { es: "Cerrar filtros", en: "Close filters" },
  "filters.clear": { es: "Limpiar", en: "Clear" },
  "filters.clearAll": { es: "Limpiar filtros", en: "Clear filters" },
  "filters.size": { es: "Talla", en: "Size" },
  "filters.brand": { es: "Marca", en: "Brand" },
  "filters.style": { es: "Estilo", en: "Style" },
  "filters.color": { es: "Color", en: "Color" },
  "filters.material": { es: "Material", en: "Material" },
  "filters.availability": { es: "Disponibilidad", en: "Availability" },
  "filters.inStock": { es: "Solo en stock", en: "In stock only" },
  "filters.show": { es: "Ver", en: "Show" },

  // ── Listado (toolbar / estados) ──────────────────────────────────────
  "listing.product": { es: "producto", en: "product" },
  "listing.products": { es: "productos", en: "products" },
  "listing.of": { es: "de", en: "of" },
  "listing.sort": { es: "Ordenar", en: "Sort" },
  "listing.sortBy": { es: "Ordenar productos por", en: "Sort products by" },
  "listing.noResults": { es: "Sin resultados", en: "No results" },
  "listing.noResultsDesc": {
    es: "Ningún producto coincide con los filtros aplicados.",
    en: "No products match the selected filters.",
  },
  "listing.emptyTitle": { es: "Catálogo en construcción", en: "Catalog under construction" },
  "listing.emptyDesc": {
    es: "Estamos cargando las primeras botas de los talleres de León.",
    en: "We're loading the first boots from León's workshops.",
  },
  "listing.loadMore": { es: "Cargar más productos", en: "Load more products" },
  "listing.loading": { es: "Cargando…", en: "Loading…" },
  "listing.clearToSeeMore": {
    es: "Limpia los filtros para ver más productos.",
    en: "Clear the filters to see more products.",
  },
  "sort.bestselling": { es: "Más vendidos", en: "Best selling" },
  "sort.newest": { es: "Más recientes", en: "Newest" },
  "sort.priceAsc": { es: "Precio: menor a mayor", en: "Price: low to high" },
  "sort.priceDesc": { es: "Precio: mayor a menor", en: "Price: high to low" },
  "sort.nameAz": { es: "Nombre: A → Z", en: "Name: A → Z" },

  // ── Precio (MSI) ─────────────────────────────────────────────────────
  "price.from": { es: "Desde", en: "From" },
  "price.perMonth": { es: "al mes", en: "/mo" },
  "price.msiPdp": {
    es: "a {n} meses sin intereses · bancos participantes",
    en: "{n} months interest-free · participating banks",
  },
  "price.msiShort": { es: "{n} MSI", en: "{n} MSI" },

  // ── Tarjeta de producto ──────────────────────────────────────────────
  "card.view": { es: "Ver", en: "View" },
  "card.soldOutParen": { es: "(agotado)", en: "(sold out)" },
  "card.soldOut": { es: "Agotado", en: "Sold out" },

  // ── Página de producto ───────────────────────────────────────────────
  "product.description": { es: "Descripción", en: "Description" },
  "product.type": { es: "Tipo", en: "Type" },

  // ── Cintillo (MarqueeBar) ────────────────────────────────────────────
  // OJO: en inglés (mercado USA) NO se promete envío gratis ni MSI —
  // esos son beneficios solo de México. La versión EN usa otros mensajes.
  "marquee.tradition": { es: "380 años de tradición", en: "380 years of tradition" },
  "marquee.leather": {
    es: "León, capital mundial del cuero",
    en: "León, the world capital of leather",
  },
  "marquee.shipping": {
    es: "Envío GRATIS a partir de {threshold}",
    en: "Shipped to your door across the USA",
  },
  "marquee.msi": {
    es: "3, 6 y 9 meses sin intereses",
    en: "Handcrafted in León, Mexico",
  },
  "marquee.store": { es: "Tienda física en León →", en: "Visit our store in León →" },
  "marquee.newsletter": {
    es: "Suscríbete y recibe ofertas antes que nadie →",
    en: "Subscribe for early access to deals →",
  },

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
