-- Sample data for local development. Run after 0001_init.sql.
-- auth_user_id is left null here; link staff rows to real auth.users rows
-- (e.g. via the Supabase dashboard or a signup flow) to log in as them.

insert into staff (id, name, gender, role, contracted_hours, certifications) values
  ('11111111-1111-1111-1111-111111111101', 'Amara Johnson', 'F', 'manager', 37, array['medication', 'first_aid']),
  ('11111111-1111-1111-1111-111111111102', 'David Okafor', 'M', 'care_coordinator', 37, array['medication']),
  ('11111111-1111-1111-1111-111111111103', 'Priya Shah', 'F', 'staff', 30, array['first_aid']),
  ('11111111-1111-1111-1111-111111111104', 'Tom Bracewell', 'M', 'staff', 30, array[]::text[]),
  ('11111111-1111-1111-1111-111111111105', 'Grace Adeyemi', 'F', 'staff', 20, array['medication']);

insert into clients (id, name, address, gender_requirement, is_minor, care_needs) values
  ('22222222-2222-2222-2222-222222222201', 'J. Whitfield', '4 Elm Court, Gracewood', 'F', false, 'Mobility support, medication administration'),
  ('22222222-2222-2222-2222-222222222202', 'R. Marsh', '4 Elm Court, Gracewood', null, false, 'Personal care'),
  ('22222222-2222-2222-2222-222222222203', 'S. Okonkwo', '9 Birch House, Gracewood', 'M', true, 'Waking night supervision');

insert into shift_groups (id, shift_type, start_time, end_time, status) values
  ('33333333-3333-3333-3333-333333333301', 'day', now()::date + interval '8 hours', now()::date + interval '20 hours', 'filled'),
  ('33333333-3333-3333-3333-333333333302', 'waking_night', now()::date + interval '20 hours', now()::date + interval '32 hours', 'open'),
  ('33333333-3333-3333-3333-333333333303', 'day', now()::date + interval '1 day 8 hours', now()::date + interval '1 day 20 hours', 'filled');

insert into shift_group_staff (shift_group_id, staff_id) values
  ('33333333-3333-3333-3333-333333333301', '11111111-1111-1111-1111-111111111103'),
  ('33333333-3333-3333-3333-333333333303', '11111111-1111-1111-1111-111111111104'),
  ('33333333-3333-3333-3333-333333333303', '11111111-1111-1111-1111-111111111105');

insert into shift_group_clients (shift_group_id, client_id) values
  ('33333333-3333-3333-3333-333333333301', '22222222-2222-2222-2222-222222222201'),
  ('33333333-3333-3333-3333-333333333301', '22222222-2222-2222-2222-222222222202'),
  ('33333333-3333-3333-3333-333333333302', '22222222-2222-2222-2222-222222222203'),
  ('33333333-3333-3333-3333-333333333303', '22222222-2222-2222-2222-222222222201');

insert into staffing_requirements (client_id, time_slot, required_staff_count) values
  ('22222222-2222-2222-2222-222222222201', tstzrange(now()::date + interval '8 hours', now()::date + interval '20 hours'), 1),
  ('22222222-2222-2222-2222-222222222203', tstzrange(now()::date + interval '20 hours', now()::date + interval '32 hours'), 2);
