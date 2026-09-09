import { readFile } from "node:fs/promises"
import { join } from "node:path"
import { ImageResponse } from "next/og"
import { LOCALES } from "@/lib/i18n/config"
import { isMX } from "@/lib/market"

/**
 * Open Graph image — la miniatura que aparece al compartir el link en
 * WhatsApp, Twitter, Facebook, iMessage, Slack, etc.
 *
 * Diseño DÍPTICO: dos fotos editoriales reales de la tienda (hombre · mujer,
 * las mismas portadas de categoría del sitio) flanqueando una banda de cuero
 * central con el wordmark blanco de BotasLeón, ornamento western y tagline.
 * Muestra PRODUCTO real — mucho más atractivo que un degradado con logo.
 *
 * Las fotos se jalan de Shopify al build (metaobjects category_card) para
 * mantenerse en sync con el sitio; si eso falla, cae a URLs conocidas; si las
 * fotos no cargan del todo, cae a una banda de cuero a todo lo ancho (nunca
 * rompe el build ni sale sin imagen).
 *
 * Crítico para Satori:
 *  - Cada div con múltiples hijos requiere display: flex/grid explícito
 *  - Solo subset CSS soportado (no transform 3D, no animation)
 *  - Fonts cargadas vía fetch + ArrayBuffer al ImageResponse
 */

export const size = { width: 1200, height: 630 }
export const contentType = "image/png"
// El alt dice para quién es este despliegue: la .mx no vende "para Estados Unidos".
export const alt = isMX
  ? "BotasLeón — 380 años de tradición. Botas hechas en León, para todo México."
  : "BotasLeón — 380 años de tradición. Botas hechas en León, para Estados Unidos."

// Genera la OG para ambos idiomas (es/en) en el build estático.
export function generateStaticParams() {
  // Lee LOCALES en vez de fijar los dos: en la .mx (solo español) esto estaba
  // generando /en/opengraph-image, una URL en inglés en un sitio que ya no
  // publica inglés.
  return LOCALES.map((lang) => ({ lang }))
}

// Paleta del sistema visual v3 (los mismos seis colores de globals.css). Esta
// imagen es lo que se ve al compartir el sitio en WhatsApp o Facebook: es la
// primera impresión de la marca, y hasta ahora iba en oro con degradados,
// que el sistema no tiene. El acento es cuero y no hay más.
const TINTA = "#191A19"
const CUERO = "#2A1A12" // banda del pie, un tono por encima de la tinta
const GOLD = "#B08A5F" // acento sobre fondo oscuro: el cuero #6B4A2E no contrasta
const CREAM = "#FBF8F1"
const CREAM_SOFT = "#E7E1D3"

// Geometría del díptico (1200 de ancho). Anchos EXPLÍCITOS — Satori no expande
// bien `flex:1`, así que sumamos a mano: 384 + 432 + 384 = 1200.
const PHOTO_W = 384
const CENTER_W = size.width - PHOTO_W * 2 // 432
const LOGO_W = 292
const LOGO_H = Math.round(LOGO_W * (220 / 800))
const SEAM_X_L = PHOTO_W // 384
const SEAM_X_R = size.width - PHOTO_W // 816

// URLs de respaldo (portadas de categoría) por si el fetch a Shopify falla.
const FALLBACK_HOMBRE =
  "https://cdn.shopify.com/s/files/1/0729/4618/8470/files/DSC09698.jpg"
const FALLBACK_MUJER =
  "https://cdn.shopify.com/s/files/1/0729/4618/8470/files/DSC09729.jpg"

/** Lee un archivo de /public y lo devuelve como data URL (o null si falla). */
async function loadPublicImage(file: string): Promise<string | null> {
  try {
    const path = join(process.cwd(), "public", file)
    const buffer = await readFile(path)
    const ext = file.endsWith(".png") ? "png" : "jpeg"
    return `data:image/${ext};base64,${buffer.toString("base64")}`
  } catch {
    return null
  }
}

/** Descarga una imagen remota (CDN Shopify) y la inyecta como data URL. */
async function fetchImageDataUrl(
  url: string,
  width = 760
): Promise<string | null> {
  try {
    const u = url + (url.includes("?") ? "&" : "?") + `width=${width}`
    const res = await fetch(u)
    if (!res.ok) return null
    const buffer = Buffer.from(await res.arrayBuffer())
    const type = res.headers.get("content-type") || "image/jpeg"
    return `data:${type};base64,${buffer.toString("base64")}`
  } catch {
    return null
  }
}

/** Portadas de categoría (hombre/mujer) desde Shopify; cae a URLs conocidas. */
async function getCoverUrls(): Promise<{ hombre: string; mujer: string }> {
  const out = { hombre: FALLBACK_HOMBRE, mujer: FALLBACK_MUJER }
  const domain = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN
  const token = process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN
  const version = process.env.NEXT_PUBLIC_SHOPIFY_API_VERSION || "2025-01"
  if (!domain || !token) return out
  try {
    const res = await fetch(`https://${domain}/api/${version}/graphql.json`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Storefront-Access-Token": token,
      },
      body: JSON.stringify({
        query: `{ metaobjects(type:"category_card", first:20){ edges{ node{ fields{ key value reference{ ... on MediaImage { image { url } } } } } } } }`,
      }),
    })
    const json = await res.json()
    for (const e of json?.data?.metaobjects?.edges ?? []) {
      const f = e.node.fields as Array<{
        key: string
        value?: string
        reference?: { image?: { url?: string } }
      }>
      const link = (f.find((x) => x.key === "link_url")?.value || "").toLowerCase()
      const im = f.find((x) => x.key === "image")?.reference?.image?.url
      if (!im) continue
      if (link.includes("/hombre")) out.hombre = im
      else if (link.includes("/mujer")) out.mujer = im
    }
  } catch {
    // se queda con los fallback
  }
  return out
}

/**
 * Lee una tipografía de scripts/fonts en TTF. Antes se bajaba de Google en
 * tiempo de build; se dejó de hacer porque un deploy real se cayó cuando
 * fonts.gstatic.com devolvió 404 a media compilación. Y tiene que ser TTF:
 * Satori (next/og) no lee WOFF2, así que los archivos de src/fonts que usa el
 * sitio no sirven aquí.
 */
async function loadLocalFont(file: string): Promise<ArrayBuffer | null> {
  try {
    const buffer = await readFile(join(process.cwd(), "scripts", "fonts", file))
    return buffer.buffer.slice(
      buffer.byteOffset,
      buffer.byteOffset + buffer.byteLength
    ) as ArrayBuffer
  } catch {
    return null
  }
}

/** Ornamento western: línea — rombo — línea (divs, sin glyphs de fuente). */
function Ornament({ width = 78 }: { width?: number }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 14,
      }}
    >
      <div style={{ display: "flex", width, height: 1.5, backgroundColor: GOLD }} />
      <div
        style={{
          display: "flex",
          width: 10,
          height: 10,
          backgroundColor: GOLD,
          transform: "rotate(45deg)",
        }}
      />
      <div style={{ display: "flex", width, height: 1.5, backgroundColor: GOLD }} />
    </div>
  )
}

/** Banda de cuero central con el wordmark + tagline (reusada en el fallback). */
function CenterBand({
  logo,
  fullWidth,
  displayFont,
  bodyFont,
  texts,
}: {
  logo: string | null
  fullWidth: boolean
  displayFont: string
  bodyFont: string
  texts: { eyebrow: string; taglineA: string; taglineB: string; ship: string }
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        width: fullWidth ? size.width : CENTER_W,
        height: size.height,
        padding: "0 44px",
        position: "relative",
        backgroundColor: TINTA,
      }}
    >
      {/* Highlight superior sutil para profundidad */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          backgroundImage: `radial-gradient(ellipse at 50% 12%, rgba(255,255,255,0.10) 0%, transparent 55%)`,
        }}
      />

      {/* Eyebrow */}
      <div
        style={{
          fontFamily: bodyFont,
          fontSize: 15,
          color: GOLD,
          letterSpacing: "0.26em",
          fontWeight: 500,
          marginBottom: 22,
          textAlign: "center",
        }}
      >
        {texts.eyebrow}
      </div>

      <div style={{ display: "flex", marginBottom: 26, opacity: 0.9 }}>
        <Ornament />
      </div>

      {/* Wordmark blanco (imagen). Si no carga, cae al texto en la serif. */}
      {logo ? (
        <img
          src={logo}
          width={LOGO_W}
          height={LOGO_H}
          alt="BotasLeón"
          style={{ display: "block", width: LOGO_W, height: LOGO_H }}
        />
      ) : (
        <div
          style={{
            fontFamily: displayFont,
            fontSize: 66,
            color: CREAM,
            fontWeight: 700,
            letterSpacing: "-0.01em",
            lineHeight: 1,
          }}
        >
          BotasLeón
        </div>
      )}

      <div style={{ display: "flex", marginTop: 26, marginBottom: 26, opacity: 0.9 }}>
        <Ornament />
      </div>

      {/* Tagline */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          fontFamily: displayFont,
          fontSize: 26,
          fontWeight: 700,
          color: CREAM_SOFT,
          textAlign: "center",
          lineHeight: 1.28,
        }}
      >
        <div style={{ display: "flex" }}>{texts.taglineA}</div>
        <div style={{ display: "flex" }}>{texts.taglineB}</div>
      </div>

      {/* Envío */}
      <div
        style={{
          fontFamily: bodyFont,
          fontSize: 13,
          color: GOLD,
          letterSpacing: "0.22em",
          fontWeight: 500,
          marginTop: 28,
          textAlign: "center",
        }}
      >
        {texts.ship}
      </div>
    </div>
  )
}

/** Panel de foto (recorte cover, alto completo). */
function Photo({ src }: { src: string }) {
  return (
    <div
      style={{
        display: "flex",
        width: PHOTO_W,
        height: size.height,
        overflow: "hidden",
      }}
    >
      <img
        src={src}
        width={PHOTO_W}
        height={size.height}
        style={{ width: PHOTO_W, height: size.height, objectFit: "cover" }}
        alt=""
      />
    </div>
  )
}

const TEXTS = {
  es: {
    eyebrow: "ESTABLECIDA EN LEÓN · GTO.",
    taglineA: "380 años de tradición.",
    taglineB: "A la puerta de tu casa.",
    ship: "ENVÍO A TODO ESTADOS UNIDOS",
  },
  en: {
    eyebrow: "ESTABLISHED IN LEÓN · MEXICO",
    taglineA: "380 years of tradition.",
    taglineB: "Right to your doorstep.",
    ship: "SHIPPING ACROSS THE U.S.",
  },
}

export default async function OpengraphImage({
  params,
}: {
  params?: Promise<{ lang?: string }> | { lang?: string }
}) {
  const resolved = params ? await params : undefined
  const texts = resolved?.lang === "es" ? TEXTS.es : TEXTS.en

  const covers = await getCoverUrls()
  const [serifDisplay, sansMedium, logo, hombre, mujer] = await Promise.all([
    loadLocalFont("InstrumentSerif-Regular.ttf"),
    loadLocalFont("InstrumentSans-Medium.ttf"),
    loadPublicImage("logo_botasleon_white.png"),
    fetchImageDataUrl(covers.hombre),
    fetchImageDataUrl(covers.mujer),
  ])

  const fonts: Array<{
    name: string
    data: ArrayBuffer
    weight: 400 | 500 | 600 | 700
    style: "normal"
  }> = []
  // Instrument Serif solo existe en 400: pedirle 600 haría que Satori lo
  // engordara a la fuerza, que es justo lo que se ve barato.
  if (serifDisplay)
    fonts.push({ name: "Instrument Serif", data: serifDisplay, weight: 400, style: "normal" })
  if (sansMedium)
    fonts.push({ name: "Instrument Sans", data: sansMedium, weight: 500, style: "normal" })

  const displayFont = serifDisplay ? "Instrument Serif" : "serif"
  const bodyFont = sansMedium ? "Instrument Sans" : "sans-serif"

  // Díptico solo si AMBAS fotos cargaron; si no, banda de cuero a todo lo ancho.
  const diptico = Boolean(hombre && mujer)

  return new ImageResponse(
    (
      <div
        style={{
          width: size.width,
          height: size.height,
          display: "flex",
          flexDirection: "row",
          position: "relative",
          backgroundColor: CUERO,
        }}
      >
        {diptico ? (
          <>
            <Photo src={hombre as string} />
            <CenterBand
              logo={logo}
              fullWidth={false}
              displayFont={displayFont}
              bodyFont={bodyFont}
              texts={texts}
            />
            <Photo src={mujer as string} />
            {/* Hairlines doradas en las costuras */}
            <div
              style={{
                position: "absolute",
                top: 0,
                height: size.height,
                left: SEAM_X_L - 1.5,
                width: 3,
                display: "flex",
                backgroundColor: GOLD,
              }}
            />
            <div
              style={{
                position: "absolute",
                top: 0,
                height: size.height,
                left: SEAM_X_R - 1.5,
                width: 3,
                display: "flex",
                backgroundColor: GOLD,
              }}
            />
          </>
        ) : (
          <CenterBand
            logo={logo}
            fullWidth
            displayFont={displayFont}
            bodyFont={bodyFont}
            texts={texts}
          />
        )}
      </div>
    ),
    {
      ...size,
      fonts: fonts.length > 0 ? fonts : undefined,
    }
  )
}
