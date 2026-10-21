# Hito 4: empresa y conexiones

Rama `hito-4-empresa-conexiones`, construida sobre `hito-3-perfil-huella`, que aún no está en
`main`. Criterios de listo del brief:

- [ ] **Un caso va de búsqueda a conexión aceptada.** Probado de punta a punta en la base de datos
      (PGlite con las migraciones reales) y en las pantallas en modo demostración. Falta con
      Supabase real.
- [ ] **La persona se entera por SMS sin entrar a revisar.** La cola de avisos funciona y la ve el
      equipo. El envío por SMS (Twilio) está apagado porque es de pago: mientras tanto el equipo
      llama a la persona y lo anota en `/equipo/ayuda`.
- [x] **Una empresa sin verificar no puede llegar al talento.** Lo garantiza un trigger en la
      base, también contra el equipo, la consola o la llave de servicio, y una prueba lo
      comprueba.

## Cómo funciona una conexión

**Desde Explorar** (la empresa vio un perfil):

empresa «Quiero conocer este perfil» → la persona recibe la oportunidad → «Me interesa» →
**conexión abierta** (hay doble aceptación) → el equipo los pone en contacto.

**Por un problema** (la empresa describe qué necesita):

1. La empresa escribe el problema y elige requisitos de la lista, obligatorios o deseables.
2. El equipo calcula los 10 propuestos con el puntaje y elige hasta 5, con una línea de por qué.
3. Al enviar, cada persona elegida recibe la oportunidad.
4. Si dice «Me interesa», la empresa ve el perfil con su puntaje y la nota del equipo.
5. La empresa elige «Quiero conocer a esta persona» y la **conexión queda abierta**.

**Al cerrar**, la empresa califica de 1 a 5. Esa evaluación queda como respaldo verificado de la
persona y suma en el puntaje.

## Lo que ve cada uno

- **Empresa:**
  - Nunca ve las propuestas internas del curador, ni quién dijo que no en una búsqueda por
    problema.
  - Ve el puntaje y la nota solo después del «Me interesa».
  - Ve un rango de tarifa, nunca el número exacto.
  - El nombre de un perfil reservado aparece solo con la conexión abierta.
- **Talento:**
  - Ve el nombre de la empresa y si está verificada.
  - Ve un aviso fijo de que nadie le va a pedir dinero.
  - Tiene un botón para reportar. El reporte pausa todo con esa empresa; con dos reportes
    confirmados, la empresa queda en pausa para todos.
- **Equipo:** panel con lo pendiente, curaduría, empresas y reportes, evidencias y guía de
  tarifas, y solicitudes de ayuda con la cola de avisos.
- **Contacto:** en el piloto no se entrega el celular de la persona. Al abrirse una conexión se
  crea una solicitud para que el equipo los ponga en contacto.

## Puntaje v1 (`lib/matching/`)

- **Por reglas, sin IA**, con los pesos del brief, que viven en la tabla `matching_weights`.
- **Forma de contratar:** es filtro duro.
- **Requisitos:** los obligatorios cuentan doble. Un componente sin requisitos no castiga: su peso
  se reparte entre los demás.
- **Evidencia:** referencia 40 %, archivo 30 %, evaluaciones 30 %.
- **Regla 1:** una prueba revisa que el código del puntaje no mencione edad, nacimiento, foto,
  graduación ni pensión. Comprobé que falla si alguien agrega `fecha_nacimiento`. Otra prueba
  comprueba que agregar esos datos no cambia el resultado.

## Lo que cambió en pantallas que ya existían

- **Explorar, ficha de perfil, problema y Mis procesos:** leen de las vistas reales con Supabase,
  o de ejemplos con la misma forma en modo demostración.
- **Mi empresa (`/empresa/datos`):** registro con NIT y estado de verificación.
- **Oportunidades, Inicio y «Empresas que me buscaron»:** ya usan datos.

## Errores que encontré y corregí al probar

- **Formularios que se vaciaban:** tras un error, React vaciaba el formulario. Se perdía lo que el
  curador marcó y escribió, y el problema que redactó la empresa. Lo arreglé para todos los
  formularios con `components/ui/use-accion.ts`, que mantiene el envío por POST antes de que cargue
  la página.
- **Evaluaciones:** al cargar candidatos, toda evaluación contaba como 5. Ahora se lee el número
  real.

## Pruebas

269 en total. Las nuevas del hito 4:

- **Conexiones (18):** regla 9, flujos desde Explorar y por problema, que nadie se salte pasos,
  vistas, revelación de identidad, reportes y avisos.
- **Puntaje y búsqueda (12)**, incluida la regla 1.
- **Avisos (6):** horario, uno al día, agrupar, sin cuenta y seguimiento a los 3 días.

## Pendiente

- Probar con Supabase real (cuentas).
- Envío de SMS con Twilio, cuando se decida pagarlo. La lógica está en `lib/avisos/programar.ts`;
  falta la tarea programada que lee la cola y envía.
- Seguimiento automático a los 3 días sin respuesta. La lógica existe; falta la tarea programada.
- «Buscar por un problema» con IA. Hoy se eligen los requisitos de la lista; con la IA encendida,
  la empresa también podría escribirlos libres.
