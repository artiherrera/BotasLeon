import { LocalizedLink as Link } from "@/components/LocalizedLink"
import { T } from "@/components/T"
import { descuentoMaximo, cuantasConOferta } from "@/lib/ofertas/datos"
import { eventoActual, llaveNombreEvento, ROJO_OFERTA, RUTA_OFERTAS } from "@/lib/ofertas/config"

/**
 * La banda de temporada de la portada: cuánto se baja y a dónde ir a verlo.
 *
 * Va ARRIBA DE TODO, antes de la foto grande, que es donde la pidió el spec.
 * Es lo primero que ve quien llega a la portada durante la campaña.
 *
 * NO REPITE EL CINTILLO DE ARRIBA, aunque compartan color. El cintillo vive en
 * la cabecera, se ve en todas las páginas y lleva el reloj; esto es un bloque
 * de la portada con el número grande y un botón. Uno es un aviso permanente;
 * el otro, la puerta.
 *
 * EL NÚMERO SALE DE LA SIMULACIÓN, no de un texto escrito a mano: es el mayor
 * descuento que Shopify cobró de verdad al meter cada bota a un carrito (ver
 * lib/ofertas/datos.ts). Si mañana no hay ninguna oferta, `descuentoMaximo`
 * devuelve 0, esto no se pinta y la portada vuelve a empezar por la foto.
 * Lo mismo pasa con el interruptor apagado.
 *
 * SOBRE EL ROJO NO HAY TEXTO CHICO más abajo de lo que aguanta: el blanco
 * sobre #C8102E da 5.89:1, holgado para la AA incluso en texto normal.
 */
export function BandaOfertas() {
  const maximo = descuentoMaximo()
  if (maximo <= 0) return null

  const cuantas = cuantasConOferta()
  const evento = eventoActual()

  return (
    <section style={{ backgroundColor: ROJO_OFERTA }} className="text-bg">
      <Link
        href={RUTA_OFERTAS}
        className="group contenedor flex flex-wrap items-center justify-center gap-x-6 gap-y-3 py-5 text-center md:justify-between md:text-left"
      >
        <div className="flex flex-wrap items-baseline justify-center gap-x-4 gap-y-1 md:justify-start">
          <p className="text-[13px] font-bold uppercase leading-none tracking-[0.14em]">
            <T k={llaveNombreEvento(evento)} />
          </p>
          <p
            className="font-bold uppercase leading-none tracking-[0.01em] tabular-nums"
            style={{ fontSize: "clamp(1.5rem, 3.4vw, 2.25rem)" }}
          >
            <T k="oferta.hasta" vars={{ pct: String(maximo) }} />
          </p>
          {/* Cuántas botas: convierte una promesa en un hecho comprobable, y
              de paso dice que hay de dónde escoger. */}
          <p className="text-[14px] leading-none opacity-90">
            <T k="oferta.cuantas" vars={{ n: String(cuantas) }} />
          </p>
        </div>

        <span className="inline-flex items-center gap-2 bg-bg px-5 py-2.5 text-[14px] font-bold uppercase leading-none tracking-[0.06em] transition-transform duration-[180ms] group-hover:translate-x-1 motion-reduce:transition-none motion-reduce:group-hover:translate-x-0"
          style={{ color: ROJO_OFERTA }}
        >
          <T k="oferta.verOfertas" />
          <span aria-hidden>→</span>
        </span>
      </Link>
    </section>
  )
}
