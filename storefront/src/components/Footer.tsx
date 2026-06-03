import Link from "next/link"

/**
 * Footer del storefront. Tres columnas + barra inferior.
 * Tonos oscuros (cuero/negro) para contraste con resto del sitio,
 * actúa como "tierra" visual.
 */
export function Footer() {
  return (
    <footer className="mt-24 bg-leather text-bg-alt">
      <div className="mx-auto max-w-7xl px-6 py-16 grid grid-cols-2 md:grid-cols-4 gap-10">
        <div className="col-span-2 md:col-span-1">
          <h3 className="font-display text-2xl text-bg mb-3">BotasLeón</h3>
          <p className="text-sm text-bg-alt/80 max-w-xs leading-relaxed">
            Botas premium fabricadas en León, Guanajuato. Tradición artesanal
            mexicana en cada par.
          </p>
        </div>

        <div>
          <h4 className="eyebrow text-bg/70 mb-4">Tienda</h4>
          <ul className="space-y-2 text-sm">
            <li><Link href="/hombre" className="hover:text-bg transition-colors">Hombre</Link></li>
            <li><Link href="/mujer" className="hover:text-bg transition-colors">Mujer</Link></li>
            <li><Link href="/nino" className="hover:text-bg transition-colors">Niño</Link></li>
            <li><Link href="/marcas" className="hover:text-bg transition-colors">Marcas</Link></li>
            {/* Outlet oculto hasta que haya productos con compareAtPrice. Re-enable en sync con MegaMenu/MobileNav. */}
          </ul>
        </div>

        <div>
          <h4 className="eyebrow text-bg/70 mb-4">Ayuda</h4>
          <ul className="space-y-2 text-sm">
            <li><Link href="/envios" className="hover:text-bg transition-colors">Envíos</Link></li>
            <li><Link href="/devoluciones" className="hover:text-bg transition-colors">Devoluciones</Link></li>
            <li><Link href="/guia-tallas" className="hover:text-bg transition-colors">Guía de tallas</Link></li>
            <li><Link href="/contacto" className="hover:text-bg transition-colors">Contacto</Link></li>
            <li><Link href="/faq" className="hover:text-bg transition-colors">Preguntas frecuentes</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="eyebrow text-bg/70 mb-4">Empresa</h4>
          <ul className="space-y-2 text-sm">
            <li><Link href="/nosotros" className="hover:text-bg transition-colors">Nosotros</Link></li>
            <li><Link href="/proveedores" className="hover:text-bg transition-colors">Proveedores</Link></li>
            <li><Link href="/terminos" className="hover:text-bg transition-colors">Términos</Link></li>
            <li><Link href="/privacidad" className="hover:text-bg transition-colors">Privacidad</Link></li>
          </ul>
        </div>
      </div>

      <div className="border-t border-bg-alt/20">
        <div className="mx-auto max-w-7xl px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-bg-alt/60">
          <p>© {new Date().getFullYear()} BotasLeón · León, Guanajuato, México.</p>
          <p>Hecho con orgullo en México.</p>
        </div>
      </div>
    </footer>
  )
}
