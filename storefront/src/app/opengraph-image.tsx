import { ImageResponse } from "next/og"

/**
 * Open Graph image — la miniatura que aparece al compartir el link
 * en WhatsApp, Twitter, Facebook, iMessage, Slack, etc.
 *
 * Antes Amplify servía un default genérico (logo AWS). Esta función
 * genera al build una imagen 1200×630 con la marca BotasLeón.
 *
 * Next.js convención app/opengraph-image.tsx → se aplica como OG image
 * a todas las páginas que no overrideen su propia.
 */

export const size = { width: 1200, height: 630 }
export const contentType = "image/png"
export const alt = "BotasLeón — Botas hechas en León, Guanajuato"

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#FBF8F1",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "serif",
          padding: "80px",
          position: "relative",
        }}
      >
        {/* Banda decorativa cuero abajo */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: "60px",
            background: "#4B2E1F",
          }}
        />

        {/* Wordmark grande */}
        <div
          style={{
            fontSize: 140,
            fontWeight: 900,
            color: "#1F1814",
            letterSpacing: "-0.02em",
            lineHeight: 1,
            marginBottom: 30,
          }}
        >
          BotasLeón
        </div>

        {/* Tagline — 2 líneas en flex column (Satori exige display explícito) */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            fontSize: 36,
            color: "#5A4F44",
            textAlign: "center",
            maxWidth: 900,
            lineHeight: 1.3,
          }}
        >
          <span>380 años de experiencia.</span>
          <span>A la puerta de tu casa.</span>
        </div>

        {/* Subtítulo cuero */}
        <div
          style={{
            position: "absolute",
            bottom: 18,
            fontSize: 20,
            color: "#FBF8F1",
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            fontWeight: 600,
          }}
        >
          Hecho en León, Guanajuato
        </div>
      </div>
    ),
    { ...size }
  )
}
