-- Add table view support
-- Table view guests join as display devices (TV/tablet) and are not counted as players

alter table room_players add column if not exists is_table_view boolean default false;
