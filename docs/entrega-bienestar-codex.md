# Entrega de bienestar de Kánna para revisión

Rama: `bienestar-codex`.
Base exacta de `main`: `bd9912858fbb6677547e2155d1fa8a0dd8a8fb2c`.
Commit de implementación: `421253f`.

Se guardaron los cambios locales, los archivos nuevos sin seguimiento y las eliminaciones de
los retratos anteriores. No se fusionó esta rama en `main`.

## Publicación y base de datos

Las migraciones `20261031000001` a `20261031000007` se incluyen únicamente como archivos para
revisión: no se aplicaron en Supabase. Las pruebas de base de datos utilizan PGlite en memoria.
No se ejecutó ningún despliegue en Vercel. `vercel.json` desactiva los despliegues de Git para
`bienestar-codex`, de modo que subir esta rama no publique la aplicación automáticamente.
Los cobros y desembolsos continúan desactivados.

## Comprobaciones

- `npx vitest run`: 491 pruebas aprobadas en 27 archivos.
- `npx eslint .`: aprobado.
- `npx next build`: aprobado, incluidas las comprobaciones de tipos.
- Comprobación de formato del diff: aprobada. Los archivos PDF y DOCX de prueba se conservan
  como binarios mediante `.gitattributes`.

## Correcciones después de la revisión

- Fotos: se descartaron las de Pexels (tamaños mal declarados y personas que no correspondían a los
  perfiles). La web vuelve a los retratos del brandbook y a las fotos de Sandoná, a color y sin filtro,
  guardados en `public/web/`.
- Hoja de vida: en la demostración no se lee ningún archivo; se muestra un ejemplo fijo.
- Revisión de Kánna: la persona y la organización ven cuándo un acuerdo o un reto espera la revisión,
  y la organización ve cuándo Kánna pidió ajustes.
- Bienestar: migración `20261031000007`. El equipo lee los casos solo por `casos_bienestar_equipo()`,
  que deja registro; borrar un seguimiento ya no borra la solicitud de ayuda.
- Formato: el código vuelve al ancho de 120 columnas del proyecto.

## Pendientes de revisión

El alcance y las decisiones están en [bienestar-y-modelo-operativo.md](bienestar-y-modelo-operativo.md).
Antes de publicar, revisar los hallazgos anteriores de evidencias y aprobación de etiquetas,
comprobar visualmente las imágenes de banco y acordar responsables y protocolo de bienestar.
Esta entrega no declara resueltos esos pendientes.

## Inventario completo

88 archivos: 35 nuevos, 42 modificados y 11 eliminados.

`A`: nuevo; `M`: modificado; `D`: eliminado.

```text
A .gitattributes
M README.md
M app/(registro)/huella/formulario.tsx
M app/(registro)/huella/page.tsx
M app/(registro)/perfil/nuevo/acciones.ts
M app/(registro)/perfil/nuevo/formulario.tsx
A app/(registro)/perfil/nuevo/importar.ts
A app/(talento)/bienestar/acciones.ts
A app/(talento)/bienestar/page.tsx
M app/(talento)/inicio/page.tsx
M app/(talento)/mi-perfil/acciones.ts
M app/(talento)/mi-perfil/demo.tsx
M app/(talento)/mi-perfil/page.tsx
M app/(talento)/mi-perfil/secciones.tsx
M app/(talento)/oportunidades/acciones.ts
M app/(talento)/oportunidades/page.tsx
M app/(web)/campo/page.tsx
M app/(web)/organizaciones/page.tsx
M app/(web)/page.tsx
M app/empresa/acciones.ts
M app/empresa/datos/formulario.tsx
M app/empresa/datos/page.tsx
M app/empresa/problema/nuevo/formulario.tsx
M app/equipo/acciones.ts
M app/equipo/ayuda/page.tsx
A app/equipo/bienestar/acciones.ts
A app/equipo/bienestar/page.tsx
A app/equipo/condiciones/page.tsx
M app/equipo/problema/[id]/page.tsx
M app/sw.ts
A components/bienestar/aviso.tsx
A components/bienestar/formularios.tsx
A components/perfil/foto-demo.tsx
A components/perfil/importar-hoja-vida.tsx
A components/ubicacion/campo-ubicacion.tsx
M components/web/afiche.tsx
M components/web/galeria.tsx
M components/web/huella-viva.tsx
M components/web/pie.tsx
M components/web/retrato.tsx
A docs/bienestar-y-modelo-operativo.md
A docs/entrega-bienestar-codex.md
M lib/auth/rutas.ts
M lib/avisos/programar.ts
A lib/bienestar/resumen.ts
M lib/datos/consultas.ts
M lib/datos/equipo.ts
M lib/datos/tipos.ts
A lib/empresa/validar.ts
M lib/navegacion.ts
A lib/perfil/hoja-vida.ts
A lib/privacidad/foto.ts
M lib/procesos-formularios.ts
A lib/ubicaciones/municipios.json
M lib/web/contenido.ts
M next.config.ts
M package-lock.json
M package.json
D public/marca/retrato-portada.webp
D public/web/campo-sandona.webp
D public/web/campo-tejido.webp
D public/web/detalle-cocina.webp
D public/web/detalle-libro.webp
D public/web/detalle-sandona.webp
D public/web/retrato-azul.webp
D public/web/retrato-cocina.webp
D public/web/retrato-libro.webp
D public/web/retrato-rojo.webp
D public/web/retrato-sombrero.webp
A scripts/leer-hoja-vida.mjs
A supabase/migrations/20261031000001_bienestar_y_empresa.sql
A supabase/migrations/20261031000002_revision_retos.sql
A supabase/migrations/20261031000003_revision_acuerdos.sql
A supabase/migrations/20261031000004_fotos_privadas.sql
A supabase/migrations/20261031000005_carga_y_avisos.sql
A supabase/migrations/20261031000006_casos_bienestar.sql
M tests/db/acceso.test.ts
A tests/db/bienestar.test.ts
M tests/db/conexiones.test.ts
A tests/db/confianza-bienestar.test.ts
M tests/db/procesos.test.ts
A tests/fixtures/hoja-vida-ejemplo.docx
A tests/fixtures/hoja-vida-ejemplo.pdf
A tests/unit/bienestar-registro.test.ts
A tests/unit/fotos-privadas.test.ts
A tests/unit/importacion-demo.test.ts
A tests/unit/lectura-documentos.test.ts
A vercel.json
```
