// Arma los archivos para crear una base de Kánna desde cero en el SQL Editor de Supabase
// (docs/ruta-piloto.md). Junta las migraciones en orden y corta después de cada una que agrega
// valores a un tipo (alter type ... add value): Postgres no deja usar un valor nuevo en la misma
// transacción en que se creó. Cada parte registra sus migraciones en schema_migrations.
//
// Uso: node scripts/preparar-sql-supabase.mjs [carpeta de salida]
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const RAIZ = join(import.meta.dirname, "..", "supabase", "migrations");
const salida = process.argv[2] ?? join(import.meta.dirname, "..", "..", "supabase-sql", "produccion");
mkdirSync(salida, { recursive: true });

const archivos = readdirSync(RAIZ).filter((f) => f.endsWith(".sql")).sort();
const partes = [[]];
for (const archivo of archivos) {
  partes.at(-1).push(archivo);
  if (/alter\s+type\s+\w+\s+add\s+value/i.test(readFileSync(join(RAIZ, archivo), "utf8"))) partes.push([]);
}
if (!partes.at(-1).length) partes.pop();

partes.forEach((lista, i) => {
  const cuerpo = lista
    .map((archivo) => {
      const [version, ...resto] = archivo.replace(/\.sql$/, "").split("_");
      return [
        `-- ═══ ${archivo} ═══`,
        readFileSync(join(RAIZ, archivo), "utf8").trim(),
        `insert into supabase_migrations.schema_migrations (version, name) values ('${version}', '${resto.join("_")}') on conflict (version) do nothing;`,
      ].join("\n\n");
    })
    .join("\n\n");
  const nombre = `parte-${i + 1}-de-${partes.length}.sql`;
  writeFileSync(
    join(salida, nombre),
    [
      `-- Kánna · base nueva, parte ${i + 1} de ${partes.length}: ${lista[0]} a ${lista.at(-1)}.`,
      `-- Pegar completo en el SQL Editor y oprimir Run sin seleccionar nada. Después, la parte ${i + 2 > partes.length ? "de verificación (verificar.sql)" : i + 2}.`,
      "create schema if not exists supabase_migrations;",
      "create table if not exists supabase_migrations.schema_migrations (version text primary key, statements text[], name text);",
      "begin;",
      cuerpo,
      "commit;",
      "",
    ].join("\n\n"),
  );
  console.log(`${nombre}: ${lista.length} migraciones`);
});

writeFileSync(
  join(salida, "verificar.sql"),
  `-- Kánna · verificación de una base nueva. Debe dar ${archivos.length} migraciones, RLS activada en todas las tablas y 0 filas en «sin_rls».
select count(*) as migraciones, max(version) as ultima from supabase_migrations.schema_migrations;
select c.relname as sin_rls from pg_class c join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relkind = 'r' and not c.relrowsecurity;
select jobname, schedule from cron.job where jobname = 'kanna-limpieza-diaria';
`,
);
console.log(`verificar.sql · ${archivos.length} migraciones en total`);
