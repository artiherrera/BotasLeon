# Proyecto [Nombre TBD] — Documento Conceptual

> Documento conceptual. Sin código aún. Define qué construimos, por qué, y con qué.
> Fecha: 2026-05-29 · Versión: 0.1 (draft) · Autor: Arturo + IA

---

## 1. Visión

Una tienda online especializada en **botas**, con posible expansión a ropa y accesorios western/casual, dirigida al público general en **México y Estados Unidos**.

El diferenciador clave: una **navegación radicalmente simple sobre un catálogo amplio que viene de múltiples proveedores y fabricantes**. El visitante no debe saber que detrás hay una red compleja de talleres aliados — para él es una tienda coherente.

**No estamos compitiendo en precio**. Estamos compitiendo en **curaduría + experiencia + facilidad de descubrir la bota correcta**.

---

## 2. Objetivo de la Semana 1

> **Crítico**: tener un prototipo público en línea para **mostrar a posibles proveedores** y cerrar acuerdos comerciales con ellos.

Esto cambia las prioridades:

- **NO necesitamos**: checkout funcionando con cobros reales, integración fiscal, gestión de pedidos sofisticada, multi-vendor real, panel de proveedor
- **SÍ necesitamos**: tienda viva en internet, dominio bonito, catálogo creíble (10-15 botas reales con foto+precio+descripción), branding consistente, idiomas ES/EN, monedas MXN/USD, "carrito" que parece funcionar (aunque sea visual)

El prototipo es una **herramienta de ventas B2B** (convencer fabricantes), no un canal B2C real todavía.

---

## 3. Stack — mi recomendación honesta

### 3.1 ¿Por qué NO Medusa para este caso?

Intentamos Medusa esta semana. Es excelente tecnología, pero para este proyecto en este momento es la opción equivocada por:

| Problema | Impacto |
|---------|---------|
| Setup operativo no trivial (Postgres, Redis, S3, Mercur fork, vite tooling) | Días de yak-shaving antes de poder construir features |
| Bugs upstream en Mercur 2.1.5 (product media upload roto) | Fix requiere parches hostiles a maintainability |
| Admin nativo confuso para no-técnicos | Construimos 5 páginas custom y aún era frágil |
| Hosting en producción es complejo (Docker + Postgres managed + Redis + S3 + CDN) | Días más para deploy |
| **Tiempo total realista a producción**: 4-8 semanas para algo decente | **Imposible cumplir tu plazo de 1 semana** |

Medusa tiene sentido cuando:
- Tienes equipo técnico (≥2 devs full-time)
- Necesitas customización profunda imposible en hosted
- Estás escalando $$$ y el costo de plataforma es un problema real
- Aceptas la carga operativa

Nada de esto aplica hoy.

### 3.2 Opciones para tu caso

| Opción | $ / mes | Tiempo a producción | Pros | Contras |
|--------|---------|---------------------|------|---------|
| **Shopify Basic** | USD $29 | 1-2 días | El estándar. Todo funciona. Tema gratis decente. App store para todo. Multi-currency by IP nativo. | Costo. 2% sobre Stripe (o usar Shopify Payments). Tema custom requiere Liquid. |
| **Shopify Lite** | USD $9 | 1 día | Catálogo embebible + carrito + Stripe. Puedes hostear el frontal en Next.js que ya conocemos. | No tiene storefront propio — necesitas un sitio externo. |
| **Tiendanube** | MXN ~$300 | 1-2 días | Pensado para LATAM. Soporte en español. Multi-currency. | UI menos pulida. Menor ecosistema que Shopify. |
| **WooCommerce** + hosting WP | USD ~$10-25 | 3-5 días | Gratis. Comunidad enorme en MX. Personalizable. | Operación WP (updates, seguridad, plugins). |
| **Medusa self-hosted** | USD ~$30-80 | 4-8 semanas | Control total. | Tiempo. Complejidad. Bugs upstream. |
| **Custom Next.js + Stripe** | USD ~$5-20 | 1 semana (prototipo) | Máximo control de UX. Sin lock-in de plataforma. | Hay que construir admin, catálogo, carrito tú mismo. Inventario manual. |

### 3.3 Mi recomendación

**Para la Semana 1 (prototipo para proveedores)**: **Shopify Basic** con un tema custom o premium ($150-300 una vez).

Razones:
- En 24-48 horas tienes una tienda viva, con dominio, SSL, checkout real, multi-currency, multi-idioma
- La calidad visual es alta out-of-the-box
- Cuando le muestres a un proveedor "mira, esta es la tienda donde vamos a vender tus botas" se ve PROFESIONAL desde día 1
- Si te empieza a apretar el costo (estás vendiendo $10K USD/mes y los $29 son irrelevantes), o si necesitas customización imposible (raro), migras a algo más open

**Alternativa low-cost**: **Tiendanube** ($300 MXN ≈ $18 USD/mes). Casi igual de bueno para LATAM, soporte en español, plantillas decentes. Útil si Shopify se siente caro al inicio.

**Si insistes en open-source**: **WooCommerce** sobre un hosting managed tipo Kinsta o WP Engine. 3-5 días a producción si no nos enredamos con plugins.

**Lo que NO recomiendo**: volver a Medusa o cualquier otro stack que requiera construir backend desde cero. No con tu plazo y siendo solos.

---

## 4. Producto MVP (Semana 1)

Asumiendo Shopify (ajustable a Tiendanube/Woo):

### 4.1 Storefront público

- **Home** con hero/carousel, 3-4 categorías destacadas, "lo más vendido" mock
- **Listado de productos** filtrable por: género (hombre/mujer/niño), estilo (vaquera/industrial/casual/botín/alta), talla, marca, rango de precio
- **PDP (página de producto)** con galería, descripción, selector de talla, precio en MXN o USD según IP del visitante, botón "Agregar al carrito"
- **Carrito + Checkout** (Stripe test mode al menos)
- **Páginas estáticas**: Sobre Nosotros, Envíos, Devoluciones, Contacto
- **Footer** con redes sociales, métodos de pago, "Hecho en León, Gto."

### 4.2 Catálogo inicial

- **10-15 botas reales** con fotos profesionales (de los proveedores que quieres convencer, o las tuyas si fabricas)
- Distribuidas: ~5 hombre, ~5 mujer, ~3 niño/unisex
- Variedad de estilos visible (vaqueras, industriales, etc.)
- Cada bota: 1+ fotos, descripción 100-200 palabras, precio MXN/USD, tallas disponibles, marca

### 4.3 Branding

- Logo (puede ser tipográfico simple inicialmente, luego se mejora)
- Paleta: tonos cuero, marrón, crema, negro — west/artesanal-premium
- Tipografía: una serif/display para títulos (estilo western), sans-serif para texto
- Voz: cercana, mexicana, artesanal, sin exageraciones

---

## 5. Mercados, idiomas y monedas

- **México** (MXN): mercado primario inicial, todo el catálogo
- **Estados Unidos** (USD): mercado secundario, mismo catálogo
- **Detección automática por IP**: Shopify lo hace nativo con Markets. Tiendanube también. Si vamos custom, usamos `cloudflare-headers` o un servicio como ipapi.co
- **Idiomas**: ES (default), EN (segundo). Empezar con todo en ES y traducir manualmente, no auto-traducir
- **Conversión MXN ↔ USD**: ratio ~18 inicial, ajustable. Cada producto puede tener precio explícito en cada moneda (recomendado, no convertir en runtime) para evitar precios feos tipo $1817.49

---

## 6. Modelo de operación (negocio, no técnico)

### 6.1 Tipo de marketplace
**Fase 0 (semana 1 + primeros meses)**: tienda single-vendor disfrazada. Nosotros (Arturo) somos el único "vendedor" formal. Los proveedores son contratos B2B detrás del telón — embarcan ellos directo, o tú embarcas desde inventario propio.

**Fase 1 (cuando haya tracción)**: posible apertura como marketplace multi-vendor donde cada proveedor tiene panel propio. Esto NO se construye ahora.

### 6.2 Fulfillment
- Cada proveedor embarca directo al cliente (drop-shipping) o tú consolidas en León. Decisión por proveedor.
- En el prototipo no importa — escribimos "Envío a toda la república" en el footer y ya.

### 6.3 Pagos
- **México**: Stripe (acepta tarjeta + OXXO + SPEI). Costo ~3.6% + $3 MXN
- **USA**: Stripe (acepta tarjeta). Costo ~2.9% + $0.30 USD
- **Mercado Pago como alternativa MX**: solo si Stripe da problema (no lo prevemos)

### 6.4 Modelo de revenue (cuando tengas ventas reales)
- Markup sobre costo del proveedor (típico retail: 30-100% margen)
- No es un marketplace que cobra comisión todavía — somos retailer

---

## 7. Catálogo y categorización

### 7.1 Estructura
- **Segmento** (uno por bota): Hombre · Mujer · Niño · Unisex
- **Estilo** (uno o más): Vaquera · Industrial · Casual · Botín · Alta · Sandalia
- **Marca** (una por bota): la marca comercial visible (ej. "Cuadra Western")
- **Proveedor** (interno, no visible al cliente): quién la fabrica/distribuye

### 7.2 Navegación pública (vista del cliente)
- Menú principal: **Hombre · Mujer · Niño · Marcas · Ofertas**
- Filtros laterales en cada categoría: Talla, Color, Precio, Estilo, Marca
- Buscador prominente arriba

### 7.3 Catálogo backend (admin)
- En Shopify: usar **categorías + tags**
- Una bota se etiqueta: `segmento:mujer`, `estilo:vaquera`, `marca:cuadra`
- Filtros del storefront se basan en estos tags
- Proveedor: campo metafield (interno, oculto al cliente)

---

## 8. Roadmap por fases

### Fase 0 — Prototipo público (Semana 1)
**Objetivo**: tener algo que mostrar a proveedores potenciales.
- Setup Shopify Basic + dominio + SSL
- Tema (gratis o $300 premium)
- 10-15 productos reales con fotos
- Branding mínimo coherente
- Páginas estáticas (about, shipping, contact)
- Multi-currency activado
- Modo test para el checkout (sin cobros reales todavía)

**Definición de "hecho"**: puedo mandarle el link a un proveedor en WhatsApp y se ve serio.

### Fase 1 — Validación comercial (Mes 1-2)
- Negociar con 3-5 proveedores reales
- Cargar su catálogo (50-150 productos)
- Activar cobros reales (live mode Stripe)
- Setup de fulfillment con cada proveedor (cómo se procesan pedidos)
- Primeras campañas pequeñas (Instagram orgánico, Google Ads $200 USD test)
- Aprender qué se vende y qué no

### Fase 2 — Crecimiento (Mes 3-6)
- Optimizar SEO con base en datos reales
- Email marketing (Klaviyo en Shopify)
- Posibles features: reviews, programa de lealtad, descuentos por volumen
- Evaluar si vale la pena agregar ropa/accesorios

### Fase 3 — Escala (Mes 6+)
- ¿Migrar a marketplace real? ¿Vale el costo operativo?
- ¿Internacionalización más agresiva (USA marketing)?
- ¿App móvil?

---

## 9. Decisiones pendientes (te las hago abajo)

1. **Nombre del proyecto**. ¿Mantenemos "BotasLeón" o cambiamos? Si cambias, ¿qué dominio?
2. **¿Confirmas Shopify Basic?** O preferencia por otra opción (Tiendanube / WooCommerce / Custom)
3. **¿Dominio ya comprado?** Si no, hay que comprarlo HOY (paso 1 de la semana). Recomendación: GoDaddy o Namecheap.
4. **¿Tienes 10-15 botas con fotos profesionales** ya disponibles? Si no, esto es el bloqueador real del prototipo (no la tecnología).
5. **¿Tienes proveedores concretos en mente** que vas a contactar después del prototipo? Lista corta ayuda a calibrar el catálogo.
6. **¿Quieres logo profesional** desde día 1 ($100-300 USD) o partimos con uno tipográfico simple que tú mismo hagas?

---

## 10. Riesgos

| Riesgo | Mitigación |
|--------|------------|
| **Plazo de 1 semana** demasiado ambicioso si no hay fotos/productos | Confirmar HOY si tenemos contenido; si no, primer día se va en eso |
| **Sin checkout real** = prototipo se ve "fake" | Activar checkout Stripe test, productos comprables (con disclaimer "tienda en lanzamiento") |
| **Sin proveedores firmados** = catálogo es speculative | Aceptamos: el prototipo es PARA conseguir proveedores. OK que el catálogo sea muestrario |
| **Solo + IA construyendo** = no hay quien valide UX | Pedirle feedback a 2-3 personas externas antes de mostrar a proveedores |
| **Si Shopify se siente caro** después de 6 meses | Migración a Medusa/Woo es factible (~1-2 meses) cuando haya tracción real |
| **Diferenciador "navegación simple"** se diluye si copiamos plantilla genérica | Tomar 2-3 horas explícitas pensando en menú y filtros antes de tema final |

---

## 11. ¿Qué sigue?

Si apruebas este documento conceptual:

1. Tú decides los 6 puntos pendientes (sección 9)
2. Yo te ayudo a:
   - Comprar dominio (te guío paso a paso)
   - Setup Shopify (cuenta + tema + configuración inicial)
   - Subir productos con fotos
   - Personalizar tema con tu branding
   - Configurar Stripe test
   - Conectar dominio + SSL
3. Te queda online esta misma semana

---

## Anexo A — Credenciales preservadas del intento anterior

En `_RESCATADO_credenciales.env` (este directorio) están las claves que pueden reusarse:

- **PostgreSQL local** (`botasleon_dev`, vacía) — no necesaria si vamos Shopify
- **Stripe test mode** — directamente reusable
- **AWS S3 bucket `botasleon-media-prod`** — reusable como CDN de imágenes si queremos servirlas independiente

Si vamos full Shopify, solo Stripe es relevante; el resto podemos cerrar para evitar costo (S3 cobra $0.023/GB/mes — irrelevante por ahora, pero limpio).
