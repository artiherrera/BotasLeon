/**
 * Subida de imágenes a Cloudinary (unsigned, desde el navegador) — para las
 * fotos de las reseñas. El "unsigned upload preset" está diseñado para usarse
 * del lado del cliente, así que estos valores son PÚBLICOS y seguros aquí.
 *
 * 👉 Llena CLOUD_NAME y UPLOAD_PRESET con tus datos de Cloudinary
 *    (Dashboard → Cloud name · Settings → Upload → unsigned preset).
 *    Mientras estén vacíos, el formulario de reseña oculta la subida de fotos.
 */
export const CLOUDINARY_CLOUD_NAME = "emucbu5d"
export const CLOUDINARY_UPLOAD_PRESET = "resenas_botasleon"

export function cloudinaryEnabled(): boolean {
  return Boolean(CLOUDINARY_CLOUD_NAME && CLOUDINARY_UPLOAD_PRESET)
}

/** Sube un archivo a Cloudinary y devuelve la URL segura de la imagen. */
export async function uploadToCloudinary(file: File): Promise<string> {
  const form = new FormData()
  form.append("file", file)
  form.append("upload_preset", CLOUDINARY_UPLOAD_PRESET)
  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
    { method: "POST", body: form }
  )
  if (!res.ok) throw new Error(`Cloudinary HTTP ${res.status}`)
  const json = (await res.json()) as { secure_url?: string }
  if (!json.secure_url) throw new Error("Cloudinary no devolvió URL")
  return json.secure_url
}
