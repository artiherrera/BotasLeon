<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# El espacio que desaparece en el texto de las páginas

Si escribes `</strong> and we&apos;ll ...`, **el espacio no llega al HTML**: sale
"...and we'll" pegado a la palabra anterior. Medido el 2026-11-24 en el build de
producción: 8 pegotes vivos en el sitio, 7 de ellos en un nodo de texto que
llevaba una entidad (`&apos;`, `&ndash;`) en alguna parte, aunque el espacio
estuviera escrito en el mismo renglón. El otro era el caso conocido: texto que
empieza en renglón nuevo después de la etiqueta.

**Pon `{" "}` siempre que una etiqueta inline (`strong`, `em`, `Link`) pegue con
el texto que sigue.** No confíes en el espacio literal. Para revisarlo, busca en
`.next/server/app/**/*.html` una etiqueta de cierre seguida de letra.
