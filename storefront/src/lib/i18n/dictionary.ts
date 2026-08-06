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
  "pdp.available": { es: "Disponible", en: "In stock" },
  "pdp.chooseSize": { es: "Elige talla", en: "Choose size" },
  "pdp.comboUnavailable": { es: "Combinación no disponible", en: "Combination unavailable" },
  "pdp.selectSize": { es: "Selecciona tu talla", en: "Select your size" },
  "pdp.shippingNote": { es: "Envío GRATIS · México 3-5 días", en: "FREE shipping · Check your size first" },
  "pdp.sizeError": { es: "Por favor selecciona tu talla.", en: "Please select your size." },
  "pdp.unavailable": { es: "No disponible", en: "Unavailable" },
  "recent.eyebrow": { es: "Visto recientemente", en: "Recently viewed" },
  "recent.title": { es: "Sigue donde te quedaste", en: "Pick up where you left off" },
  "trust.exchange30": { es: "Garantía 15 días", en: "Ships to the USA" },
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
  "home.newsletterTitle": {
    es: "Suscríbete y recibe 10% en tu primera compra",
    en: "Subscribe and get 10% off your first order",
  },
  "home.newsletterSubtitle": {
    es: "Plus las novedades de las marcas de León antes que nadie. Sin spam, prometido.",
    en: "Plus the latest from León's brands before anyone else. No spam, promised.",
  },

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
  "promo.msi": { es: "3, 6 y 9 meses sin intereses", en: "Handcrafted in León, Mexico" },
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
    es: "Botas premium fabricadas a mano en León. Tradición artesanal mexicana con calidad de exportación. Envíos a todo México y Estados Unidos.",
    en: "Premium boots handcrafted in León. Mexican artisan tradition with export-grade quality. Shipped across Mexico and the USA.",
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
  "trust.shipping.title": { es: "Envío GRATIS", en: "Free shipping" },
  "trust.shipping.sub": { es: "A México y EE.UU.", en: "To Mexico & the USA" },
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
  "filters.clearAll": { es: "Limpiar filtros", en: "Clear filters" },
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
  // El envío gratis SÍ se promete en ambos idiomas (México y EE.UU.). Los MSI
  // siguen siendo beneficio solo de México; la versión EN usa otro mensaje.
  "marquee.tradition": { es: "380 años de tradición", en: "380 years of tradition" },
  "marquee.leather": {
    es: "León, capital mundial del cuero",
    en: "León, the world capital of leather",
  },
  "marquee.shipping": {
    es: "Envío GRATIS a México y EE.UU.",
    en: "FREE shipping to Mexico & the USA",
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

  // ── Newsletter (NewsletterForm) ──────────────────────────────────────
  "newsletter.thanks": { es: "¡Gracias!", en: "Thank you!" },
  "newsletter.successDesc": {
    es: "Pronto recibirás un correo de bienvenida con tu primer descuento.",
    en: "You'll soon receive a welcome email with your first discount.",
  },
  "newsletter.emailPlaceholder": { es: "tu@correo.com", en: "you@email.com" },
  "newsletter.emailAria": {
    es: "Correo electrónico para newsletter con 10% de descuento",
    en: "Email for the 10% off newsletter",
  },
  "newsletter.subscribeAria": {
    es: "Suscribirme y recibir mi cupón de 10%",
    en: "Subscribe and get my 10% coupon",
  },
  "newsletter.sending": { es: "Enviando...", en: "Sending..." },
  "newsletter.subscribe": { es: "Suscribirme", en: "Subscribe" },
  "newsletter.footnote": {
    es: "El descuento llega a tu correo al confirmar.",
    en: "Your discount arrives by email once you confirm.",
  },
  "newsletter.error": {
    es: "Error al suscribir",
    en: "Couldn't subscribe. Please try again.",
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
  "cart.decrease": { es: "Disminuir cantidad", en: "Decrease quantity" },
  "cart.increase": { es: "Aumentar cantidad", en: "Increase quantity" },
  "cart.remove": { es: "Quitar", en: "Remove" },
  "cart.promoLabel": {
    es: "¿Tienes un código de descuento?",
    en: "Have a discount code?",
  },
  "cart.promoPlaceholder": { es: "Ej. BIENVENIDO10", en: "Enter your code" },
  "cart.apply": { es: "Aplicar", en: "Apply" },
  "cart.subtotal": { es: "Subtotal", en: "Subtotal" },
  "cart.discount": { es: "Descuento", en: "Discount" },
  "cart.shippingTax": {
    es: "Envío e impuestos calculados al pagar",
    en: "Shipping & taxes calculated at checkout",
  },
  "cart.checkout": { es: "Pagar", en: "Checkout" },
  "cart.taxIdBlocked": {
    es: "Ingresa tu Tax ID arriba para continuar (envíos a EE.UU. ≥ $800).",
    en: "Enter your Tax ID above to continue (U.S. orders ≥ $800).",
  },
  "cart.customsAckBlocked": {
    es: "Acepta arriba que los aranceles de aduana corren por tu cuenta para continuar al pago.",
    en: "Please accept above that customs duties are your responsibility to continue to payment.",
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

  // ── Promo modal (PromoModal) ─────────────────────────────────────────
  // El contenido de la promo (eyebrow/título/mensaje/CTA) vive en lib/promo.ts.
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

  // ── Botón de WhatsApp (WhatsAppButton) ───────────────────────────────
  "whatsapp.tooltip": {
    es: "¿Dudas? Escríbenos por WhatsApp",
    en: "Questions? Message us on WhatsApp",
  },
  "whatsapp.askProduct": {
    es: "Preguntar por WhatsApp sobre {title}",
    en: "Ask about {title} on WhatsApp",
  },
  "whatsapp.contact": {
    es: "Contactar por WhatsApp",
    en: "Contact us on WhatsApp",
  },
}
