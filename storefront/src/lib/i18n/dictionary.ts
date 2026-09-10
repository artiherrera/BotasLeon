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
  // ── Recuperadas del barrido i18n (se perdieron en edición paralela) ──
  "pay.methodsLabel": { es: "Métodos de pago aceptados", en: "Accepted payment methods" },
  "pay.secureNote": { es: "Pago 100% seguro · Procesado por Shopify", en: "100% secure checkout · Processed by Shopify" },
  "pdp.actionsLabel": { es: "Acciones del producto", en: "Product actions" },
  "pdp.add": { es: "Agregar", en: "Add" },
  "pdp.addToCart": { es: "Agregar al carrito", en: "Add to cart" },
  "pdp.adding": { es: "Agregando…", en: "Adding…" },
  // "Comprar ahora" — checkout directo, tipo Amazon. Ver CartProvider.buyNow.
  "pdp.buyNow": { es: "Comprar ahora", en: "Buy now" },
  "pdp.buying": { es: "Llevándote al pago…", en: "Taking you to checkout…" },
  // Confirmación instantánea en el botón, antes de que Shopify conteste.
  "pdp.added": { es: "✓ Agregado", en: "✓ Added" },
  // Cajón: franja que dice que funcionó, y una salida que no sea la X.
  "cart.addedBanner": { es: "Listo, ya está en tu carrito:", en: "Done, it's in your cart:" },
  "cart.keepShopping": { es: "Seguir comprando", en: "Keep shopping" },
  "pdp.available": { es: "Disponible", en: "In stock" },
  "pdp.chooseSize": { es: "Elige talla", en: "Choose size" },
  "pdp.comboUnavailable": { es: "Combinación no disponible", en: "Combination unavailable" },
  "pdp.selectSize": { es: "Selecciona tu talla", en: "Select your size" },
  "pdp.shippingNote": { es: "Envío a todo Estados Unidos", en: "Ships anywhere in the USA" },
  // Variante de México (se elige con isMX en el componente). Estos textos se
  // escribieron cuando solo existía el sitio en dólares y quedaron fijos al
  // pasar a dos mercados: la ficha de botasleon.mx prometía envío a EE.UU.
  "pdp.shippingNoteMx": { es: "Envío gratis a toda la República", en: "Free shipping across Mexico" },
  "pdp.sizeError": { es: "Por favor selecciona tu talla.", en: "Please select your size." },
  "pdp.unavailable": { es: "No disponible", en: "Unavailable" },
  "recent.eyebrow": { es: "Visto recientemente", en: "Recently viewed" },
  "recent.title": { es: "Sigue donde te quedaste", en: "Pick up where you left off" },
  "trust.exchange30": { es: "Garantía 15 días", en: "15-day warranty" },

  // Cambio de talla en modelos seleccionados (solo México — ver lib/exchange.ts).
  // El plazo exacto NO se repite aquí: vive solo en /devoluciones, para que no
  // haya dos números que puedan quedar desfasados.
  "exchange.badge.title": { es: "Cambio de talla gratis", en: "Free size exchange" },
  "exchange.badge.sub": {
    es: "Si no es tu talla, la cambiamos. Nosotros cubrimos los dos envíos.",
    en: "Wrong size? We swap it and cover both shipments.",
  },
  "exchange.badge.link": { es: "Ver condiciones", en: "See terms" },

  // Meses sin intereses — solo México (ver lib/msi.ts). El NÚMERO de meses no
  // vive aquí sino en MESES_MSI, para no tener dos cifras que puedan
  // desfasarse de lo que el checkout cobra de verdad.
  "msi.of": { es: "meses sin intereses de", en: "interest-free payments of" },
  "trust.leather100": { es: "Cuero 100%", en: "100% leather" },
  "trust.madeInLeon": { es: "Hecho en León", en: "Made in León" },
  "trust.securePayment": { es: "Pago seguro", en: "Secure payment" },
  "trust.workshop": { es: "Taller", en: "Made by" },

  // ── Secciones server (CategoryShowcase / BrandGrid / RelatedProducts) ──
  "category.shopBy": { es: "Compra por categoría", en: "Shop by category" },
  "category.findYourPair": { es: "Encuentra tu par", en: "Find your pair" },
  "brand.eyebrow": { es: "Marcas que comercializamos", en: "Brands we carry" },
  "brand.headline": {
    es: "Las mejores casas de León,\nbajo un mismo techo.",
    en: "The finest houses of León,\nunder one roof.",
  },
  "brand.subtitle": {
    es: "Trabajamos directamente con los talleres más respetados de la capital mundial del cuero. Cada marca pasa nuestro filtro.",
    en: "We work directly with the most respected workshops in the world capital of leather. Every brand meets our standard.",
  },
  "related.eyebrow": { es: "Te puede interesar", en: "You may also like" },
  "related.moreBoots": { es: "Más botas", en: "More boots" },
  "related.moreAccessories": { es: "Más accesorios", en: "More accessories" },
  "related.alsoLike": { es: "También te puede gustar", en: "You might also like" },
  "accessories.eyebrow": { es: "Accesorios", en: "Accessories" },
  "accessories.title": { es: "Para complementar tu vestir", en: "To complete your look" },
  "accessories.viewAll": { es: "Ver todos", en: "View all" },
  "accessories.viewAllLong": { es: "Ver todos los accesorios", en: "View all accessories" },

  // ── Páginas de contenido / ayuda (encabezados) ──────────────────────
  "page.envios.eyebrow": { es: "Información", en: "Information" },
  "page.envios.title": { es: "Envíos", en: "Shipping" },
  "page.envios.intro": { es: "Cómo llegan tus botas a tu puerta, con qué tiempos y costos.", en: "How your boots reach your door — delivery times and shipping details." },
  "page.devoluciones.eyebrow": { es: "Información", en: "Information" },
  "page.devoluciones.title": { es: "Cambios, devoluciones y garantías", en: "Exchanges & returns" },
  "page.devoluciones.intro": { es: "Política de envíos, cambios, devoluciones y garantías de Botas León.", en: "Our size-exchange and return policy, step by step." },
  "page.guiaTallas.eyebrow": { es: "Información", en: "Information" },
  "page.guiaTallas.title": { es: "Guía de tallas", en: "Size Guide" },
  "page.guiaTallas.intro": { es: "Cómo encontrar tu talla exacta en cualquiera de las escalas que manejamos.", en: "How to find your exact size in any of the scales we use." },
  "page.nosotros.eyebrow": { es: "Empresa", en: "Company" },
  "page.nosotros.title": { es: "Nosotros", en: "About us" },
  "page.nosotros.intro": { es: "Curamos las mejores botas hechas en León para llevarlas directo a tu puerta.", en: "We curate the finest boots made in León and bring them straight to your door." },
  "page.contacto.eyebrow": { es: "Información", en: "Information" },
  "page.contacto.title": { es: "Contacto", en: "Contact" },
  "page.contacto.intro": { es: "Estamos para resolver dudas, asesorarte en tallas o ayudarte con tu pedido.", en: "We're here to answer questions, help with sizing, or assist with your order." },
  "page.terminos.eyebrow": { es: "Legal", en: "Legal" },
  "page.terminos.title": { es: "Términos y condiciones", en: "Terms and Conditions" },
  "page.terminos.intro": { es: "Al usar BotasLeón aceptas estos términos. Última actualización: mayo 2026.", en: "By using BotasLeón you accept these terms. Last updated: May 2026." },
  "page.privacidad.eyebrow": { es: "Legal", en: "Legal" },
  "page.privacidad.title": { es: "Aviso de privacidad", en: "Privacy Notice" },
  "page.privacidad.intro": { es: "Cómo recopilamos, usamos y protegemos tus datos personales. Última actualización: mayo 2026.", en: "How we collect, use, and protect your personal data. Last updated: May 2026." },
  "page.proveedores.eyebrow": { es: "Empresa", en: "Company" },
  "page.proveedores.title": { es: "Para marcas y proveedores", en: "For brands and suppliers" },
  "page.proveedores.intro": { es: "Si tu casa de calzado quiere distribuirse en BotasLeón, esto es lo que ofrecemos y lo que pedimos.", en: "If your footwear house wants to be distributed through BotasLeón, here's what we offer and what we ask for." },
  "page.visitanos.eyebrow": { es: "Visítanos", en: "Visit Us" },
  "page.visitanos.heroTitle": { es: "Te esperamos en nuestra tienda en León", en: "Come visit us at our León store" },
  "page.visitanos.findUs": { es: "Cómo encontrarnos", en: "How to find us" },
  "page.visitanos.labelAddress": { es: "Dirección", en: "Address" },
  "page.visitanos.labelHours": { es: "Horario", en: "Hours" },
  "page.visitanos.labelContact": { es: "Contacto", en: "Contact" },
  "page.visitanos.ctaDirections": { es: "Cómo llegar", en: "Get directions" },
  "page.visitanos.ctaSchedule": { es: "Agenda tu visita", en: "Schedule your visit" },
  "page.visitanos.insideTitle": { es: "Conócenos por dentro", en: "Take a look inside" },
  "page.faq.eyebrow": { es: "Información", en: "Information" },
  "page.faq.title": { es: "Preguntas frecuentes", en: "Frequently asked questions" },
  "page.faq.intro": { es: "Lo que más nos preguntan, en un solo lugar.", en: "The questions we hear most, all in one place." },
  "faq.home.eyebrow": { es: "Antes de comprar", en: "Before you buy" },
  "faq.home.title": { es: "Preguntas frecuentes", en: "Frequently asked questions" },
  "faq.home.notFound": { es: "¿Tu duda no está aquí?", en: "Can't find your question?" },
  "faq.home.writeUs": { es: "Escríbenos", en: "Write to us" },

  // ── Navegación principal ──────────────────────────────────────────────
  "nav.men": { es: "Hombre", en: "Men" },
  "nav.women": { es: "Mujer", en: "Women" },
  "nav.accessories": { es: "Accesorios", en: "Accessories" },
  "nav.belts": { es: "Cinturones", en: "Belts" },
  "nav.belts.desc": {
    es: "Piel de res labrada, hebilla de latón. Tallas en pulgadas.",
    en: "Tooled cowhide with brass buckle. Sizes in inches.",
  },
  "nav.cta.accessories": { es: "Ver todos los accesorios", en: "Shop all accessories" },
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
  "promo.shipping": { es: "Envío a todo Estados Unidos", en: "Shipping across the USA" },
  "promo.shippingMx": { es: "Envío gratis a toda la República", en: "Free shipping across Mexico" },

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

  // ── Hero (home) ──────────────────────────────────────────────────────
  "hero.eyebrow": {
    es: "León, Guanajuato · Desde 1950",
    en: "León, Guanajuato · Since 1950",
  },
  "hero.title": {
    es: "El western\ntambién se\nviste en la ciudad.",
    en: "The West\nalso belongs\nin the city.",
  },
  "hero.subtitle": {
    es: "Botas premium fabricadas a mano en León. Tradición artesanal mexicana con calidad de exportación. Envíos a todo Estados Unidos.",
    en: "Premium boots handcrafted in León. Mexican artisan tradition with export-grade quality. Shipped across the USA.",
  },
  "hero.ctaCollection": { es: "Ver colección", en: "Shop the collection" },
  "hero.ctaBrands": { es: "Nuestras marcas", en: "Our brands" },
  // Slides placeholder del carrusel (fallback cuando Shopify no tiene metaobjects)
  "hero.slide1.eyebrow": { es: "Colección · Otoño", en: "Collection · Fall" },
  "hero.slide1.title": { es: "Hecho en León.", en: "Made in León." },
  "hero.slide2.eyebrow": { es: "Hombre · Vaqueras", en: "Men · Cowboy" },
  "hero.slide2.title": { es: "Para décadas.", en: "For decades." },
  "hero.slide3.eyebrow": { es: "Mujer · Nueva colección", en: "Women · New collection" },
  "hero.slide3.title": { es: "Cuero auténtico.", en: "Genuine leather." },
  "hero.goToSlide": { es: "Ir al slide {n}", en: "Go to slide {n}" },

  // ── Trust badges (home) ──────────────────────────────────────────────
  "trust.curated.title": { es: "Curado y verificado", en: "Curated & verified" },
  "trust.curated.sub": {
    es: "Cada marca pasa nuestro filtro",
    en: "Every brand meets our standard",
  },
  "trust.shipping.title": { es: "Envío a Estados Unidos", en: "Ships across the USA" },
  "trust.shipping.sub": { es: "Entrega en 2–3 días hábiles", en: "Delivery in 2–3 business days" },
  "trust.shipping.titleMx": { es: "Envío gratis a toda la República", en: "Free shipping across Mexico" },
  "trust.shipping.subMx": { es: "Sin monto mínimo", en: "No minimum order" },
  "trust.exchange.title": { es: "Garantía", en: "Built to last" },
  "trust.exchange.sub": {
    es: "15 días por defecto de fábrica",
    en: "Premium leather, made in León",
  },

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

  // ── Home · "Lo más nuevo" (LatestByGenderTabs / LatestGenderGrid) ─────
  "latest.eyebrow": { es: "Catálogo", en: "Catalog" },
  "latest.filterAria": {
    es: "Filtrar lo más nuevo por género",
    en: "Filter new arrivals by gender",
  },
  "latest.tabMen": { es: "Lo más nuevo Hombre", en: "New Arrivals — Men" },
  "latest.tabWomen": { es: "Lo más nuevo Mujer", en: "New Arrivals — Women" },
  "latest.comingSoon": { es: "Próximamente", en: "Coming soon" },
  "latest.viewAll": { es: "Ver todo {label}", en: "Shop all {label}" },
  "latest.label.hombre": { es: "hombre", en: "men's" },
  "latest.label.mujer": { es: "mujer", en: "women's" },

  // ── Filtros (listado) ────────────────────────────────────────────────
  "filters.title": { es: "Filtros", en: "Filters" },
  "filters.close": { es: "Cerrar filtros", en: "Close filters" },
  "filters.clear": { es: "Limpiar", en: "Clear" },
  "filters.clearAll": { es: "Limpiar todo", en: "Clear all" },
  "filters.size": { es: "Talla", en: "Size" },
  "filters.brand": { es: "Marca", en: "Brand" },
  "filters.style": { es: "Estilo", en: "Style" },
  "filters.color": { es: "Color", en: "Color" },
  "filters.material": { es: "Material", en: "Material" },
  "filters.horma": { es: "Horma", en: "Toe shape" },
  "catalog.view": { es: "Ver catálogo", en: "View catalog" },
  "catalog.nav": { es: "Catálogo", en: "Catalog" },
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

  // ── Precio ───────────────────────────────────────────────────────────
  "price.from": { es: "Desde", en: "From" },
  "price.perMonth": { es: "al mes", en: "/mo" },

  // ── Tarjeta de producto ──────────────────────────────────────────────
  "card.view": { es: "Ver", en: "View" },
  // Riel horizontal de productos (ProductRail).
  "rail.prev": { es: "Ver anteriores", en: "See previous" },
  "rail.next": { es: "Ver siguientes", en: "See next" },
  "latest.railLabel": {
    es: "Lo más nuevo en {label}",
    en: "New in {label}",
  },
  // Compra directa desde la tarjeta — la talla se elige después, en el carrito.
  "card.add": { es: "Agregar al carrito", en: "Add to cart" },
  "card.addAria": {
    es: "Agregar {title} al carrito — la talla se elige en el carrito",
    en: "Add {title} to cart — choose your size in the cart",
  },
  "card.soldOutParen": { es: "(agotado)", en: "(sold out)" },
  "card.soldOut": { es: "Agotado", en: "Sold out" },

  // ── Página de producto ───────────────────────────────────────────────
  "product.description": { es: "Descripción", en: "Description" },
  "product.type": { es: "Tipo", en: "Type" },

  // ── Reseñas (PDP) ────────────────────────────────────────────────────
  "review.heading": { es: "Reseñas", en: "Reviews" },
  // Carrusel de reseñas general del home (HomeReviewsCarousel)
  "reviews.eyebrow": { es: "RESEÑAS", en: "REVIEWS" },
  "reviews.title": {
    es: "Lo que dicen nuestros clientes",
    en: "What our customers say",
  },
  "reviews.count": { es: "{n} reseñas", en: "{n} reviews" },
  "reviews.seeBoot": { es: "Ver la bota →", en: "See the boot →" },
  "reviews.aria": { es: "Reseñas de clientes", en: "Customer reviews" },
  "reviews.prev": { es: "Reseñas anteriores", en: "Previous reviews" },
  "reviews.next": { es: "Más reseñas", en: "More reviews" },
  "review.empty": {
    es: "Aún no hay reseñas de esta bota. ¡Sé el primero en dejar la tuya!",
    en: "No reviews for this boot yet. Be the first to leave one!",
  },
  "review.verified": { es: "Compra verificada", en: "Verified purchase" },
  "review.anonymous": { es: "Cliente", en: "Customer" },
  "review.photoAlt": { es: "Foto de la reseña", en: "Review photo" },
  "review.starsAria": { es: "{n} de 5 estrellas", en: "{n} of 5 stars" },
  "review.errPhotoSize": {
    es: "cada foto debe pesar menos de 8 MB",
    en: "each photo must be under 8 MB",
  },
  "review.errUpload": {
    es: "No se pudieron subir {n} foto{s}: {err}",
    en: "Couldn't upload {n} photo{s}: {err}",
  },
  "review.errRating": {
    es: "Elige una calificación con las estrellas.",
    en: "Pick a rating with the stars.",
  },
  "review.errRequired": {
    es: "Completa tu nombre, correo y reseña.",
    en: "Fill in your name, email and review.",
  },
  "review.errWaitUpload": {
    es: "Espera a que terminen de subir las fotos.",
    en: "Wait for the photos to finish uploading.",
  },
  "review.errSubmitHttp": {
    es: "No se pudo enviar la reseña (HTTP {n}).",
    en: "Couldn't submit the review (HTTP {n}).",
  },
  "review.errNetwork": {
    es: "No se pudo enviar. Revisa tu conexión e intenta de nuevo.",
    en: "Couldn't submit. Check your connection and try again.",
  },
  "review.thanks": {
    es: "¡Gracias por tu reseña! 🎉 Se publicará en breve.",
    en: "Thanks for your review! 🎉 It'll be published shortly.",
  },
  "review.write": { es: "Escribir una reseña", en: "Write a review" },
  "review.yourRating": { es: "Tu calificación", en: "Your rating" },
  "review.starAria": { es: "{n} estrella{s}", en: "{n} star{s}" },
  "review.phName": { es: "Tu nombre", en: "Your name" },
  "review.phEmail": { es: "Tu correo (no se publica)", en: "Your email (not published)" },
  "review.phTitle": { es: "Título (opcional)", en: "Title (optional)" },
  "review.phBody": {
    es: "¿Qué te parecieron las {title}?",
    en: "What did you think of the {title}?",
  },
  "review.photoOptional": { es: "Foto (opcional)", en: "Photo (optional)" },
  "review.removePhoto": { es: "Quitar foto", en: "Remove photo" },
  "review.addPhoto": { es: "Agregar foto", en: "Add photo" },
  "review.sending": { es: "Enviando…", en: "Sending…" },
  "review.submit": { es: "Publicar reseña", en: "Post review" },
  "review.cancel": { es: "Cancelar", en: "Cancel" },
  "review.disclaimer": {
    es: "Tu correo no se publica. Tu reseña puede tardar un poco en aparecer tras revisión.",
    en: "Your email won't be published. Your review may take a little while to appear after review.",
  },

  // ── Cintillo (MarqueeBar) ────────────────────────────────────────────
  // Este despliegue vende a Estados Unidos en USD. El copy de envío no promete
  // envío gratis ni menciona México: eso vive en el sitio botasleon.mx.
  "marquee.tradition": { es: "380 años de tradición", en: "380 years of tradition" },
  "marquee.leather": {
    es: "León, capital mundial del cuero",
    en: "León, the world capital of leather",
  },
  "marquee.shipping": {
    es: "Enviamos a todo Estados Unidos",
    en: "We ship anywhere in the USA",
  },
  "marquee.shippingMx": { es: "Envío gratis a toda la República", en: "Free shipping across Mexico" },
  "marquee.store": { es: "Tienda física en León →", en: "Visit our store in León →" },

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

  // ── Bloque de confianza "Hecho en León" (HechoEnLeonStrip) ───────────
  "trust.yearsTradition": { es: "Años de tradición", en: "Years of tradition" },
  "trust.leonDesc": {
    es: "León lleva 380 años haciendo calzado. La capital mundial del cuero.",
    en: "León has been making footwear for 380 years — the world capital of leather.",
  },
  "trust.mexicanBoots": { es: "Botas mexicanas", en: "Mexican boots" },
  "trust.mexicanBootsStat": { es: "7 de 10", en: "7 in 10" },
  "trust.mexicanBootsDesc": {
    es: "Nacen aquí. El epicentro del calzado de cuero en México.",
    en: "Born right here — the epicenter of leather footwear in Mexico.",
  },
  "trust.genuineLeather": { es: "Piel genuina", en: "Genuine leather" },
  "trust.genuineLeatherDesc": {
    es: "Cuero verificado en cada par. CITES certificado en colecciones exóticas.",
    en: "Verified leather in every pair. CITES-certified on exotic collections.",
  },
  "trust.ourStory": { es: "Conoce nuestra historia", en: "Discover our story" },

  // ── Tienda física (StoreVisitSection) ────────────────────────────────
  "store.title": { es: "Te esperamos en León", en: "Come see us in León" },
  "store.desc": {
    es: "No somos solo una tienda en línea: tenemos tienda física en León, Guanajuato. Ven a conocer y probarte tus botas en persona.",
    en: "We're not just an online store — we have a physical shop in León, Guanajuato. Come explore and try on your boots in person.",
  },
  "store.hours": {
    es: "Lunes a sábado · 10:00 – 19:00",
    en: "Monday to Saturday · 10:00 – 19:00",
  },
  "store.viewStore": { es: "Ver la tienda", en: "Visit the store" },
  "store.directions": { es: "Cómo llegar", en: "Get directions" },
  "store.mapTitle": {
    es: "Ubicación de BotasLeón en Google Maps",
    en: "BotasLeón location on Google Maps",
  },


  // ── Carrito (CartDrawer) ─────────────────────────────────────────────
  "cart.ariaLabel": { es: "Carrito de compras", en: "Shopping cart" },
  "cart.title": { es: "Tu carrito", en: "Your cart" },
  "cart.close": { es: "Cerrar carrito", en: "Close cart" },
  "cart.empty": { es: "Tu carrito está vacío", en: "Your cart is empty" },
  "cart.emptyDesc": {
    es: "Cuando agregues botas las verás aquí.",
    en: "When you add boots, they'll show up here.",
  },
  "cart.viewCatalog": { es: "Ver catálogo", en: "Shop the catalog" },

  // Mini-carrito persistente (components/MiniCarrito.tsx). "artículo" y no
  // "par": un cinturón no es un par.
  "minicart.label": { es: "Tu carrito", en: "Your cart" },
  "minicart.item": { es: "artículo", en: "item" },
  "minicart.items": { es: "artículos", en: "items" },
  "minicart.view": { es: "Ver carrito", en: "View cart" },
  "cart.decrease": { es: "Disminuir cantidad", en: "Decrease quantity" },
  "cart.increase": { es: "Aumentar cantidad", en: "Increase quantity" },
  "cart.remove": { es: "Quitar", en: "Remove" },
  "cart.promoLabel": {
    es: "¿Tienes un código de descuento?",
    en: "Have a discount code?",
  },
  // Sin código de ejemplo: sugerir uno entrena a irse a buscarlo (Baymard).
  "cart.promoPlaceholder": { es: "Tu código", en: "Your code" },
  // El campo va escondido tras este enlace: mostrarlo por defecto sube el
  // abandono — quien no trae código se va a buscar uno y no vuelve (Baymard).
  "cart.promoToggle": { es: "¿Tienes un código de descuento?", en: "Have a discount code?" },
  // Entrega estimada — cifras de /envios de cada mercado, no de aquí.
  "cart.deliveryLabel": { es: "Entrega estimada", en: "Estimated delivery" },
  "cart.deliveryMx": { es: "3–7 días hábiles", en: "3–7 business days" },
  "cart.deliveryUs": { es: "2–3 días hábiles", en: "2–3 business days" },
  "cart.total": { es: "Total", en: "Total" },
  "cart.summary": { es: "Resumen", en: "Summary" },
  "cart.apply": { es: "Aplicar", en: "Apply" },
  "cart.subtotal": { es: "Subtotal", en: "Subtotal" },
  "cart.discount": { es: "Descuento", en: "Discount" },
  // La moneda NO se escribe aquí: la pone el carrito con lo que devuelve
  // Shopify. Escribirla a mano fue lo que dejó al sitio anunciando dólares
  // después de que la tienda ya cobraba pesos.
  // La usa el despliegue de México (botasleon.mx): ahí el precio lleva IVA.
  "cart.shippingTax": {
    es: "IVA incluido",
    en: "VAT included",
  },
  // La usa botasleon.com: precios en USD, sin IVA mexicano.
  "cart.shippingTaxUs": {
    es: "Envío a todo Estados Unidos",
    en: "Ships across the USA",
  },
  "cart.checkout": { es: "Pagar", en: "Checkout" },
  // Envío gratis: SOLO existe en el mercado mexicano, hoy sin monto mínimo
  // (ver lib/shipping-policy.ts). El sitio de EE.UU. no renderiza estas claves
  // porque allá el envío pasa de $100 USD y prometerlo gratis sería falso.
  // Van partidas en dos porque useT() no interpola: el monto se arma en JSX.
  "cart.freeShippingAlways": {
    es: "Envío gratis a toda la República",
    en: "Free shipping anywhere in Mexico",
  },
  "cart.freeShippingQualified": {
    es: "Tu pedido lleva envío gratis",
    en: "Your order ships free",
  },
  "cart.freeShippingRemainingPre": { es: "Te faltan ", en: "You're " },
  "cart.freeShippingRemainingPost": {
    es: " para envío gratis",
    en: " away from free shipping",
  },
  // Talla dentro del carrito (se puede agregar desde la tarjeta sin elegirla).
  "cart.chooseSize": { es: "Elige tu talla", en: "Choose your size" },
  "cart.changeSize": { es: "Cambiar", en: "Change" },
  "cart.changeSizeTitle": { es: "Cambiar talla", en: "Change size" },
  "cart.sizeBlocked": {
    es: "Elige la talla de cada par para continuar.",
    en: "Choose a size for each pair to continue.",
  },
  "cart.codeError": {
    es: "No se pudo aplicar el código.",
    en: "Couldn't apply the code.",
  },

  // ── Búsqueda (SearchOverlay) ─────────────────────────────────────────
  "search.close": { es: "Cerrar búsqueda", en: "Close search" },
  "search.placeholder": {
    es: "Buscar botas, marcas, modelos...",
    en: "Search boots, brands, models...",
  },
  "search.term": { es: "Término de búsqueda", en: "Search term" },
  "search.searching": { es: "Buscando", en: "Searching" },
  "search.popular": { es: "Búsquedas populares", en: "Popular searches" },
  "search.noResultsPre": {
    es: "No encontramos productos para",
    en: "We couldn't find any products for",
  },
  "search.noResultsPost": {
    es: ". Intenta otra búsqueda.",
    en: ". Try another search.",
  },
  "search.viewAll": { es: "Ver todos los resultados", en: "View all results" },
  "search.viewProduct": { es: "Ver {title}", en: "View {title}" },

  // ── Accesibilidad / labels de íconos ─────────────────────────────────
  "a11y.home": { es: "BotasLeón — Inicio", en: "BotasLeón — Home" },
  "a11y.search": { es: "Buscar", en: "Search" },
  "a11y.account": { es: "Mi cuenta", en: "My account" },
  "a11y.cart": { es: "Carrito", en: "Cart" },
  "a11y.openMenu": { es: "Abrir menú", en: "Open menu" },
  "a11y.closeMenu": { es: "Cerrar menú", en: "Close menu" },
  "a11y.nav": { es: "Navegación", en: "Navigation" },
  "a11y.language": { es: "Idioma", en: "Language" },

  // ── Estado vacío de catálogo (EmptyProductsState) ────────────────────
  "empty.title": {
    es: "Estamos preparando el catálogo",
    en: "We're preparing the catalog",
  },
  "empty.desc": {
    es: "Nuestras primeras botas están en camino. Vuelve pronto.",
    en: "Our first boots are on the way. Check back soon.",
  },


  // ── Josepha (landing propia, /josepha) ───────────────────────────────
  // Su frase en Shopify solo está en español, así que aquí van textos
  // propios: la página se publica en los dos idiomas y en los dos mercados.
  "josepha.eyebrow": { es: "Una casa de León", en: "A house from León" },
  "josepha.lead": {
    es: "Tres botines para mujer, hechos a mano en León. Tacón de bloque, punta de bota y nada de disfraz: se ponen para salir.",
    en: "Three ankle boots for women, handmade in León. Block heel, western toe, no costume: made for going out.",
  },
  "josepha.back": { es: "Botas León", en: "Botas León" },
  "josepha.backAria": {
    es: "Volver al catálogo de Botas León",
    en: "Back to the Botas León catalog",
  },
  "josepha.sizes": { es: "Tallas", en: "Sizes" },
  "josepha.see": { es: "Verlo completo", en: "See the full boot" },
  "josepha.soldOut": { es: "Agotado", en: "Sold out" },
  "josepha.closing": {
    es: "Los tres cuestan lo mismo. Lo único que escoges es cuál.",
    en: "All three cost the same. The only thing you choose is which one.",
  },
  "josepha.allBrands": { es: "Ver las catorce casas", en: "See all fourteen houses" },
  "josepha.oneOf": {
    es: "Josepha es una de las catorce casas de León que trabajan con nosotros.",
    en: "Josepha is one of the fourteen houses in León we work with.",
  },

  // ── Ventana emergente (PopupPromo) ───────────────────────────────────
  // El CONTENIDO (imagen, eyebrow, título, mensaje, botón y código) sale del
  // metaobjeto `popup` de Shopify, no de aquí: aquí solo vive el chrome, que
  // sí hay que traducir.
  "promo.dialogLabel": {
    es: "Promoción de inauguración",
    en: "Grand opening promotion",
  },
  "promo.closeAria": { es: "Cerrar promoción", en: "Close promotion" },
  "promo.close": { es: "Cerrar", en: "Close" },
  "promo.off": { es: "de descuento", en: "off" },

  // ── Aviso de cookies (CookiesBanner) ─────────────────────────────────
  "cookies.dialogLabel": { es: "Aviso de cookies", en: "Cookie notice" },
  "cookies.title": { es: "Usamos cookies 🍪", en: "We use cookies 🍪" },
  "cookies.body": {
    es: "Nos ayudan a mostrarte mejores botas, recordar tu carrito y mejorar la tienda. Al aceptar todas, nos das una mano para seguir mejorando tu experiencia. Lee nuestro",
    en: "They help us show you better boots, remember your cart and improve the store. By accepting all, you help us keep improving your experience. Read our",
  },
  "cookies.privacyLink": { es: "aviso de privacidad", en: "privacy notice" },
  "cookies.acceptAll": {
    es: "Aceptar todas las cookies",
    en: "Accept all cookies",
  },
  "cookies.necessary": { es: "Solo las necesarias", en: "Only necessary" },
  // La barra dice lo justo: quien quiera el detalle entra al aviso de
  // privacidad. Un párrafo largo en una franja de tres renglones no lo lee
  // nadie y sí estorba.
  "cookies.barra": {
    es: "Usamos cookies para recordar tu carrito y mejorar la tienda. Lee nuestro",
    en: "We use cookies to remember your cart and improve the store. Read our",
  },
  "cookies.accept": { es: "Aceptar", en: "Accept" },
  "cookies.reject": { es: "Rechazar", en: "Decline" },

  // ══ Sistema visual v3 (informe de rediseño, sep 2026) ═════════════════
  // Todas las llaves nuevas viven aquí y se añaden de una sola vez, para que
  // ningún lote del rediseño tenga que abrir este archivo y pisar a otro.
  //
  // OJO CON EL MERCADO: lo que solo es cierto en México va envuelto en el
  // componente con isMX / ENVIO_GRATIS_SIEMPRE / HAY_MSI / admiteCambioDeTalla,
  // NUNCA con locale === "es" — botasleon.com/es es venta de Estados Unidos.

  // ── Barra de avisos (sustituye a la marquesina negra) ─────────────────
  "aviso.mx": {
    es: "Envío gratis a toda la República, sin monto mínimo.",
    en: "Free shipping anywhere in Mexico, no minimum.",
  },
  "aviso.us": {
    es: "Enviamos a todo Estados Unidos. Entrega en 2–3 días hábiles.",
    en: "We ship anywhere in the USA. Delivered in 2–3 business days.",
  },
  "aviso.enlace": { es: "Ver envíos", en: "Shipping details" },

  // ── Tarjeta de producto ──────────────────────────────────────────────
  // El botón "Agregar" se retiró de la tarjeta: competía con la foto y creaba
  // carritos sin talla que no podían pagar. Al pasar el cursor aparece esto.
  "card.chooseSize": { es: "Elegir talla", en: "Choose size" },
  "card.badgeNew": { es: "Nueva", en: "New" },
  // El badge de outlet se deriva de compareAtPrice (ver lib/utils saleInfo).
  // Hoy no se pinta en ninguna tarjeta: los 103 productos tienen el precio de
  // comparación en 0. Se pintará solo en cuanto el dueño capture uno.
  "card.badgeOutlet": { es: "Outlet", en: "Outlet" },

  // ── Encabezado de sección y buscador ─────────────────────────────────
  "search.headerPlaceholder": {
    es: "¿Qué bota buscas?",
    en: "Which boot are you looking for?",
  },
  "latest.title": { es: "Lo más nuevo", en: "New arrivals" },
  "brand.phraseEyebrow": { es: "Nuestros talleres", en: "Our workshops" },

  // ── Filtros de colección ─────────────────────────────────────────────
  "filters.activeTitle": { es: "Filtros activos", en: "Active filters" },
  "filters.removeAria": {
    es: "Quitar el filtro {label}",
    en: "Remove the {label} filter",
  },
  // La unidad cambia según lo que se esté listando: en /accesorios y en la
  // página de una marca de cintos, "pares" sería mentira.
  "listing.pairs": { es: "pares", en: "pairs" },
  "listing.pair": { es: "par", en: "pair" },
  "listing.pieces": { es: "piezas", en: "items" },
  "listing.piece": { es: "pieza", en: "item" },

  // ── Ficha: acordeones ────────────────────────────────────────────────
  // "Detalles", NO "Detalles y medidas": comprobado contra la Storefront API
  // que altura de caña, altura de tacón, vira y peso NO existen como dato en
  // ninguno de los 103 productos. Prometer medidas y no darlas sería peor que
  // no tener el acordeón.
  "pdp.acc.details": { es: "Detalles", en: "Details" },
  "pdp.acc.workshop": { es: "El taller", en: "The workshop" },
  "pdp.acc.shipping": { es: "Envíos y cambios", en: "Shipping & exchanges" },
  "pdp.detailToe": { es: "Horma", en: "Toe shape" },
  "pdp.detailLeather": { es: "Piel", en: "Leather" },
  "pdp.detailStyle": { es: "Estilo", en: "Style" },
  "pdp.detailColor": { es: "Color", en: "Color" },
  "pdp.seeAllFrom": { es: "Ver todas de {marca}", en: "See all from {marca}" },

  // ── Ficha: promesas bajo el botón de compra ──────────────────────────
  // Sustituyen a los cuatro íconos genéricos. Cada una se pinta solo si es
  // verdad en ese mercado y para ese producto.
  "promesa.whatsapp": {
    es: "Asesoría de talla por WhatsApp antes de pagar",
    en: "Size advice over WhatsApp before you pay",
  },
  "promesa.envioMx": {
    es: "Envío gratis a toda la República",
    en: "Free shipping anywhere in Mexico",
  },
  "promesa.envioUs": {
    es: "Entrega en Estados Unidos en 2–3 días hábiles",
    en: "Delivered in the USA in 2–3 business days",
  },
  "promesa.cambio": {
    es: "Cambio de talla sin costo si no te queda",
    en: "Free size exchange if it doesn't fit",
  },
  "promesa.cambioNota": {
    es: "Sin estrenar · modelos seleccionados",
    en: "Unworn · selected models",
  },
  // Quinta promesa, APAGADA por defecto (PROMESA_VIDEO en lib/promesas.ts).
  // El informe la propone, pero no consta en ninguna parte del repo ni de las
  // políticas que el video se mande siempre: encenderla es decisión del dueño,
  // porque se estaría prometiendo en 103 fichas.
  "promesa.video": {
    es: "Te mandamos video del par exacto antes de enviarlo",
    en: "We send you a video of your exact pair before it ships",
  },

  // ── Ficha: complemento con cinto ─────────────────────────────────────
  "cintos.eyebrow": { es: "Va bien con", en: "Goes well with" },
  "cintos.title": { es: "Complementa con un cinto", en: "Finish it with a belt" },
  "cintos.cta": { es: "Ver los cintos", en: "Shop belts" },
  "cintos.desc": {
    es: "Piel labrada a mano en León, del mismo oficio que tu bota.",
    en: "Leather hand-tooled in León, from the same craft as your boots.",
  },

  // ── Reseñas ──────────────────────────────────────────────────────────
  // El resumen de estrellas se oculta cuando no hay ninguna, pero el enlace
  // para escribir la primera se queda: con 8 reseñas en toda la tienda, esa
  // es la única vía de que el número crezca.
  "review.beFirst": { es: "Sé el primero en reseñarla", en: "Be the first to review it" },
  "review.onModel": { es: "Sobre {modelo}", en: "On {modelo}" },

  // ── Pie y mapa ───────────────────────────────────────────────────────
  "footer.catalogDownload": {
    es: "Descargar catálogo (PDF)",
    en: "Download catalog (PDF)",
  },
  "store.mapPlaceholder": { es: "Toca para ver el mapa", en: "Tap to load the map" },

  // ── Tercera tarjeta del trío de la portada ───────────────────────────
  // Era Outlet y llevaba a una página vacía: los 103 productos tienen el
  // precio de comparación en 0, así que /outlet no lista ni una bota.
  "cat.exotic.eyebrow": { es: "Categoría", en: "Category" },
  "cat.exotic.title": { es: "Exóticas", en: "Exotics" },
  "cat.exotic.desc": {
    es: "Pitón, caimán, avestruz y mantarraya. Lo más fino del taller.",
    en: "Python, alligator, ostrich and stingray. The finest work in the shop.",
  },

}
