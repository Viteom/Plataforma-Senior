# Plataformas similares y sustitutas: qué le puede faltar a la plataforma

20 de octubre de 2026. Investigación de escritorio (fuentes públicas, sin entrevistas). Varias
cifras son autodeclaradas por las propias plataformas o tienen uno o dos años; están marcadas.

## Resumen

- **Nadie en Colombia combina lo que propone el brief.** Lo que existe para +50 es una bolsa de
  vacantes (Porvenir con elempleo.com), programas de contratación de las cajas (Comfama) y
  cupos en ferias y convocatorias públicas. Ninguno parte del perfil, ni usa historias, ni
  permite perfil reservado, ni vende experiencias guiadas por sabedoras.
- **El modelo más parecido es español: Generación SAVIA** (Fundación Endesa). Tiene comunidad,
  formación, mentoría entre pares y un servicio de intermediación donde una persona del equipo
  revisa cada candidatura antes de enviarla. Es lo mismo que el curador del brief, pero sobre
  vacantes.
- **Los cinco vacíos más importantes del MVP actual:**
  1. Cómo se entera el talento de una oportunidad, si no hay push ni WhatsApp.
  2. Protección contra estafas laborales, que en Colombia piden plata "para aportes".
  3. Reputación y evidencia: el matching le da 10 % a "confiabilidad y evidencia", pero todavía
     no está definido de dónde sale ese dato.
  4. Un primer producto de bajo compromiso para la empresa, como una conversación de una hora.
  5. Ayuda para que la persona sepa cuánto cobrar y cómo facturar.

---

## 1. Mapa de alternativas

| Categoría | Ejemplos | Qué resuelven | Qué no hacen (y nosotros sí) |
|---|---|---|---|
| Bolsas de empleo +50 | Porvenir + elempleo.com (Col.), AARP Job Board, RetirementJobs, Workforce50, Seniors4Hire (EE. UU.) | Vacantes filtradas por "empresas que contratan +50" | Giran alrededor de la vacante y el CV; muestran la edad |
| Ecosistemas +50 | Generación SAVIA (España), Rest Less (Reino Unido) | Empleo, formación, mentoría, comunidad, eventos, finanzas | No traducen experiencia en huella; poca atención a quien no es digital |
| Marketplaces de expertos y ejecutivos fraccionales | Business Talent Group, Catalant, Go Fractional, Paro, Malt, Outvise, Consultor-ES (México y LatAm) | Perfil, búsqueda, propuesta, contrato, pago, reseñas | No están pensados para talento con trayectoria sin marca personal ni para el campo |
| Redes de expertos y mentoría | GLG, MentorHood, Mentor (Growth Rockstar) | Consultas cortas pagadas por llamada | Solo ejecutivos, con mucha exigencia digital |
| Becas de segunda carrera | Encore Fellowships (CoGenerate, hoy en Fedcap) | Proyecto de un año, unas 1.000 horas, financiado por la empresa o la ONG | No existe en Colombia |
| Experiencias y talleres | Airbnb Experiences con abuelas anfitrionas, Wecandoo (talleres con artesanos para equipos), talleres corporativos con artistas indígenas (Australia, Canadá) | Catálogo, ficha, reseñas, cotización para equipos | No hay un marketplace de experiencias con sabedoras para empresas |
| Para baja alfabetización digital | Vahan (bot de WhatsApp con voz), KaamWapasi (PWA y línea telefónica automática, India), Babajob (SMS y voz) | Registro y búsqueda por voz o WhatsApp | Empleo informal y de baja calificación |
| Selección ciega | Applied, Blendoor, Faceless Pro | Ocultan nombre, edad y fechas; evalúan con pruebas de habilidad | No están hechas para +50 ni para el campo |
| **Sustitutos reales** | Red personal y referidos, LinkedIn, Computrabajo y elempleo, Servicio Público de Empleo, cajas de compensación (Comfama "Talento Silver"), cazatalentos y consultoras +50 (AD+50 en Chile) | Hoy es así como se contrata a alguien con trayectoria | — |

Los sustitutos son la verdadera competencia: la empresa llama a "alguien que conoce a alguien".
La plataforma gana si es **más rápida y más confiable que el referido**, no solo si es mejor que
una bolsa de empleo.

## 2. Lo que ya está bien resuelto en el brief

Ningún competidor revisado combina estas piezas. Conviene protegerlas en cada decisión:

- **Perfil primero y "buscar por un problema".** Se parece a cómo trabajan Catalant y BTG, que
  delimitan el problema y presentan una lista corta, pero llevado a pymes y al territorio.
- **Huella construida desde historias**, también por llamada o con un gestor. Nadie más lo hace;
  lo más cercano son los registros por voz de India.
- **Perfil reservado.** La selección ciega existe para combatir sesgos de edad, pero aquí lo
  decide la persona. La encuesta citada por HR Today muestra que más de la mitad de los
  candidatos pide quitar las fechas de las hojas de vida.
- **Curaduría humana con un máximo de 5 propuestas.** Es igual al modelo de Talento SAVIA y de
  los marketplaces de alto nivel.
- **Experiencias con saberes y reporte de impacto.** Es un mercado sin dueño en la región.

## 3. Lo que le puede faltar

### A. Antes del piloto (bajo costo, alto riesgo si falta)

| # | Vacío | Por qué importa | Quién lo hace | Propuesta concreta | Hito |
|---|---|---|---|---|---|
| A1 | **Avisos al talento cuando llega una oportunidad** | En el MVP no hay push ni WhatsApp. Si la persona se registró solo con el celular, no tiene correo. Sin un aviso, el "Me interesa" nunca ocurre y la conexión se cae. | Vahan y Babajob (WhatsApp, SMS) | SMS breve con el nombre de la marca: "Tiene una oportunidad nueva, entre con su código". Opcionalmente, una llamada del equipo si no responde en 3 días. Ya hay Twilio, así que no cambia el stack. | 4 |
| A2 | **Protección antifraude** | La Policía recibió más de 1.200 denuncias por ofertas falsas en el primer semestre de 2024. El truco típico es cobrar por "aportes a salud y pensión" o por cursos, y la variante reciente roba la cuenta de WhatsApp. Nuestro público es justo el blanco. | El Servicio Público de Empleo lo avisa siempre; los marketplaces verifican | Verificar el NIT de cada empresa (RUES) y mostrar un sello de "Empresa verificada". Aviso fijo: "Nadie de [MARCA] ni de una empresa le va a pedir dinero". Botón "Reportar esta empresa" en cada conexión. | 2 y 4 |
| A3 | **De dónde sale la evidencia** | El matching le da 10 % a "confiabilidad y evidencia", y el modelo de datos no dice cómo se obtiene. | Malt y Airbnb (reseñas verificadas); Catalant (verificación en 2 a 5 días) | Tres fuentes simples: (1) la evaluación al cerrar una conexión, (2) una referencia que el equipo llama, (3) fotos o documentos del trabajo, que el gestor puede cargar. Se muestran a la empresa solo si la persona lo autoriza. | 3 y 4 |
| A4 | **"Una conversación de una hora" como forma de contratar** | Es la puerta de entrada de menor riesgo para la empresa y una primera experiencia para el talento. Así funcionan GLG y las plataformas de mentoría. | GLG, MentorHood | Agregar "conversación" (1 a 2 horas) a `talent_offers`, con tarifa sugerida. Pagos por fuera en v1, como las experiencias. | 3 |
| A5 | **Cuánto cobrar** | En los marketplaces abiertos se compite por precio; quien no tiene referencia se subvalora o se sale del mercado. | Malt deja ver tarifas por día; las redes curadas fijan rangos | Mostrar un rango orientativo por forma de contratar al llenar "tarifa esperada", con la opción de "prefiero que el equipo me oriente". | 3 |

### B. Durante el piloto (validar con usuarios antes de construir)

| # | Vacío | Quién lo hace | Idea | Hito sugerido |
|---|---|---|---|---|
| B1 | **Contratos y facturación**: cuenta de cobro, RUT y aportes como independiente. Es un freno real para quien nunca ha facturado. | Malt genera el contrato digital al aceptar la propuesta | Guía paso a paso y plantilla de cuenta de cobro dentro de "Ayuda". Revisar con un abogado o contador qué pasa con quien ya recibe pensión. | 5 |
| B2 | **Incentivos públicos para la empresa** | Bogotá ("Talento +50") da $1.300.000 por cada persona +50 que contrata una mipyme, según la convocatoria de 2026 | Si la ciudad del piloto tiene algo parecido, mostrarlo en la ficha y en "Buscar por un problema". | 4 |
| B3 | **Comunidad y pares** | SAVIA (mentoría entre pares "Twins"), Rest Less (más de 100 eventos en línea al mes) | Encuentros mensuales del territorio y "Cuéntele a otro cómo le fue". Ayuda a quedarse mientras llega la primera oportunidad. | Después del piloto |
| B4 | **Voluntariado y proyectos sociales** como puerta de entrada | Rest Less, Encore Fellowships | Proyectos cortos con fundaciones aliadas: construyen evidencia (A3) y confianza. | Después del piloto |
| B5 | **Reseñas y fechas en las experiencias** | Airbnb (la ficha de la anfitriona en Santorini tiene 4,98 con 798 reseñas), Wecandoo (el equipo propone fechas y recibe cotización) | Testimonios en la ficha después del reporte de impacto; meses disponibles en vez de "cualquier mes". | 5 |
| B6 | **Versión virtual de algunas experiencias** | Talleres corporativos indígenas en Toronto (presencial o virtual) | Para empresas fuera de la ciudad del piloto. Solo si la sabedora quiere. | Después del piloto |

### C. Posibles líneas de negocio (el brief no define cómo se sostiene la plataforma)

| Modelo | Quién lo usa | Encaje |
|---|---|---|
| Comisión por contratación, decreciente con la relación | Malt: 10 %, baja a 5 % después de 6 meses con el mismo cliente y a 2 % si el freelancer trae al cliente (verificar en su web, cambió varias veces en 2026) | Natural cuando haya pagos en la plataforma |
| Margen sobre la tarifa del experto | GLG, Catalant | Para "conversaciones" y proyectos curados |
| Sello de empresa amiga de la trayectoria | Certified Age Friendly Employer (EE. UU.): evaluación en 12 categorías, tarifa según el tamaño de la empresa | Encaja con Vasees y con el reporte de impacto; posiciona la marca |
| Becas de trayectoria pagadas por empresas o cajas | Encore Fellowships (en algunos casos la empresa paga la beca de su exempleado) | Producto para responsabilidad social y para cajas de compensación |
| Margen de las experiencias | Wecandoo, Airbnb | Ya está en el brief (% para la sabedora) |

## 4. Cambios sugeridos al brief

> Los puntos 1 a 3 ya están incorporados en `docs/brief.md` y en el CLAUDE.md (regla 9) desde el
> 20 de octubre de 2026. Los puntos 4 y 5 siguen abiertos.

1. **Hito 4:** agregar el aviso por SMS al talento (A1) y el sello de empresa verificada con
   botón de reporte (A2). Sin A1, el flujo de conexión no se cierra.
2. **Hito 3:** agregar "conversación" como forma de contratar (A4), el rango de tarifa (A5) y la
   carga de evidencias (A3).
3. **Modelo de datos:** `companies.verificada` (fecha y fuente), tabla `evidence` (tipo,
   archivo o contacto, autorizada por la persona), `talent_offers.tipo` con `conversacion`,
   tabla `reports` para denuncias de empresas.
4. **Preguntas para las pruebas con usuarios:**
   - ¿Cómo prefiere enterarse de una oportunidad: SMS, llamada o WhatsApp?
   - ¿Sabe cuánto cobrar por hora? ¿Ha hecho una cuenta de cobro?
   - A la empresa: ¿pagaría una conversación de una hora antes de contratar un proyecto?
5. **Decisión pendiente:** cómo se sostiene la plataforma después del piloto (sección C).

## 5. Límites de esta revisión

- No encontré información pública de **Senniors** ni de **Talensen**, que aparecen citadas como
  plataformas senior en España. Si tienes sus enlaces, las reviso.
- No hallé la página oficial de **Comfama "Talento Silver"**. Lo que hay viene del Premio Innova
  Mayor 2025 (480 personas vinculadas y 18 % menos rotación en 15 empresas) y de testimonios.
- Las cifras de BTG, Catalant, SAVIA y Rest Less son autodeclaradas.
- Siguiente paso recomendado: 5 entrevistas a empresas y 5 a talento del territorio para
  priorizar la sección 3 con evidencia propia.

## Fuentes

- Generación SAVIA: [Talento SAVIA](https://www.generacionsavia.org/info/talento-savia-intermediacion-laboral-para-seniors), [empresas y plataformas que apuestan por +50](https://www.generacionsavia.org/think-tank/actualidad/talento-senior-empresas-y-plataformas-que-apuestan-por-los-mayores-de-50), [nota Endesa 2024](https://www.endesa.com/es/prensa/sala-de-prensa/noticias/social/empleo-seniors-1-de-cada-3-parados-tiene-50-anos)
- Colombia: [Porvenir y elempleo (Infobae)](https://www.infobae.com/colombia/2024/07/06/esta-plataforma-ofrece-vacantes-para-los-adultos-mayores-asi-puede-conocerlas/), [Premio Innova Mayor 2025 (Forbes)](https://forbes.co/actualidad/conozca-los-ganadores-del-premio-innova-mayor-2025-una-iniciativa-en-pro-del-talento-senior-liderada-por-porvenir), [Talento +50 Bogotá](https://www.diariodelsur.com.co/?p=645565), [vacantes Talento Capital 2026](https://www.publimetro.co/bogota/2026/09/08/alcaldia-de-bogota-abrio-1452-vacantes-de-empleo-hay-opciones-sin-experiencia-y-para-mayores-de-50-anos/), [Megaferia Corferias](https://colombinews.com.co/megaferia-de-empleo-en-corferias-ofrece-oportunidades-laborales-para-mayores-de-50-anos/)
- Estafas: [La Nota Económica](https://lanotaeconomica.com.co/?p=39795), [Portafolio](https://www.portafolio.co/economia/empleo/asi-estafan-con-ofertas-falsas-de-empleo-que-piden-dinero-545534), [Publimetro, WhatsApp](https://www.publimetro.co/bogota/2026/06/26/recibimos-tu-hoja-de-vida-agregame-a-whatsapp-pilas-esa-llamada-termina-en-estafa/), [Blu Radio, Rionegro](https://www.bluradio.com/regiones/antioquia/alertan-de-nuevo-por-estafas-en-rionegro-antioquia-esta-vez-con-ofertas-de-empleo-rg10)
- Bolsas +50: [AARP, sitios para trabajadores mayores](https://www.aarp.org/work/job-search/websites-older-workers-find-jobs/), [Savvy Senior](https://savvysenior.org/?p=21131)
- Rest Less: [Acerca de](https://restless.co.uk/about/)
- Fraccionales: [Business Talent Group](https://businesstalentgroup.com/?p=6865), [Catalant](https://catalant.com/for-independent-consultants/how-to-partner), [guía Stratrix](https://www.stratrix.com/buyer-guides/fractional-and-on-demand-talent-marketplaces)
- Malt: [comisiones](https://help.malt.com/hc/en-150/articles/29539691425938-How-does-the-Malt-commission-work-for-freelancers), [Wise sobre Malt](https://wise.com/en-fr/blog/malt-freelance-platform-france)
- LatAm: [AD+50 Chile](https://revistanos.cl/con-equipo-de-expertos-ad-consulting-impulsa-ad50-el-nuevo-servicio-enfocado-en-talento-senior/), [Consultor-ES](https://www.consultor-es.com/), [MentorHood](https://www.mentorhoodlatam.com/en/mentores), [Buk](https://www.buk.cl/blog/talento-senior-experiencia-trabajadores-mayores-50-anos-futuro-trabajo)
- Redes de expertos: [GLG (Harvard D3)](https://d3.harvard.edu/platform-digit/?p=2094), [reseña de GLG](https://expertnetworkcalls.com/blog/91/glg-platform-review-expert-network-features-user-insights)
- Encore Fellowships: [6 cosas que saber](https://encore.org/6-things-you-should-know-about-encore-fellowships/), [programas de CoGenerate](https://cogenerate.org/legacy-programs/)
- Baja alfabetización digital: [IndiaAI, Vahan](https://indiaai.gov.in/case-study/revolutionizing-blue-collar-job-recruitment-in-india), [KaamWapasi](https://lbb.lbbonline.com/awards/immortals/entry/3010), [Babajob (Microsoft Research)](https://microsoft.com/en-us/research/wp-content/uploads/2016/10/blagsvedt-babajob_ui_overview.pdf)
- Experiencias: [Airbnb Santorini](https://www.airbnb.ca/experiences/4676088), [Wecandoo para equipos](https://wecandoo.be/en/ateliers/teambuilding), [Aboriginal Incursions](https://www.aboriginalincursions.com.au/corporate-workshops/), [Destination Toronto](https://www.destinationtoronto.com/meetings/blog/post/team-building-workshops/)
- Selección ciega: [TestGorilla](https://testgorilla.com/blog/how-anonymous-applications-fit-skills-based-hiring), [HR Today, edadismo](https://www.hrotoday.com/news/ticker/33-6-of-candidates-over-50-have-experiencing-ageism/)
- Sello de empleador: [CAFE (Cincinnati)](https://cincinnati-oh.gov/sites/hr/assets/File/HR/CAFE-Certification-OnePage.pdf), [TD Magazine](https://td.org/content/td-magazine/cafe-certification-combats-workplace-ageism)
