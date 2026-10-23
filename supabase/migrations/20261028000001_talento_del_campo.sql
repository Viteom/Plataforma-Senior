-- Talento del campo (decisión del 27 oct 2026). La sección que antes era solo «Experiencias con
-- saberes» ahora ofrece dos cosas, ambas armadas por Vasees con personas del territorio que no
-- usan tecnología:
--   · experiencia: talleres y ceremonias para equipos de empresa (lo que ya existía).
--   · oficio: trabajos por encargo (un pedido de tejidos, una restauración, un servicio en el
--     territorio). Usa la misma cotización: «personas» pasa a ser la cantidad de piezas o trabajos.
-- Mismas reglas: solo se publica con la aprobación de quien lo hace, y la empresa solo ve lo
-- publicado.

alter table experiences
  add column tipo text not null default 'experiencia' check (tipo in ('experiencia', 'oficio'));
