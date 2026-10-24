-- Etapas nuevas del proceso después de abrir una conexión. Van en su propio archivo: un valor nuevo
-- de un enum no se puede usar en la misma transacción en que se crea.
alter type estado_conexion add value if not exists 'conversacion';
alter type estado_conexion add value if not exists 'acuerdo';
alter type estado_conexion add value if not exists 'en_curso';
