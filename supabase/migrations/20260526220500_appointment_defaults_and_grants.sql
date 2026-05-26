insert into appointment_services (title, description, duration_minutes, price_cents, active)
values ('OlivHairSupply Consultation', 'Default appointment consultation request.', 60, 0, true)
on conflict do nothing;

grant all on appointment_services to service_role;
grant all on appointments to service_role;
