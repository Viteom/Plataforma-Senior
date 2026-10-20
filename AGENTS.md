# AGENTS.md — Plataforma Senior

Instrucciones para agentes que revisan o modifican este repositorio (por ejemplo, Codex en
revisiones de pull requests). Las reglas completas están en `CLAUDE.md` y la fuente única del
producto es `docs/brief.md`; este archivo no las reemplaza, las resume para la revisión.

PWA en Next.js 15 + TypeScript + Tailwind v4 + Supabase (Postgres con RLS). Interfaz en español
de Colombia. Se construye por hitos (ver "Plan por hitos" en el brief); las pantallas con la
etiqueta "Llega en el hito N" y los datos de `lib/demo.ts` son provisionales a propósito.

## Review guidelines

Responde en español. Prioriza en este orden y marca como **P0** cualquier violación de los
puntos 1 a 4:

1. **La edad nunca llega a empresas ni al matching.** Fecha de nacimiento, foto, año de
   graduación, años de servicio y estado de pensión no pueden aparecer en vistas para empresas,
   en el cálculo del puntaje ni en textos generados por IA. `talent_private` solo la leen los
   roles `curador` y `admin`.
2. **Acceso a datos.** Toda tabla nueva tiene RLS activada y políticas explícitas. Las empresas
   leen talento solo por vistas anónimas (`company_talent_view` y similares), nunca por las
   tablas. Un perfil "reservado" no expone nombre ni foto hasta que la conexión está abierta.
   Las referencias de evidencia (nombre y teléfono) nunca salen del equipo.
3. **Solo empresas verificadas llegan al talento.** Una conexión no puede pasar a "enviada al
   talento" si `companies.verificada` está vacía, y eso se garantiza en la base, no solo en la
   interfaz.
4. **Llaves solo en el servidor.** Ninguna llave privada (service role de Supabase, Twilio,
   Resend, Claude, ElevenLabs) en código de cliente ni con prefijo `NEXT_PUBLIC_`. Webhooks
   verificados con firma.
5. **Accesibilidad WCAG 2.2 AA.** Texto base de 18 px o más; acciones principales de 56 px y
   todo lo interactivo de al menos 44 px; una sola acción principal por pantalla; foco visible;
   etiquetas visibles en los campos; nada comunicado solo con color; botón "Ayuda" en todas las
   pantallas.
6. **Lenguaje.** Nunca "adulto mayor", "tercera edad", "abuelos" ni "vacante" en la interfaz.
   Se trata de "usted". Frases cortas y sencillas.
7. **Tokens de diseño.** Ningún color, tamaño de letra o radio literal en componentes: se usan
   los tokens de `app/globals.css`.
8. **Privacidad (Ley 1581).** Nada de datos personales en URLs ni en registros de analítica. Los
   SMS no incluyen el nombre de la empresa.

No marques como problema:

- Que las pantallas usen datos de ejemplo o tengan funciones pendientes de un hito posterior.
- La escala de grises: la paleta definitiva llega con el brandbook.

## Comprobaciones

```bash
npm run lint
```

```bash
npx tsc --noEmit
```

```bash
npm test
```
