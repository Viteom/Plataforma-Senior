# Plataforma Senior

PWA que conecta talento con trayectoria con empresas. Nombre de trabajo hasta el brandbook.

- Brief y fuente única: [docs/brief.md](docs/brief.md)
- Reglas del repositorio: [CLAUDE.md](CLAUDE.md)
- Sistema de diseño: [design-system/plataforma-senior/MASTER.md](design-system/plataforma-senior/MASTER.md)
- Probar en el celular: [docs/probar-en-celular.md](docs/probar-en-celular.md)

## Comandos

| Comando | Para qué |
|---|---|
| `npm run dev` | Desarrollo en http://localhost:3000 (sin service worker) |
| `npm run build` y `npm start` | Versión de producción, con PWA |
| `npm test` | Pruebas (incluye palabras prohibidas en la interfaz) |
| `npm run lint` | Revisión de código |
| `npm run iconos` | Regenera los íconos provisionales |
| `npm run db:start` | Supabase local (requiere Docker Desktop) |
| `npm run db:reset` | Recrea la base local y aplica las migraciones |

## Estado

Hito 1 (base): pantallas navegables de los tres roles con datos de ejemplo, tokens de diseño,
PWA y migración inicial con RLS activada. El acceso con código y las políticas por rol llegan en
el hito 2.
