-- Hito 4. Va sola: Postgres no deja usar un valor nuevo de un enum en la misma transacción que lo
-- crea, y la migración siguiente lo usa.
alter type estado_conexion add value if not exists 'pausada';
