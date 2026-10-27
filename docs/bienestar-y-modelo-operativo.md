# Bienestar, condiciones de trabajo y modelo operativo de Kánna

Decisiones de producto de esta conversación. Sustituyen el brief anterior donde exista conflicto.

## Bienestar antes que volumen de trabajo

La persona decide su jornada: puede preferir tiempo completo, varias actividades, pocas horas o
una pausa. No se deduce su capacidad de su edad. Un formulario recoge metas y seguimientos
voluntarios sobre ritmo, trato y pago. Las metas de ingreso nunca justifican superar el límite
personal de horas. Los acuerdos sin horas declaradas y el trabajo fuera de Kánna deben revisarse
con la persona; no se presentan totales incompletos como si fueran toda su carga.

La página `/bienestar` muestra las horas semanales de acuerdos en curso, una barra con cifra y
mensaje accesibles, y la meta de ingreso. La proyección económica solo suma acuerdos por hora
con horas conocidas: no mezcla pagos mensuales o totales de proyectos con ingreso semanal.
No son pagos cobrados. El seguimiento queda disponible también después de cerrar el proceso.

Las respuestas no llegan a empresas ni al matching. RLS solo deja leerlas a la persona. El equipo
curador/admin las ve por `casos_bienestar_equipo()`, que registra quién abrió la cola y quién tomó o
cerró cada caso (`wellbeing_access_log`, solo lo lee administración). La autorización de metas queda registrada. Pedir contacto crea una solicitud de
ayuda en la misma transacción. El historial y las metas se eliminan con el perfil y se incluyen
en su descarga de datos. Las páginas privadas no se guardan en la caché de la PWA.

## Formularios y acompañamiento gerontológico

Esta versión acompaña; no diagnostica, certifica aptitud, calcula edad biológica ni predice
longevidad. El historial permite observar cómo cambia el bienestar declarado con el tiempo.
Un indicador clínico de longevidad requiere un profesional, un instrumento validado y un alcance
acordado; no se inventa una puntuación.

La organización describe tareas, jornada, remuneración, descansos, exigencias y quién acompaña.
Kánna revisa esas condiciones antes de enviar el reto. Los ajustes laborales se acuerdan con la
persona. Diagnósticos, fecha de nacimiento, pensión, medicamentos e historia clínica no forman
parte de una ficha empresarial. Un futuro formulario profesional debe tener consentimiento y
acceso separados, con trazabilidad de lectura; únicamente los ajustes autorizados pueden
compartirse. No basta con que la organización pida la valoración para acceder a información de salud.

Ningún formato de contrato se recomienda automáticamente por edad o respuestas de bienestar.
La elección debe considerar el trabajo real, la autonomía, subordinación, jornada, remuneración
y obligaciones legales. La revisión humana debe evitar usar un contrato de servicios para
encubrir una relación laboral. Los límites generales de la plataforma no certifican que una
jornada cumpla la normativa vigente de cada contrato.

## Retos dignos

Cada reto empieza pendiente de revisión, incluidos los ya existentes. El equipo autoriza después
de verificar remuneración justa, condiciones claras, descansos, seguridad, acompañamiento,
compatibilidad con los ajustes acordados y ausencia de discriminación. Cambiar condiciones
invalida la aprobación. El trigger de conexiones bloquea nuevos envíos de retos sin autorización,
incluso mediante RPC o consola. Las conversaciones desde Explorar no son una oferta concreta. Todo acuerdo, incluso si nació
desde Explorar, pasa por `/equipo/condiciones` antes de que la persona pueda aceptarlo. La
autorización corresponde a la versión revisada y se invalida si cambian las condiciones.

La migración no cambia procesos ya enviados ni presupone que las condiciones históricas fueron
aprobadas. Los retos históricos con información incompleta requieren completarla antes de la
nueva autorización. El equipo puede completarla desde la pantalla de curaduría y autorizar la versión revisada.

## Pagos: diseño acordado, cobros desactivados

La organización debe conocer, antes de aceptar, tres cifras separadas:

| Concepto de ejemplo | Importe |
| --- | ---: |
| Neto acordado para el talento | $500.000 |
| Administración cobrada a la organización | $30.000 |
| Total para la organización | $530.000 |

El 6 % del ejemplo no es todavía una tarifa comercial aprobada. Impuestos, retenciones,
comisiones de pasarela y costos del giro deben explicarse antes de confirmar el neto. Kánna
no cobra al talento por acceder a oportunidades.

Flujo propuesto: la organización paga a un proveedor autorizado; el estado del cobro se confirma
con un webhook firmado e idempotente; el trabajo y su aceptación se registran; se ordena el pago
al talento según hitos acordados. No usar la cuenta operativa de Kánna como una custodia informal.
La viabilidad de retener fondos, los plazos de liberación y las obligaciones de la plataforma
deben revisarse con el proveedor y asesoría jurídica antes de programarlos.

Nequi o Gana pueden ser opciones de desembolso si el proveedor contratado las soporta, ofrece
conciliación y permite verificar al destinatario. No están integrados ni se prometen todavía.

### Políticas por construir

- Anticipo: porcentaje y momento, quién lo financia y qué pasa si el trabajo se cancela.
- Pago final: evidencia de entrega, plazo para aprobar, desacuerdo y atención humana.
- Incumplimiento de cualquiera de las partes: reprogramación, causas de fuerza mayor, devoluciones
  y resolución de controversias. No presumir mala fe ni penalizar una condición de salud.
- Seguro: cobertura real, aseguradora, exclusiones, beneficiario, costo, vigencia y procedimiento.
  Un seguro de accidentes o responsabilidad no garantiza que alguien se presente. No mostrar
  «asegurado» antes de contratar una póliza que cubra ese caso.
- Contratación laboral: los acuerdos de pago no sustituyen salario, seguridad social ni los
  derechos y plazos que correspondan.

No se añadieron botones de cobro, cuentas de recaudo ni movimientos de dinero.

## Perfil, documentos y ubicación

La huella ya no despliega el catálogo completo de etiquetas: se revisan sugerencias de la historia
escrita/dictada o se escriben capacidades propias por grupos desplegables. Las nuevas etiquetas
siguen pasando por el equipo antes de llegar a empresas.

En la demostración no se lee ningún archivo: se muestra una hoja de vida de ejemplo, porque sin
cuenta ni tope diario cualquiera podría poner al servidor a abrir documentos. PDF, DOC y DOCX se leen localmente en un proceso limitado en tiempo y memoria. Se valida el tipo
real, se extrae texto plano y la persona revisa nombre, oficio y experiencia. No hay OCR: un PDF
escaneado requiere versión con texto o escritura/dictado. No se conserva el archivo original ni
se envía a la IA; la experiencia confirmada usa la preparación de privacidad antes de cualquier
extracción de capacidades. La importación no publica ni verifica el perfil automáticamente.

El selector tiene 32 departamentos y 1.104 entradas de municipios de referencia, obtenidas de
https://github.com/marcovega/colombia-json (colombia.json). No es una copia actualizada completa de
DIVIPOLA. La consulta directa a datos.gov.co estuvo bloqueada por la red de este entorno. Se puede
escribir un municipio faltante y añadir barrio, corregimiento o vereda libremente. No se
inventa un catálogo nacional completo de barrios y veredas. Antes de anunciar cobertura completa,
actualizar contra DIVIPOLA y fuentes territoriales oficiales, guardando procedencia y fecha.

La organización registra NIT, sector, tamaño, ubicación, responsable, cargo, correo, teléfono,
actividad, enlace web y enlace al manual de marca. La verificación del NIT sigue a cargo del
 equipo y no se obtiene solo por completar el formulario.

## Fotografías

Se quitó el filtro de grabado: la web usa los mismos retratos del brandbook y las fotos de Sandoná
(Wikimedia Commons, CC BY-SA 4.0) a color, sin filtros, guardadas en `public/web/` con el tamaño y el
encuadre de los grabados. No se cargan fotos desde otros sitios. Las fotos de Pexels de la primera
entrega se descartaron: no correspondían a los perfiles de ejemplo y sus tamaños estaban mal declarados.

## Primera entrega de confianza y bienestar

Migraciones adicionales `20261031000004`, `20261031000005` y `20261031000006`:

- La base impide apuntar `foto_path` a otra persona y el servidor comprueba la pertenencia y la
  visibilidad antes de usar la llave de servicio. Las referencias antiguas no canónicas se
  desvinculan; no se borra ningún objeto de Storage. Antes de aplicar, revisar las referencias
  afectadas y conservar respaldo para corregir las fotos propias que necesiten volver a cargarse.
- La carga actual excluye acuerdos cuyo inicio es futuro. Se presenta como dedicación semanal
  pactada, no como horas efectivamente trabajadas ni ingreso recibido.
- Antes de aceptar se muestra la proyección al inicio del acuerdo. Si supera el límite personal
  o hay horas sin definir, requiere confirmación explícita de esa carga. La persona puede continuar
  voluntariamente o pedir ajustes. Si cambian la meta u otros acuerdos, la confirmación anterior
  no sirve y debe revisar de nuevo. Las aceptaciones de una misma cuenta se serializan.
- Autorizar una versión del acuerdo encola un aviso nuevo `acuerdo_autorizado`; repetir la
  autorización no duplica ese aviso. El envío real de SMS sigue sujeto al proveedor, actualmente
  desactivado, y al horario y agrupación existentes.
- Pedir una pausa, ajustar la carga o reportar problemas de trato/pago abre un caso de revisión
  interna aunque no se autorice contacto. Ese permiso se registra por seguimiento y queda visible
  al equipo. Sin permiso no se crea una solicitud de contacto.
- El equipo puede tomar el caso, ver que está asignado y marcar la revisión finalizada; la persona
  ve el estado en su historial. Solo quien tomó el caso puede cerrarlo desde la interfaz.
- Si la persona borra un seguimiento, se borran sus respuestas y el caso, pero la solicitud de ayuda
  que pidió sigue en la cola (migración `20261031000007`).
- Se propone una fecha interna de revisión a 48 horas, configurable mediante una migración futura.
  No es una promesa de atención al usuario ni un servicio de emergencias. Antes del piloto deben
  definirse responsables reales, cobertura, reasignación y protocolo de respuesta.

No se añaden diagnósticos, reglas de exclusión por edad, cobros ni desembolsos. Esta entrega no
pretende cerrar los otros hallazgos anteriores de seguridad (evidencias y aprobación de etiquetas),
que deben revisarse por separado antes de producción.
