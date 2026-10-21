# Hito 3: perfil y huella

Rama `hito-3-perfil-huella`. Criterios de listo del brief:

- [ ] **Una historia real produce etiquetas que la persona reconoce.** Falta: la IA está apagada
      hasta que se apruebe el prompt (`docs/prompt-extraccion.md`) y haya llave y cuentas.
- [ ] **La persona elige su tarifa viendo el rango sin pedir ayuda.** Falta que el equipo defina
      los rangos en `rate_guides`. Mientras tanto la pantalla lo dice y ofrece la orientación del
      equipo.

## Qué quedó hecho

**Base de datos** (migraciones `20261022000001_perfil_huella.sql` y `…02_taxonomia_semilla.sql`)

- **Conversación de una hora** (A4) como nueva forma de contratar, con una sola oferta por tipo.
- **Requisito de entrada** («45 o más» o «20 años de oficio»): se guarda en `talent_private`,
  nunca en el perfil, porque es un dato de edad.
- **`rate_guides`** (A5): todos la leen y solo el equipo la escribe. Está vacía a propósito.
- **`evidence`** (A3):
  - Referencias y archivos los agrega la persona.
  - Solo el equipo los verifica; un trigger lo exige.
  - Las empresas ven solo las verificadas y autorizadas, por una vista, y nunca el nombre ni el
    teléfono de una referencia.
- **`help_requests`**: la usan «Prefiero que el equipo me oriente» y el borrado de cuenta.
- **`ia_usos` e `ia_topes`**: cuota de IA por persona y global, sin guardar texto. Se reserva y se
  cierra solo con funciones, sin la llave de servicio.
- **Bucket `evidencias`**: privado, y cada persona solo sube a su carpeta.
- **Ajuste a los triggers de verificación** (también el de empresas del hito 2): ahora frenan solo
  a la API (`anon`, `authenticated`). Antes bloqueaban también la consola y la llave de servicio.
- **Taxonomía semilla**: 76 etiquetas en 6 capas, sin nada que revele la edad (una prueba lo
  comprueba). **Para revisar con el equipo.**

**Capa de IA** (`lib/ia/`), siguiendo `docs/ia-desde-moai.md`

- **Claude** con el SDK oficial:
  - Salida estructurada, `effort: low` y respaldo ante rechazos.
  - 30 s de tope y sin reintentos.
  - La llave solo en el servidor.
- **Gemini**, solo para historias inventadas; se rechaza en producción.
- **Antes de enviar** se quitan nombre, fechas, edades, tiempos de servicio, contacto y
  documentos. Los nombres de otras personas se le señalan a la persona.
- **Al recibir**:
  - Se descartan etiquetas y dudas con edad o tiempo.
  - Los sinónimos pasan a la etiqueta canónica.
  - Lo nuevo queda marcado para revisión del equipo.
- **Apagada por defecto.** Si falla o se acaba el cupo, la persona elige a mano.

**Pantallas**

- **`/perfil/nuevo`**: guarda de verdad.
  - Valida cada paso y lleva el foco al primer error.
  - Conversación de una hora primero.
  - Tarifas con rango o aviso, y la cifra con puntos de mil.
  - Autorización de datos en el paso 3.
- **`/huella`**:
  - Escribir o dictar (Web Speech API, con aviso si el navegador no la tiene).
  - Aviso de lo que se quitará antes de enviar.
  - Confirmación: quitar y agregar etiquetas, dudas para precisar, y la vía manual.
  - Al confirmar, el perfil queda publicado.
- **`/mi-perfil`**:
  - Visibilidad, pausar y volver a mostrar.
  - Editar datos y formas de trabajar.
  - Quitar etiquetas.
  - Evidencias: agregar, mostrar u ocultar a empresas, y quitar.
  - Descargar los datos en JSON y borrar la cuenta, con confirmación.
- **`/privacidad`**: resumen en lenguaje sencillo. El texto legal sigue pendiente.

## Pruebas

214 en total. Las nuevas del hito 3:

- **Acceso a datos:** evidencias, guía de tarifas, ayuda, requisito y cuota de IA, con PGlite y
  las migraciones reales.
- **IA, con transporte simulado:** las 10 de la guía.
- **Validación del perfil y formato de tarifas.**
- **Migraciones:** todas las tablas con RLS y la taxonomía sin datos de edad.

## Lo que no se pudo probar

- **El flujo con Supabase real** (guardar, subir archivos, borrar cuenta): no hay cuentas. En el
  navegador probé el modo demostración completo:
  - El perfil en 3 pasos, la historia, la confirmación y la llegada a Mi perfil.
  - Las secciones de edición de Mi perfil, con una página temporal que ya borré.
  - Todas a 375 px sin desborde ni controles pequeños.
- **Una llamada real a Claude o Gemini.**
- **El dictado en un celular real**: depende del navegador.

## Antes del hito 4

1. Aprobar el prompt o pedir cambios (`docs/prompt-extraccion.md`, sección 8).
2. Que el equipo revise la taxonomía semilla y defina los rangos de tarifa.
3. Cuentas de Supabase, Twilio y Resend para probar los hitos 2 y 3 de punta a punta.
