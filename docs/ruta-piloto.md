# Ruta al piloto: de la demostración a la base real

Hoy la web publicada corre en modo demostración (sin Supabase). Esta es la ruta para llegar al
piloto con personas reales, en orden. «Tú» son pasos en paneles con cuenta (Supabase, Vercel, un
proveedor); las llaves nunca se pegan en el chat ni llevan prefijo `NEXT_PUBLIC_` si son secretas.

## Fase A · Dos ambientes

| Ambiente | Proyecto de Supabase | Despliegue de Vercel | `NEXT_PUBLIC_AMBIENTE` |
| --- | --- | --- | --- |
| Pruebas | el actual (`grmafhdgtgjyryopykdp`), renombrado `kanna-pruebas` | Preview (ramas) | `pruebas` |
| Producción | uno nuevo, `kanna-produccion` | Production (`main`) | `produccion` |

El proyecto actual tiene datos de prueba: por eso queda como pruebas y producción nace limpia.

1. **Tú** · Supabase → proyecto actual → Settings → General: renombrarlo `kanna-pruebas` y anotar
   su región.
2. **Tú** · Aplicar en pruebas las tres migraciones pendientes, en orden, desde `supabase-sql/`:
   `pegar-en-supabase-backoffice.sql`, `pegar-en-supabase-organizaciones.sql`,
   `pegar-en-supabase-panel-retencion.sql`. **Claude** verifica después.
3. **Tú** · Crear el proyecto `kanna-produccion` en la **misma región** que pruebas. Si se puede
   elegir, East US (North Virginia): queda junto a la región por defecto de las funciones de
   Vercel y cerca de Colombia.
4. **Tú** · En `kanna-produccion`, SQL Editor: pegar `supabase-sql/produccion/parte-1-de-4.sql` a
   `parte-4-de-4.sql`, una por una, y al final `verificar.sql` (debe decir 25 migraciones, ninguna
   tabla sin RLS y la tarea `kanna-limpieza-diaria`). Si una parte falla, no se aplica nada de esa
   parte: copia el error.

   Los archivos se regeneran con `node scripts/preparar-sql-supabase.mjs` cuando haya
   migraciones nuevas. Cortan después de cada migración que agrega valores a un tipo, porque
   Postgres no deja usarlos en la misma transacción.

## Fase B · Cuentas (en cada proyecto)

5. **Tú** · Authentication → URL Configuration: Site URL y redirecciones del despliegue de cada
   ambiente.
6. **Tú** · Settings → JWT Keys: pasar a llaves asimétricas. Así la protección de rutas valida la
   sesión sin ir al servidor de Auth.
7. **Tú** · Authentication → Multi-factor: TOTP activado (viene así) para el segundo factor del
   equipo.
8. **SMS** (decisión con costo): para que el talento entre con su celular hace falta un
   proveedor (Twilio Verify está preparado). Sin dominio, el correo de Supabase no sirve para
   el público: solo envía pocos mensajes y a direcciones del equipo del proyecto. En el piloto,
   el talento y las organizaciones pueden entrar por SMS; el equipo entra con clave y app de
   verificación, sin correo.
9. **Tú** · Crear las cuentas del equipo (`docs/backoffice-equipo.md`).

## Fase C · Vercel

10. **Tú** · Settings → Environment Variables, separadas por ambiente:
    - Production: URL y llave pública de `kanna-produccion`, `SUPABASE_SERVICE_ROLE_KEY` de
      producción, un `OTP_PEPPER` propio y `NEXT_PUBLIC_AMBIENTE=produccion`.
    - Preview: lo mismo con `kanna-pruebas` y `NEXT_PUBLIC_AMBIENTE=pruebas`.
11. **Tú** · Settings → Functions: la región de las funciones igual a la de Supabase.
12. **Tú** · Antes de cobrar a organizaciones: plan Pro de Vercel (el gratuito no admite uso
    comercial).

## Fase D · Primer recorrido

13. En pruebas (una rama cualquiera): recorrer talento, organización y equipo de principio a
    fin. Arriba se ve la franja «Ambiente de pruebas». **Claude** revisa la base después.
14. En producción: lo mismo con una cuenta real de cada rol, y borrar lo creado.

## Fase E · Cuidar lo que ya funciona

15. Copia semanal cifrada de producción (GitHub Actions) y un ensayo de recuperación.
16. Monitor de disponibilidad gratuito sobre la web y la base.
17. Hoja de costos mensual por ambiente (documento «Arquitectura de Kánna», sección 7).
