# Kánna (antes Plataforma Senior) — reglas del repositorio

MVP de una PWA (primero celular) que conecta talento de 45 años o más con empresas en Colombia.
La fuente única es `docs/brief.md`: léelo antes de cambiar algo que no conozcas. Las capturas de
referencia van en `docs/pantallas/`. El sistema de diseño está en
`design-system/plataforma-senior/MASTER.md` (y `pages/*.md` para excepciones por pantalla).

Avanzamos un hito a la vez (ver "Plan por hitos" en el brief). No empieces el siguiente sin que
el anterior se haya probado en un celular real.

## Reglas que no se negocian

1. **La edad nunca se muestra a empresas ni entra al matching.** Fecha de nacimiento, foto, año de
   graduación y estado de pensión no son entradas del cálculo; un test automatizado falla si aparecen.
2. **Perfil primero.** No existe el concepto de "vacante" en la interfaz: hay perfiles, problemas y
   experiencias.
3. **La persona decide su visibilidad.** Reservado: la empresa ve huella y oficio, sin nombre ni foto
   hasta la doble aceptación. Visible: nombre, foto e historia.
4. **Accesibilidad WCAG 2.2 AA.** Letra base de 18 px o más, botones de 56 px de alto, una acción
   principal por pantalla, nada comunicado solo con color.
5. **Español sencillo de Colombia, de tú.** Kánna tutea (decisión de marca del 23 oct 2026):
   cercana y respetuosa, nunca condescendiente. Nunca "adulto mayor", "tercera edad", "abuelos",
   "viejos", "vacante", "aplicar" ni "candidato" en la interfaz; sí "talento con trayectoria".
6. **Siempre hay una salida humana.** El botón de ayuda está en todas las pantallas y el agente pasa
   a una persona cuando no entiende o se lo piden.
7. **RLS desde el primer día** y llaves de API solo en el servidor.
8. **Marca en tokens.** La marca es **Kánna** (brandbook: https://claude.ai/artifact/V7A3pmoq1R8xU4WdwoU1cv).
   Colores, letras y radios viven en `app/globals.css`; el nombre, en `lib/marca.ts`; los logos,
   en `public/marca/` (nunca se redibujan). Toda la app se lee en Atkinson Hyperlegible; Bricolage
   Grotesque e Instrument Serif solo en titulares de marca. La lima es escasa y nunca va como texto
   sobre crema ni blanco. En SMS, sin tildes ("Kanna", "codigo") para no duplicar el costo.
9. **Solo empresas verificadas llegan al talento.** Una empresa sin NIT verificado puede explorar,
   pero no pedir conexiones ni aparecer en las oportunidades. Cada oportunidad y cada SMS
   recuerdan que nadie de la plataforma ni de una empresa le va a pedir dinero.

## Cómo se aplican en el código

- Las empresas leen talento solo a través de vistas anónimas (`company_talent_view`), nunca de
  `talent_profiles` ni `talent_private` directamente.
- `talent_private` (fecha de nacimiento, autorización, pensión) solo la leen curador y admin.
- Ningún color, tamaño de letra o radio literal en componentes: usa los tokens de `app/globals.css`.
- Textos de interfaz en español; un test revisa que no aparezcan las palabras prohibidas.
- Una conexión solo pasa a "enviada al talento" si `companies.verificada` tiene fecha; lo
  garantiza la base (no solo la interfaz) y un test lo comprueba.
- Las evidencias que ve una empresa salen de una vista: solo verificadas y autorizadas por la
  persona. Las referencias (nombre y teléfono) nunca salen del equipo.
- Los SMS de aviso no dicen el nombre de la empresa y respetan el horario y el tope diario del
  brief ("Avisos al talento").
- Llaves (`SUPABASE_SERVICE_ROLE_KEY`, `ANTHROPIC_API_KEY`, Twilio, Resend, ElevenLabs) solo en
  variables de entorno del servidor; nunca con prefijo `NEXT_PUBLIC_`.
