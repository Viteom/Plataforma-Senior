# Plataforma Senior

PWA que conecta talento con trayectoria con empresas. Nombre de trabajo hasta el brandbook.

- Brief y fuente única: [docs/brief.md](docs/brief.md)
- Reglas del repositorio: [CLAUDE.md](CLAUDE.md)
- Sistema de diseño: [design-system/plataforma-senior/MASTER.md](design-system/plataforma-senior/MASTER.md)
- Probar en el celular: [docs/probar-en-celular.md](docs/probar-en-celular.md)
- Capa de IA: [docs/ia-desde-moai.md](docs/ia-desde-moai.md)

## Comandos

| Comando | Para qué |
|---|---|
| `npm run dev` | Desarrollo en http://localhost:3000 (sin service worker) |
| `npm run build` y `npm start` | Versión de producción, con PWA |
| `npm test` | Pruebas: acceso a datos por rol (Postgres en memoria), rutas, formularios y palabras prohibidas |
| `npm run lint` | Revisión de código |
| `npm run iconos` | Regenera los íconos provisionales |
| `npm run db:start` | Supabase local (requiere Docker Desktop) |
| `npm run db:reset` | Recrea la base local y aplica las migraciones |

## Estado

Hito 1 (base, en `main`): pantallas navegables de los tres roles con datos de ejemplo, tokens de diseño,
PWA y migración inicial con RLS activada. El acceso con código y las políticas por rol llegan en
el hito 2.

Hito 2 (acceso y roles, en `main`): roles, reglas por fila, vista anónima para empresas y
entrada con código lista para conectar. Ver [docs/hito-2.md](docs/hito-2.md).

Hito 3 (perfil y huella, rama `hito-3-perfil-huella`): perfil en 3 pasos que guarda, historia
escrita o dictada, capa de IA apagada hasta aprobar el prompt, evidencias, guía de tarifas y Mi
perfil. Ver [docs/hito-3.md](docs/hito-3.md) y [docs/prompt-extraccion.md](docs/prompt-extraccion.md).
