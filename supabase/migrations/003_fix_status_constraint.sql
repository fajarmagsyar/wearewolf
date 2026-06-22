-- Fix rooms.status check constraint to include 'assigning' phase
alter table rooms drop constraint if exists rooms_status_check;
alter table rooms add constraint rooms_status_check
  check (status in ('lobby', 'assigning', 'playing', 'over'));
