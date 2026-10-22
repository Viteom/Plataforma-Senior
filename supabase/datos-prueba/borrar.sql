-- Borra todo lo que cargó cargar.sql. No toca a las personas reales: solo lo marcado «(prueba)»
-- y los correos @prueba.invalid. En cascada se van necesidades, conexiones, avisos y etiquetas.
delete from help_requests where user_id in (select id from auth.users where email like '%@prueba.invalid');
delete from companies where owner_id in (select id from auth.users where email like '%@prueba.invalid');
delete from talent_profiles where user_id is null and nombre like '%(prueba)%';
delete from auth.users where email like '%@prueba.invalid';
