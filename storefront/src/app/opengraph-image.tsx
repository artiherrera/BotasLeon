import { ImageResponse } from "next/og"

/**
 * Open Graph image — la miniatura editorial que aparece al compartir el
 * link en WhatsApp, Twitter, Facebook, iMessage, Slack, etc.
 *
 * Diseño: composición editorial sobre fondo cuero con tipografía cargada
 * desde Google Fonts (Zilla Slab + Inter). Ornamentos western centrados,
 * cartouche con tagline, footer con value props. Sin requerir fotografía
 * externa — todo composable vía Satori al build.
 *
 * Crítico para Satori:
 *  - Cada div con múltiples hijos requiere display: flex/grid explícito
 *  - Solo subset CSS soportado (no transform 3D, no animation)
 *  - Fonts cargadas vía fetch + ArrayBuffer al ImageResponse
 *
 * Fallback graceful: si la fuente falla de cargar (red lenta en build),
 * cae a serif default — la imagen sigue saliendo, solo con tipografía
 * sistémica. Mejor que romper el build.
 */

export const size = { width: 1200, height: 630 }
export const contentType = "image/png"
export const alt = "BotasLeón — 380 años de experiencia. Botas hechas en León."

// Paleta cuero
const CUERO_DARK = "#2A1A12"
const CUERO = "#4B2E1F"
const CUERO_LIGHT = "#6B4423"
const GOLD = "#D4AF37"
const CREAM = "#FBF8F1"
const CREAM_SOFT = "#EFE5D0"

async function loadGoogleFont(family: string, weight: number, text: string) {
  try {
    const url = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(
      family
    )}:wght@${weight}&text=${encodeURIComponent(text)}`
    const css = await fetch(url, {
      headers: {
        // user-agent específico fuerza WOFF en lugar de WOFF2 que Satori
        // no procesa bien en algunos casos.
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    }).then((r) => r.text())
    const fontUrlMatch = css.match(/src: url\(([^)]+)\) format\('(opentype|truetype)'\)/)
    if (!fontUrlMatch) return null
    const data = await fetch(fontUrlMatch[1]).then((r) => r.arrayBuffer())
    return data
  } catch {
    return null
  }
}

export default async function OpengraphImage() {
  // Texto que aparecerá en la imagen — pasado a Google Fonts API para que
  // solo descargue glyphs necesarios (mucho más rápido al build).
  const displayText = "BotasLeón"
  const taglineText = "380 años de experiencia. A la puerta de tu casa."
  const footerText = "HECHO EN LEÓN, GUANAJUATO · ENVÍO A MÉXICO Y EEUU"
  const eyebrowText = "ESTABLECIDA EN LEÓN, GTO."
  // Subset de glyphs solo para texto real — los ornamentos son divs CSS,
  // no necesitan estar en la fuente.
  const allText = displayText + taglineText + footerText + eyebrowText

  const [zillaBold, interMedium] = await Promise.all([
    loadGoogleFont("Zilla Slab", 700, allText),
    loadGoogleFont("Inter", 500, allText),
  ])

  const fonts: Array<{
    name: string
    data: ArrayBuffer
    weight: 400 | 500 | 700
    style: "normal"
  }> = []
  if (zillaBold) {
    fonts.push({ name: "Zilla Slab", data: zillaBold, weight: 700, style: "normal" })
  }
  if (interMedium) {
    fonts.push({ name: "Inter", data: interMedium, weight: 500, style: "normal" })
  }

  const displayFont = zillaBold ? "Zilla Slab" : "serif"
  const bodyFont = interMedium ? "Inter" : "sans-serif"

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          // Gradient cuero — radial para profundidad + linear de fondo
          backgroundImage: `
            radial-gradient(ellipse at center, ${CUERO_LIGHT} 0%, ${CUERO} 45%, ${CUERO_DARK} 100%)
          `,
          backgroundColor: CUERO,
        }}
      >
        {/* Texture overlay — radial sutil para feel "estudio" */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            backgroundImage: `
              radial-gradient(circle at 25% 20%, rgba(255,255,255,0.10) 0%, transparent 40%),
              radial-gradient(circle at 75% 80%, rgba(0,0,0,0.35) 0%, transparent 50%)
            `,
            mixBlendMode: "overlay",
          }}
        />

        {/* Marco interior — espacio editorial */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "60px 80px",
            position: "relative",
            zIndex: 1,
          }}
        >
          {/* Eyebrow */}
          <div
            style={{
              fontFamily: bodyFont,
              fontSize: 18,
              color: GOLD,
              letterSpacing: "0.35em",
              fontWeight: 500,
              marginBottom: 24,
            }}
          >
            {eyebrowText}
          </div>

          {/* Divider con ornamento */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 18,
              marginBottom: 28,
              opacity: 0.85,
            }}
          >
            <div
              style={{
                display: "flex",
                width: 120,
                height: 1,
                backgroundColor: GOLD,
              }}
            />
            {/* Rombo dorado — div rotado 45° (Satori friendly, no requiere
                unicode/font con el glyph ✦). */}
            <div
              style={{
                display: "flex",
                width: 14,
                height: 14,
                backgroundColor: GOLD,
                transform: "rotate(45deg)",
              }}
            />
            <div
              style={{
                display: "flex",
                width: 120,
                height: 1,
                backgroundColor: GOLD,
              }}
            />
          </div>

          {/* Wordmark BotasLeón */}
          <div
            style={{
              fontFamily: displayFont,
              fontSize: 152,
              color: CREAM,
              fontWeight: 700,
              lineHeight: 0.95,
              letterSpacing: "-0.02em",
              marginBottom: 28,
              // Sombra cuero sutil — siente cincelado
              textShadow: "0 2px 0 rgba(0,0,0,0.25)",
            }}
          >
            {displayText}
          </div>

          {/* Divider inferior con ornamento — mirror del superior */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 18,
              marginBottom: 32,
              opacity: 0.85,
            }}
          >
            <div
              style={{
                display: "flex",
                width: 120,
                height: 1,
                backgroundColor: GOLD,
              }}
            />
            {/* Rombo dorado — div rotado 45° (Satori friendly, no requiere
                unicode/font con el glyph ✦). */}
            <div
              style={{
                display: "flex",
                width: 14,
                height: 14,
                backgroundColor: GOLD,
                transform: "rotate(45deg)",
              }}
            />
            <div
              style={{
                display: "flex",
                width: 120,
                height: 1,
                backgroundColor: GOLD,
              }}
            />
          </div>

          {/* Tagline */}
          <div
            style={{
              display: "flex",
              fontFamily: displayFont,
              fontSize: 38,
              color: CREAM_SOFT,
              textAlign: "center",
              lineHeight: 1.25,
              maxWidth: 920,
              fontStyle: "normal",
              fontWeight: 700,
            }}
          >
            {taglineText}
          </div>
        </div>

        {/* Footer banda cream con value props */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: 64,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: CREAM,
            borderTop: `3px solid ${GOLD}`,
          }}
        >
          <div
            style={{
              fontFamily: bodyFont,
              fontSize: 18,
              color: CUERO,
              letterSpacing: "0.25em",
              fontWeight: 500,
            }}
          >
            {footerText}
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: fonts.length > 0 ? fonts : undefined,
    }
  )
}
