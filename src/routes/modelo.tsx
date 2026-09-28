import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/modelo")({
  component: ModelPage,
});

function ModelPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <p className="text-xs font-medium tracking-widest text-primary uppercase">Arquitectura</p>
      <h1 className="mt-2 text-4xl text-foreground">Qué se ha cambiado del encargo</h1>
      <div className="mt-6 flex flex-col gap-4 text-sm text-muted-foreground">
        <p>
          La compatibilidad no es una matriz dispositivo–coil. Un mod 510 admite atomizadores; la
          coil pertenece a una plataforma de cápsula o a un tanque. El cruce devuelve cuatro
          resultados: nativa, kit, eléctrica o no.
        </p>
        <p>
          No hay pgvector, Clerk, OpenAPI, vistas materializadas ni roles de escritura. Sin
          identidad real, una tabla admin editable por cualquiera no es un archivo. La tabla de este
          sitio exporta CSV y no borra.
        </p>
        <p>
          CBD y tabaco calentado quedan fuera: otro régimen, y no se documentan aquí. Los
          desechables de un solo uso no se mezclan con pods abiertos rellenables.
        </p>
        <p>
          Las fichas de hardware citan fabricante o distribuidor. Donde las fuentes chocan —pantalla
          del XROS 4, una FAQ que llama “single battery” al L200— se dice, no se elige en silencio.
        </p>
        <p>
          La ampliación homogeneiza unidades: ohmios y vatios en número, nicotina en mg/ml, volumen
          en ml de líquido, ratio solo como 50/50 o 70/30 (70/30 significa 70 VG / 30 PG). Un
          cartucho de 0,4 Ω es otra plataforma cuando el fabricante dice que no entra en todos los
          kits. Si el vatio mínimo de la coil supera el máximo del aparato, el cruce es «no», aunque
          la cápsula encaje.
        </p>
        <p>
          No están todos los sabores del mundo. Entran las líneas con formato repetible: sales de 10
          ml a 20 mg/ml de Bombo Bar Juice, OX Passion (solo los tres sabores que OXVA nombra),
          Herrera (catálogo actual más Chufli y Pechuga como histórico) y Drifter Bar. King's Crest
          queda en la colección Bar & Fruits de 10 ml; Don Juan en longfill no tiene mililitros ni
          ratio únicos en la fuente, y no se inventan. Los longfill de Bombo y los 40 ml de Herrera
          quedan fuera por el mismo motivo.
        </p>
        <p>
          La búsqueda imita a un comparador de fichas: cada característica es un filtro con recuento
          y se combina con las demás. «Resistencia integrada» no es un booleano nuevo; es la familia
          Cápsula con resistencia integrada. Cruzarla con una marca ausente devuelve cero fichas.
          Precios por tienda y monetización quedan fuera hasta que el esquema de la ficha deje de
          moverse.
        </p>
        <p>
          La ficha tiene una sola plantilla, spec_def. Lo publicado es una fila de item_spec; si la
          fuente no lo dice, la casilla es «Sin dato publicado». Marca, país, identificador de
          archivo y estado no son características. Las plataformas son relaciones (device_platform,
          coil_platform, part_platform), no un texto del diccionario. El resumen y las salvedades
          tampoco se filtran.
        </p>
        <p>
          Una fila de compat_exclusion aparta un cruce de kit o nativo cuando la fuente no lista ese
          aparato, aunque compartan plataforma. La Z 0,15 y la Z 0,15 XM no son kit del Aegis Legend
          2: el PDF no lo nombra. El cálculo de la aplicación y la función SQL usan los mismos
          casos. Si la ventana eléctrica encaja, el cruce cae a 510 y arrastra el motivo del PDF.
        </p>
        <p>
          Cada número filtrable lleva unidad y confianza. La cita (source_citation) señala una
          característica con spec_slug, o la ficha entera si spec_slug es nulo. El blister —unidades
          y mercado— vive en coil_variant, aparte de la identidad eléctrica. Diámetro de drip tip,
          química y amperios están en la plantilla de componente y se quedan vacíos hasta que haya
          fuente. No hay precios ni marcas inventadas.
        </p>
        <p>
          El SQL de abajo es el modelo Postgres objetivo (3FN, ltree, citext, FTS, RLS de lectura).
          Esta demo no lo ejecuta: la lógica viva está en el cálculo de cruce, Ohm, nicokit y en los
          filtros por característica.
        </p>
      </div>
      <h2 className="mt-10 text-2xl text-foreground">Tablas</h2>
      <ul className="mt-4 grid gap-2 text-sm text-foreground sm:grid-cols-2">
        {[
          "brand",
          "taxon (ltree)",
          "platform",
          "device",
          "device_platform",
          "coil",
          "coil_platform",
          "liquid",
          "liquid_flavor",
          "source_citation",
          "spec_def",
          "item_spec",
          "coil_variant",
          "compat_exclusion",
          "part",
          "part_platform",
        ].map((name) => (
          <li key={name} className="border border-border px-3 py-3">
            {name}
          </li>
        ))}
      </ul>
      <h2 className="mt-10 text-2xl text-foreground">Fuera de esta semilla</h2>
      <ul className="mt-4 flex flex-col gap-2 text-sm text-muted-foreground">
        <li>Pods cerrados tipo JUUL, mecánicos, squonk, boro y pen de más de un modelo.</li>
        <li>Taxonomía de sabor completa. Hay un árbol corto, no doscientos nodos de relleno.</li>
        <li>
          Embeddings, fichas en otro idioma y CRUD con roles. La interfaz está solo en español.
        </li>
        <li>Precios de tiendas, alertas de oferta y cualquier capa de monetización.</li>
      </ul>
      <p className="mt-8">
        <a
          href="/vapelog-esquema.sql"
          download
          className="inline-flex min-h-11 items-center text-foreground underline decoration-border underline-offset-4"
        >
          Descargar el esquema SQL
        </a>
      </p>
    </div>
  );
}
