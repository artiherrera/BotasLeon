# Guía operativa BotasLeón — Shopify admin

Cómo subir productos, marcas, y manejar el contenido del site sin tocar código.

---

## 🥾 Subir un producto nuevo

**Tiempo**: ~10 min por producto la primera vez, ~5 min cuando ya tengas práctica.
**Ruta**: Shopify admin → **Productos** → **Agregar producto**.

### Campos obligatorios (de arriba a abajo)

#### 1. Título
```
Bota Estephania
```
Sin la palabra "Bota" si quieres — `Estephania` también funciona. Lo importante: nombre comercial, no SKU.

#### 2. Descripción
Texto libre, 100-300 palabras ideal. Incluye:
- Tipo de cuero / material
- Detalles de construcción (suela, costuras, horma)
- Color principal
- Recomendación de uso (rancho, ciudad, vestir)

#### 3. Multimedia (FOTOS)
- **Mínimo 3, ideal 5-8 fotos** por producto
- Resolución: 2000×2000 px o más, JPG o PNG
- Orden importa: la **primera** es la que aparece como featured en grids y home
- Tipos sugeridos:
  - Lateral derecha
  - Lateral izquierda
  - Frontal (punta)
  - Trasera (talón + tubo)
  - Cenital con plantilla visible
  - Suela
  - Detalle de cuero/costura

#### 4. Categoría
Click "Editar" → buscar `Boots` → seleccionar **"Botas (Boots) en Calzado (Shoes)"**.
Esto desbloquea los metacampos del paso 9.

#### 5. Precio
```
Precio: 4499         (sin centavos)
Precio comparación: (vacío, o uno mayor si quieres mostrarlo tachado en oferta)
Cobrar impuesto: Sí
```

#### 6. Inventario — SALTA ESTE BLOQUE
**No le pongas cantidad aquí.** El inventario real va en cada variante (paso 8).

#### 7. Envío
```
Producto físico: ✓
Peso del producto: 1.5 kg     (típico bota mexicana adulto, 0.8 niño)
País de origen: México
Código SA: (vacío, opcional)
```

#### 8. Variantes — tallas con inventario
1. Click **"Agregar otra opción"**
2. **Nombre**: `Talla del calzado`
3. **Valores** (uno por uno con Enter): según género del producto:

| Género | Tallas típicas |
|---|---|
| Hombre | `25`, `26`, `27`, `28`, `29`, `30` |
| Mujer | `22`, `23`, `24`, `25`, `26`, `27` |
| Niño | `15`, `16`, `17`, `18`, `19`, `20`, `21`, `22` |

4. Se generan filas automáticamente. Click en cada talla y llena:
   - **Precio**: `4499` (mismo que el padre, o distinto si aplica)
   - **Cantidad**: stock real por talla. Si no sabes, pon `5` para todas.
   - **SKU**: opcional, tu código interno (ej. `JOS-EST-CAFE-25`)

#### 9. Metacampos de categoría
Aparecen una vez asignaste categoría "Boots" en el paso 4. Llena los aplicables:

| Metacampo | Valor para… | Notas |
|---|---|---|
| **Color** | Negro / Café / Cognac / Miel / Blanco / etc. | Para filtro color (próximamente) |
| **Material del calzado** | Leather (cuero), Ostrich (avestruz), Crocodile (cocodrilo), Python (pitón) | Para filtro material (próximamente) |
| **Grupo de edad** | **Adultos** (hombre/mujer) o **Niños** | 🔴 **CRÍTICO** — sin esto la página /nino no filtra niños |
| **Sexo objetivo** | **Masculino** o **Femenino** o Unisex | 🔴 **CRÍTICO** — sin esto las páginas /hombre y /mujer no filtran |
| **Estilo de bota** | Cowboy (vaquera) / Ankle (botín corto) / Knee-high (caña alta) / etc. | Informativo |
| **Estilo de ocasión** | Casual / Formal / Work | Informativo |
| **Estilo de punta del calzado** | Pointed (puntiaguda) / Square (cuadrada) / Round (redonda) | Informativo |
| **Tipo de altura del tacón** | Low / Medium / High | Informativo |
| **Tipo de cierre** | Slip-on (sin agujetas, típico vaquera) / Lace-up | Informativo |
| **Ajuste del calzado** | Regular / Narrow / Wide | Informativo |
| **Instrucciones de cuidado** | Texto libre, ej. "Limpiar con paño seco. Aplicar grasa cada 3 meses." | Aparece en PDP eventualmente |
| **Características del zapato** | (vacío, o Waterproof si aplica) | Informativo |
| **Talla del calzado** | (vacío — se maneja en variantes paso 8) | NO duplicar |

#### 10. Estado
```
Estado: Activo
Publicación: Todos los canales
```

#### 11. Organización del producto (columna derecha)

```
Tipo: [Vaqueras | Clásicas | Rancho | Largas | Exóticas]
Proveedor: [Nombre exacto de la marca — ver "Marcas"]
Colecciones: vacío (las llenamos con Smart Collections, no manual)
Etiquetas: vacío (solo para marketing: oferta-mayo, bestseller, etc.)
Plantilla: Producto predeterminado
```

🔴 **CRÍTICO**:
- **Tipo** debe ser EXACTAMENTE uno de: `Vaqueras`, `Clásicas`, `Rancho`, `Largas`, `Exóticas`. Sin esto, el filtro "Estilo" del sidebar no agrupa.
- **Proveedor** debe ser EXACTAMENTE el `name` del Brand metaobject (ver más abajo). Sin match exacto, la página `/marcas/[handle]` no muestra el producto.

#### 12. Guardar
Botón **Guardar** arriba a la derecha.

---

## ✅ Verifica que tu producto aparece

1. Espera ~60 segundos (revalidate del site)
2. Ve a `https://main.dlrgtndu7af79.amplifyapp.com/products` → debe aparecer el card
3. Click en el card → `/products/[handle]` debe abrir el PDP con galería + selector de talla
4. Verifica que aparezca en su categoría:
   - `/mujer` si Sexo objetivo = Femenino
   - `/hombre` si Sexo objetivo = Masculino
   - `/nino` si Grupo de edad = Niños
   - `/marcas/[handle-marca]` si Proveedor = nombre exacto de marca

---

## 🏷️ Subir una marca nueva

Las marcas tienen logo, orden, tagline. Se gestionan con Metaobjects para que el site las muestre con su look.

**Ruta**: Configuración → **Metacampos y metaobjetos** → **Metaobjetos** → click en **Brand** → **Agregar entrada**.

### Campos:
```
Identificador (handle): josepha           ← slug en URL: /marcas/josepha
Logo: subir PNG transparente              ← idealmente 800×800 cuadrado o similar
Nombre: Josepha                            ← EXACTO igual al campo "Proveedor" en productos
Tagline: Vaqueras y botines premium       ← una línea descriptiva
Orden: 1                                   ← controla el orden de aparición en home
Activo: ✓                                  ← desmarcar para ocultar sin borrar
```

**Guardar**. La marca aparece automáticamente en el home y `/marcas` en ~60 segundos.

🔴 **Para que la página `/marcas/josepha` muestre productos**: cada producto de esa marca debe tener `Proveedor: Josepha` exactamente (case-sensitive).

---

## 🎬 Cambiar slides del Hero (home)

El Hero rotativo del home también usa Metaobjects.

**Ruta**: Configuración → **Metacampos y metaobjetos** → **Hero Slide** → **Agregar entrada** (o editar uno existente).

### Campos:
```
Identificador: coleccion-otono         ← slug interno
Image: 2400 × 1200 px, JPG               ← formato horizontal 2:1
Eyebrow: Colección · Otoño              ← texto pequeño arriba
Title: Hecho en León.                    ← headline grande (max 4 palabras)
Link URL:
  Texto: Ver colección                   ← (no se muestra, requerido por Shopify)
  URL: https://main.dlrgtndu7af79.amplifyapp.com/mujer   ← URL completa, no path relativo
Sort order: 1                            ← orden de aparición
Is active: true                          ← false para ocultar sin borrar
```

⚠️ La URL debe llevar `https://` completo (Shopify rechaza paths relativos). El código extrae automáticamente el pathname, así que cuando cambies a dominio custom, las entries no se rompen.

---

## 📊 Configurar lo que vende: pagos, envíos, impuestos

Esto NO es para subir productos pero es CRÍTICO para que el checkout funcione.

### Pagos
**Configuración → Pagos** → activa una opción:
- **Mercado Pago** (lo más usado MX, comisión ~3.5% por transacción)
- **Stripe** (comisión similar, más caro)
- **Shopify Payments** (no disponible en todos los países)

### Envíos
**Configuración → Envío y entrega** → crea **Zona de envío**:

**Zona "México"**:
- Tarifa fija: `Envío estándar — $150 MXN` (2-5 días hábiles)
- Tarifa fija: `Envío gratis a partir de $3,000` (condicional)

**Zona "Estados Unidos"**:
- Tarifa fija: `Envío internacional — $499 MXN` (7-10 días hábiles)

### Impuestos
**Configuración → Impuestos y derechos** → activar para México:
- IVA 16% (México)
- Configurar como "incluido en precio" si los precios ya tienen IVA

### Emails de notificación
**Configuración → Notificaciones** → editar:
- Email del remitente: `hola@botasleon.com` (necesitas configurar SPF/DKIM en el DNS de tu dominio para que no caigan en spam)
- Logo en email: subir el mismo logo del header
- Editar texto de los emails (confirmación, envío, cancelación) con tu voz de marca

---

## 🔧 Troubleshooting común

### "Mi producto no aparece en `/mujer` aunque marqué Sexo objetivo = Femenino"
**Causa**: el metaobject de Femenino en tu tienda tiene handle distinto al que espera mi código (`femenino`).
**Solución**: verifica que el metafield se haya guardado con la opción **"Femenino"** (no "Female" o "F" — debe ser la opción en español que Shopify ya tiene).

### "Mi marca Josepha no aparece en `/marcas`"
**Causa**: el Brand metaobject no está marcado como Activo.
**Solución**: editar el metaobject → `is_active = true`.

### "La página de marca `/marcas/josepha` está vacía aunque tengo productos"
**Causa**: el campo `Proveedor` de los productos no coincide exactamente con el `name` del Brand metaobject. Case-sensitive: `Josepha` ≠ `josepha` ≠ `JOSEPHA`.
**Solución**: editar productos en Shopify → corregir el Proveedor.

### "Subí un producto pero no aparece en el site"
**Causas posibles**:
1. Estado del producto = Borrador (debe ser **Activo**)
2. Publicación no incluye "Tienda online" (todos los canales)
3. Aún no han pasado 60 segundos (esperar)
4. Inventario en 0 + "Continuar vendiendo sin stock" desactivado → aparece como agotado

### "El precio se ve raro / sin centavos / con coma"
Shopify formatea según locale. Si pones `4499` en el precio, el site lo muestra como `$4,499`. Si pones `4499.50` lo muestra como `$4,499.50`. La función `formatMoney` del código maneja eso.

### "Quiero ocultar un producto temporalmente sin borrarlo"
Estado del producto → **Borrador** (no Activo). Se conserva todo, deja de aparecer en el site al siguiente revalidate (~60s).

---

## 📅 Frecuencia recomendada

| Tarea | Frecuencia |
|---|---|
| Subir productos nuevos | Conforme lleguen del proveedor |
| Actualizar Hero | 1-2 veces por mes (campañas, temporada) |
| Agregar marca nueva | Cuando firmes con distribuidor |
| Auditar inventario | Semanal (Shopify avisa cuando bajo) |
| Revisar pedidos | Diario en horario laboral |

---

## 📞 Si algo se rompe

1. **Verifica primero**: producto en Shopify admin con estado Activo + Tienda Online en publicaciones
2. **Espera 60 segundos** (revalidate del site)
3. **Hard refresh** del browser (Cmd+Shift+R)
4. Si persiste, ping a Claude (yo) con: handle del producto + URL donde falla + screenshot
