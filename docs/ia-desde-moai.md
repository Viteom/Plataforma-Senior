# Capa de IA: qué traer de MOAI

Documento de apoyo para el hito 3 (extracción de la huella) y el hito 5 (chat de ayuda). Resume
lo que ya funciona en MOAI (`github.com/Viteom/MOAI`, rama `codex/vercel-api-beta`) y cómo
adaptarlo a este repositorio. No reemplaza `docs/brief.md` ni `CLAUDE.md`: si algo choca, mandan
ellos.

## Decisión de proveedor

| Uso | Proveedor | Por qué |
|---|---|---|
| Datos reales (historias, problemas de empresas, chat) | **Claude** (API de Anthropic) | Lo pide el brief. La API no entrena con lo que se envía. |
| Pruebas con historias inventadas | Gemini gratis (Google AI Studio), opcional | Sin costo. En el plan gratuito Google puede usar el contenido para mejorar sus productos y puede ser leído por personas, así que **nunca con datos reales**. |

El código no debe depender del proveedor: una interfaz, dos implementaciones y una variable que
elige.

## Archivos de MOAI que sirven de referencia

| En MOAI | Qué hace | Equivalente aquí |
|---|---|---|
| `server/gemini.ts` | Transporte: llave en cabecera, límite de 15 s, respuesta acotada a 32 KB, sin reintentos, nunca devuelve errores del proveedor | `lib/ia/gemini.ts` y `lib/ia/claude.ts` |
| `server/lenguaje-brisa.ts` | Instrucciones, esquema JSON y `normalizarExtraccion` (valida lo que vuelve) | `lib/ia/huella.ts` (historia → etiquetas) y `lib/ia/problema.ts` |
| `server/brisa-modelo.ts` | Cuota por cuenta y global con candado, registro de cada uso, respuesta segura si falla | `app/api/huella/extraer/route.ts` o una acción de servidor |
| `server/brisa-conversa.ts` | Chat: turnos acotados, detección de riesgo antes del modelo, limpieza de la respuesta | Chat de ayuda del hito 5 |
| `server/vercel.ts` | Si la IA está mal configurada, solo se apaga la IA y el registro dice qué variable revisar | Al crear el proveedor |
| `server/brisa-conversa.test.ts` | Pruebas con transporte simulado: qué se envía, qué no, cuotas, fallos | `tests/ia/*.test.ts` |
| `scripts/diagnostico-gemini.ts`, `scripts/probar-conversa.ts` | Prueban la llave y el modelo sin imprimir la llave | `scripts/probar-ia.ts` |

## Cómo armarlo aquí

### 1. Proveedor (`lib/ia/`)

- Todos los archivos empiezan con `import "server-only";`.
- Tipo común:

  ```ts
  export type ProveedorIA = {
    nombre: "Claude" | "Gemini";
    modelo: string;
    extraer: (sistema: string, texto: string, esquema: object) => Promise<unknown>;
    conversar?: (sistema: string, turnos: Turno[]) => Promise<unknown>;
  };
  ```

- `proveedorDesdeEntorno(env, transporte = fetch)` devuelve `null` si la IA está apagada y lanza
  `ConfiguracionIAIncompleta(variables)` si falta algo. Quien lo llama registra
  `console.error("IA desactivada. Revise:", variables)` **sin el valor** y la app sigue andando.
- El transporte se recibe por parámetro para poder simularlo en pruebas.
- Reglas del transporte, copiadas de MOAI:
  - Llave en cabecera, nunca en la URL. Claude: `x-api-key` y `anthropic-version`. Gemini:
    `x-goog-api-key`.
  - `AbortSignal.timeout(15_000)`, `redirect: "error"`, sin reintentos automáticos.
  - Leer la respuesta con un tope de tamaño y validar su forma antes de usarla.
  - Cualquier error se convierte en un `FalloIA` genérico: nunca se reenvía al cliente el texto
    del proveedor.
- Salida JSON estructurada con el esquema del brief (`situaciones`, `contexto`, `escala`,
  `oficio`, `normas`, `transferir`, `dudas`). Consulte la skill `claude-api` para el parámetro
  exacto y el modelo vigente. Para extracción conviene un modelo económico y `temperature: 0`.
- Lección de Gemini: los modelos que «piensan» pueden gastar todos los tokens de salida y cortar
  la respuesta. En MOAI se resolvió con `thinkingBudget: 0` en la familia 2.x y
  `thinkingLevel: "low"` en las siguientes. Con Claude, no active el razonamiento extendido para
  extraer.

### 2. Variables (solo servidor, nunca `NEXT_PUBLIC_`)

```
IA_PROVEEDOR=apagado        # claude | gemini | apagado
ANTHROPIC_API_KEY=
CLAUDE_MODEL=
GEMINI_API_KEY=             # solo pruebas con datos inventados
GEMINI_MODEL=gemini-3.5-flash-lite
```

- Validar el nombre del modelo con una expresión (en MOAI: `^gemini-[a-zA-Z0-9._-]{1,70}$`). En
  MOAI un valor pegado con comillas o con `models/` apagó la IA en Vercel. Por eso el registro
  debe decir el nombre de la variable.
- `gemini` solo se acepta si `VERCEL_ENV !== "production"`.
- En Vercel: tipo Secret, marcadas solo en Preview mientras sea de pruebas, y Redeploy después de
  cambiarlas.

### 3. Qué se envía y qué no (regla 1 y Ley 1581)

- A la IA llega **solo el texto de la historia** (o del problema) y la taxonomía. Nunca nombre,
  celular, correo, ciudad exacta, fecha de nacimiento, foto, pensión ni nada de `talent_private`.
- Antes de enviar, una revisión local (`revisarFraseModelo` en MOAI) revisa la historia:
  - Celular, correo o número de documento: pide quitarlos.
  - **Nombres.** El nombre de la persona se reemplaza solo por `[la persona]`: el servidor lo
    conoce por el perfil. Otros nombres propios (compañeros, jefes, la empresa) se detectan con
    una heurística sencilla y se le pide a la persona que los cambie por su cargo o por "la
    empresa". La heurística no es perfecta: por eso la historia completa nunca se muestra a una
    empresa.
  - **Fechas, años y edad.** Años («en 1998»), fechas, edades («cuando tenía 30») y tiempos de
    servicio («llevo 25 años») se reemplazan por `[fecha]` o `[tiempo]` **antes** de enviar. Lo
    que el modelo no recibe no lo puede convertir en etiqueta (regla 1). La persona ve el texto
    tal como lo escribió; el reemplazo ocurre solo en lo que sale hacia el proveedor.
- Las instrucciones del modelo repiten las reglas del brief: solo lo dicho, sin inventar cifras ni
  normas, sin inferir edad, salud ni estado civil, máximo 6 palabras por etiqueta.
- **Las "dudas" nunca preguntan por años, fechas ni edad.** Sirven para precisar lo que pasó
  ("¿Cuántas personas tenía a cargo?"), no cuándo. Se dice en las instrucciones y se comprueba
  al recibir: una duda que pregunte "¿en qué año…?" o "¿cuántos años…?" se descarta.
- Después de recibir: normalizar contra la taxonomía, descartar etiquetas que mencionen edad o
  años («30 años de experiencia», «pensionado») y mandar las nuevas a revisión del equipo.
- Las etiquetas quedan **sin confirmar** hasta que la persona las revise.
- **Revisión humana:** la autorización de datos debe mencionar que la historia se procesa con un
  proveedor de IA fuera de Colombia (texto con el abogado).

### 4. Cuota y registro de uso

Tabla nueva con RLS activada, sin políticas y sin permisos para `anon` ni `authenticated`. Se usa
**el mismo patrón del hito 2** que el límite de códigos (`registrar_intento_codigo`): solo se
escribe con funciones `security definer`, llamadas con la sesión de la persona. Así no hace falta
la llave de servicio para esto, y esa llave aparece en menos lugares.

- `reservar_uso_ia(tarea text) returns uuid`: toma `auth.uid()`, revisa la cuota y devuelve el id
  del uso, o `null` si no hay espacio.
- `cerrar_uso_ia(uso uuid, resultado text)`: solo cierra un uso de la misma persona.

```sql
create table ia_usos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  tarea text not null,           -- 'huella' | 'problema' | 'chat'
  modelo text not null,
  creado_en timestamptz not null default now(),
  terminado_en timestamptz,
  resultado text not null default 'pendiente'
    check (resultado in ('pendiente', 'correcto', 'error', 'rechazado'))
);
alter table ia_usos enable row level security;
```

- Dentro de `reservar_uso_ia`, la cuota se reserva en una transacción corta con
  `pg_advisory_xact_lock(hashtext('ia-<tarea>'))`: contar los usos de las últimas 24 h por
  persona y en total, y si hay espacio insertar la fila `pendiente`. **No** dejar la transacción
  abierta mientras responde el proveedor.
- Probarlo como `tests/db/acceso.test.ts`: con PGlite y las migraciones reales, sin Docker.
- Al terminar, marcar `correcto`, `error` o `rechazado`.
- No guardar el texto enviado ni la respuesta en esta tabla: solo el uso.
- Topes para empezar: huella 10 por persona al día, chat 80 por persona al día, y un tope global
  que controle el costo del piloto.

### 5. Si la IA falla

- La persona nunca queda atascada. Si no hay proveedor, se superó la cuota o hubo error, la
  pantalla ofrece elegir las etiquetas a mano desde la taxonomía o pedir ayuda (regla 6).
- La página revisa en el servidor si la IA está disponible (`iaDisponible()` en `lib/ia/`) antes
  de mostrarse, y le pasa el resultado al formulario. En Next.js no hace falta una ruta aparte
  como el `GET /api/brisa/modelo` de MOAI: así no hay una ruta más que proteger, ni un momento en
  que la pantalla muestra una opción que después desaparece.

### 6. Chat de ayuda (hito 5)

- El servidor recibe solo los últimos turnos: máximo 12, de hasta 600 caracteres cada uno, y el
  último debe ser de la persona.
- **Antes** de llamar al modelo, una expresión detecta emergencia, salud, violencia, fraude o
  pagos. En esos casos no se llama a la IA y se crea una solicitud de ayuda para el equipo, con
  una respuesta fija y revisada.
- Limpiar la respuesta (sin markdown y con longitud máxima) antes de mostrarla.
- Aviso visible y corto: «Le responde un asistente virtual. No escriba datos personales.»
- Reglas que se mantienen:
  - Una pregunta a la vez.
  - No saludar de nuevo si la persona ya habló ese día.
  - No explicar cifrado ni seguridad dentro del chat, porque genera desconfianza. Eso va en Ayuda.
- **Hipótesis para validar en las pruebas con usuarios**, no reglas todavía. Salen de Brisa, que
  tenía otro público; aquí el público tiene poca práctica digital y puede reaccionar distinto:
  - *Pausas entre mensajes.* Pueden dar calma, pero también parecer que la app se trabó.
    Probar con y sin pausa; si se usa, mostrar siempre "Escribiendo…" para que no parezca un
    error.
  - *Sin respuestas rápidas.* Escribir con sus palabras da riqueza, pero para quien escribe con
    dificultad, dos o tres botones ("Sí", "No", "Hablar con una persona") pueden ser la
    diferencia entre seguir o abandonar. Probar ambas versiones. El botón "Hablar con una
    persona" va siempre, sea cual sea el resultado (regla 6).

### 7. Pruebas mínimas

Todas con transporte simulado, sin llamar al proveedor real:

1. El cuerpo enviado contiene la historia y **no** contiene nombre, celular, correo, fecha de
   nacimiento ni la llave (`expect(JSON.stringify(cuerpo)).not.toMatch(...)`).
2. Una respuesta rota, vacía o con código 503 da un error genérico y deja la fila en `error`.
3. Al llegar al tope, la respuesta es 429 y no se llama al proveedor.
4. Con `IA_PROVEEDOR=apagado` no hay llamadas y la pantalla ofrece la vía manual.
5. Las etiquetas con edad o años de experiencia se descartan (complementa la prueba de la regla 1).
6. En el chat, un mensaje de riesgo no llega al modelo y crea una solicitud de ayuda.
7. Un modelo mal configurado no tumba la app y el registro nombra la variable sin su valor.
8. Una historia con «en 1998», «cuando tenía 30» o «llevo 25 años» sale hacia el proveedor con
   `[fecha]` o `[tiempo]`, y el nombre de la persona sale como `[la persona]`.
9. Una duda que pregunta por un año, una fecha o una edad se descarta.
10. Sin cuota disponible, `reservar_uso_ia` devuelve `null`, y una persona no puede cerrar el uso
    de otra (prueba con PGlite).

### 8. Script de diagnóstico

`scripts/probar-ia.ts` envía 3 o 4 historias inventadas, imprime estado HTTP, motivo de fin,
tiempo y uso de tokens, y **nunca** la llave. Uso:

```bash
npx tsx --env-file=.env.local scripts/probar-ia.ts
```

## Otras cosas de MOAI que sirven aquí

- **Correo del código:** `server/plantillas-correo.ts`, con marca, el código en un recuadro, sin
  imágenes remotas ni rastreo. Se adapta como plantilla de Supabase en Resend.
- **Cifrado de campos:** `server/cifrado.ts` (AES-256-GCM). Útil para las transcripciones de
  llamada (`call_sessions`) y las historias completas. Requiere revisión humana antes de activarlo.
- **Capturas en tamaño celular** con Puppeteer, para revisar pantallas sin abrir el teléfono.

## Orden sugerido

1. Terminar de probar el hito 2 en un celular real (cuentas de Supabase y Twilio).
2. `lib/ia/` con Claude y Gemini, la tabla `ia_usos` y sus pruebas, con la IA apagada por defecto.
3. **Revisión del prompt de extracción antes de conectarlo a Claude**, como pide el mensaje del
   hito 3 en el brief. Se presentan las instrucciones del modelo, el esquema JSON y el resultado
   con 3 o 4 historias inventadas (incluida una con fechas y nombres). No se conecta a datos
   reales sin esa aprobación.
4. Pantalla de historia → etiquetas sin confirmar → la persona confirma, con la vía manual siempre
   disponible.
5. Probar con historias inventadas (Gemini o Claude) y luego con una historia real con Claude,
   con autorización.
