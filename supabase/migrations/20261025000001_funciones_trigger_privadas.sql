-- Las funciones de trigger solo deben correr cuando cambia un dato, no por /rest/v1/rpc.
-- Postgres revisa el permiso EXECUTE al crear el trigger, no al dispararlo, así que los
-- triggers siguen funcionando. Lo señaló el asesor de seguridad de Supabase.
revoke execute on function
  public.asignar_rol_inicial(),
  public.encolar_aviso(),
  public.pausar_empresa_reportada(),
  public.proteger_verificacion(),
  public.proteger_verificacion_evidencia(),
  public.regla_empresa_verificada()
from public, anon, authenticated;
