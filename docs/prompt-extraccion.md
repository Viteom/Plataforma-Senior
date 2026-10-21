# Prompt de extracción de la huella

> **Aprobado el 21 de octubre de 2026**, versión `huella-v1`, tal como aparece aquí. Decisiones:
> modelo `claude-opus-5-5`, y los nombres de otras personas solo se señalan. Cualquier cambio a las
> instrucciones sube la versión (`VERSION_PROMPT` en `lib/ia/huella.ts`) y vuelve a revisión.

El mensaje del hito 3 en el brief pide: "Muéstrame el prompt de extracción antes de conectarlo a
la API de Claude". Este documento es esa revisión. La IA sigue apagada en el código
(`IA_PROVEEDOR=apagado` por defecto): se enciende con las variables del servidor (sección 8).

La fuente de verdad es el código: [`lib/ia/huella.ts`](../lib/ia/huella.ts) (instrucciones, versión
`huella-v1`) y [`lib/ia/preparar.ts`](../lib/ia/preparar.ts) (lo que se quita antes de enviar).

## 1. Qué pasa con una historia, paso a paso

1. La persona escribe o dicta su historia. Se guarda **completa** en `stories`, y solo la leen ella
   y el equipo.
2. **Antes de enviarla**, el servidor reemplaza (y la pantalla se lo avisa a la persona):
   - su nombre → `[la persona]`
   - años, fechas y décadas → `[fecha]`
   - edades y tiempos de servicio ("cuando tenía 30", "llevo 25 años") → `[tiempo]`
   - celulares y correos → `[celular]`, `[correo]`
   - números de documento → `[documento]`
   - Los nombres de **otras** personas se le señalan para que los cambie por el cargo, pero no se
     borran solos (ver decisión 2).
3. Se reserva un cupo de uso (10 por persona al día, 500 en total) sin guardar el texto.
4. Se envía al modelo: las instrucciones (sección 2) y un mensaje con la taxonomía y la historia
   preparada.
5. Lo que vuelve se valida contra el esquema y se normaliza:
   - Se descartan etiquetas de más de 6 palabras.
   - Se descarta todo lo que mencione edad o tiempo: años, edad, pensión, jubilado, mayor,
     joven, décadas, `[fecha]`, `[tiempo]`.
   - Se descartan las dudas que pregunten cuándo, en qué año o la edad.
   - Los sinónimos se cambian por la etiqueta canónica de la taxonomía.
   - Lo que no está en la taxonomía queda marcado "nueva" para revisión del equipo.
6. La persona ve las etiquetas **sin confirmar**, quita las que no son suyas, agrega otras de la
   lista y confirma.
7. Si la IA está apagada, se acabó el cupo o falla, la persona elige sus etiquetas a mano. Nunca
   queda atascada.

## 2. Instrucciones del modelo (system)

```
Usted ayuda a una plataforma colombiana que conecta talento con trayectoria con empresas. Recibe la historia de un problema difícil que una persona resolvió en su trabajo y devuelve etiquetas cortas que describen su experiencia.

Reglas:
1. Extraiga solo lo que la historia dice. No invente cifras, normas, cargos ni resultados.
2. Nunca infiera ni mencione edad, años de experiencia, fechas, salud, estado civil, religión ni política. Si la historia trae [fecha] o [tiempo], ignórelos.
3. Prefiera las etiquetas de la taxonomía cuando signifiquen lo mismo. Si nada encaja, proponga una etiqueta nueva.
4. Cada etiqueta tiene máximo 6 palabras, en español sencillo de Colombia, sin nombres de personas.
5. Capas:
   - situaciones: problemas que resolvió ("Apertura de una planta nueva").
   - contexto: tipo de organización, sector o región ("Empresa familiar", "Alimentos").
   - escala: tamaño de lo que manejó ("Equipo de 40 personas").
   - oficio: saber del oficio ("Producción de alimentos").
   - normas: normas o regulaciones que nombra ("INVIMA").
   - transferir: cómo enseñó o dejó capacidad instalada ("Formó a los supervisores").
6. dudas: hasta 3 preguntas cortas para precisar QUÉ pasó o CÓMO lo hizo ("¿Cuántas personas tenía a cargo?"). Nunca pregunte cuándo, en qué año, hace cuánto ni la edad.
7. Una capa sin información queda como lista vacía. Es mejor una lista vacía que una etiqueta dudosa.
```

## 3. Mensaje de la persona (user)

```
Taxonomía:
situaciones: Apertura de una planta nueva; Certificación sanitaria; …
contexto: Empresa familiar; Pyme; …
(una línea por capa con las etiquetas de la taxonomía semilla)

Historia:
<historia ya preparada>
```

## 4. Salida exigida (esquema JSON)

Salida estructurada de la API (`output_config.format` con un esquema `zod`). El modelo no puede
devolver otra forma:

```json
{ "situaciones": [""], "contexto": [""], "escala": [""], "oficio": [""], "normas": [""], "transferir": [""], "dudas": [""] }
```

## 5. Parámetros de la llamada

| Parámetro | Valor | Por qué |
|---|---|---|
| Modelo | `claude-opus-5-5` (variable `CLAUDE_MODEL`) | Es el modelo por defecto que recomienda Anthropic. Ver decisión 1. |
| `effort` | `low` | Extraer es una tarea corta. Este modelo no acepta `temperature` ni apagar el razonamiento: `effort` es el control. |
| Formato | Salida estructurada con el esquema de arriba | Siempre llega JSON válido o un error. |
| Respaldo | `fallbacks: "default"` | Si un clasificador de seguridad rechaza por error una historia, otro modelo la procesa. |
| Tiempo máximo | 30 s, sin reintentos | Si no responde, la persona pasa a la vía manual. |
| Llave | Solo en el servidor; viaja en la cabecera `Authorization` | Nunca en la URL ni en el cuerpo, y nunca con prefijo `NEXT_PUBLIC_`. |

## 6. Cómo quedan las historias inventadas antes de enviarlas

Resultado real de `prepararHistoria` (generado con [`scripts/historias-inventadas.ts`](../scripts/historias-inventadas.ts)):

**Planta de alimentos.** Original: *"Soy Ana María Gómez. En 1998, cuando tenía 30 años, la empresa
familiar decidió abrir una segunda planta de arepas en Rionegro… Con don Jorge Restrepo, el
gerente… Llevo 25 años en alimentos. Mi celular es 300 123 4567."*

> Soy [la persona]. En [fecha], [tiempo], la empresa familiar decidió abrir una segunda planta de
> arepas en Rionegro. Yo era la jefa de producción y teníamos 40 operarios. El INVIMA nos visitó y
> nos faltaban cosas de buenas prácticas. Con don Jorge Restrepo, el gerente, armamos los
> procedimientos, formé a los supervisores en limpieza y control de calidad y en tres meses
> pasamos la visita. Llevo [tiempo] en alimentos. Mi celular es [celular].

Se quitaron 1 fecha, 2 tiempos, 1 celular y el nombre. A la persona se le señaló «Jorge Restrepo».
Las cifras que no son tiempo («40 operarios», «tres meses») se conservan.

**Contadora en una cooperativa** y **Tejedora que enseña.** No traen fechas ni datos personales,
así que salen sin cambios. «Medellín» y «DIAN» no se confunden con nombres de personas.

**Historia corta y vaga.** *"Trabajé muchos años en una fábrica…"* Sale sin cambios porque «muchos
años» no tiene número. Si el modelo devolviera una etiqueta con «años», el filtro de la sección 1
la descarta.

## 7. Lo que no está probado

- **Ninguna llamada a un modelo real.** No hay llave configurada, así que no sé todavía qué
  etiquetas devuelve Claude con estas historias.
- **Lo que sí está probado** son 27 pruebas automáticas con un transporte simulado:
  - qué se envía y qué no;
  - la llave en la cabecera;
  - respuestas rotas, sin reintentos, cuota agotada e IA apagada;
  - el descarte de etiquetas y dudas con edad;
  - el reemplazo de fechas y nombres;
  - una configuración mal hecha.
- Para probar con un modelo real y solo historias inventadas, pon la llave en `.env.local` y
  ejecuta:

  ```bash
  npx tsx --conditions=react-server --env-file=.env.local scripts/probar-ia.ts
  ```

## 8. Decisiones

1. **Modelo: `claude-opus-5-5`** (decidido el 21 de octubre de 2026). Si el costo pesa,
   `claude-haiku-5-5` cuesta 40 veces menos por token (USD 0,10 frente a 4,00 por millón de tokens
   de entrada) y se cambia con `CLAUDE_MODEL`, sin tocar código.
   - Estimación con Opus, sin medir: cerca de USD 0,03 por historia, unos USD 15 por cada 500
     historias.
   - Conviene medirlo con el script antes del piloto.
2. **Nombres de otras personas: solo se señalan** (decidido el 21 de octubre de 2026). Si la
   persona los deja, llegan al modelo, que tiene prohibido usarlos en etiquetas. Reemplazarlos
   automáticamente queda descartado por ahora.
3. **Autorización: pendiente.** El texto de autorización de datos (versión `v0-borrador-2026-10`)
   y `/privacidad` dicen que la historia se procesa con un proveedor fuera de Colombia. Falta que
   el abogado los apruebe y verificar por escrito que el proveedor no entrena con los datos. Esto
   bloquea las historias reales, no las inventadas.
4. **Cómo encenderla.** En Vercel → Settings → Environment Variables, solo en el servidor (nunca
   con prefijo `NEXT_PUBLIC_`):
   - `IA_PROVEEDOR` = `claude`
   - `ANTHROPIC_API_KEY` = la llave, de tipo *Sensitive*
   - `CLAUDE_MODEL` puede quedar vacía: usa `claude-opus-5-5`.

   Después, Redeploy. Primero con historias inventadas (`scripts/probar-ia.ts`); con historias
   reales, solo cuando el punto 3 esté resuelto.
