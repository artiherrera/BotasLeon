import { ImageResponse } from "next/og"

/**
 * Favicon dinámico — genera PNG real al build con emoji 🥾.
 *
 * Next.js convención app/icon.tsx: corre Satori en build time y
 * guarda el PNG resultante. Emoji se renderiza como gráfico, no
 * como text, así que Safari/Firefox/Chrome lo ven igual.
 *
 * Sustituible por logo cuadrado dedicado cuando lo tengamos.
 */

export const size = { width: 64, height: 64 }
export const contentType = "image/png"

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 52,
          background: "#FBF8F1",
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          lineHeight: 1,
        }}
      >
        🥾
      </div>
    ),
    { ...size }
  )
}
