-- Seed roles
insert into roles (role_key, name_en, name_id, faction, action_type, acts_at_night, card_image, sort_order, description_en, description_id) values
('werewolf', 'Werewolf', 'Werewolf', 'werewolf', 'kill', true, 'werewolf', 1,
 'You wake each night with your pack. Choose one villager to eliminate.',
 'Kau bangun setiap malam bersama kawanannya. Pilih satu warga untuk dihilangkan.'),

('villager', 'Villager', 'Villager', 'village', 'none', false, 'villager', 2,
 'You have no special powers. Trust your instincts and find the wolves.',
 'Kau tidak punya kekuatan khusus. Percayai nalurimu dan temukan serigala.'),

('seer', 'Seer', 'Seer', 'village', 'investigate', true, 'seer', 3,
 'Each night the host will reveal a player''s true alignment for tracking.',
 'Setiap malam host akan mengungkapkan aliansi asli seorang pemain.'),

('doctor', 'Doctor', 'Doctor', 'village', 'protect', true, 'doctor', 4,
 'Each night the host will mark one player to protect from the werewolves.',
 'Setiap malam host akan menandai satu pemain untuk dilindungi dari werewolf.'),

('hunter', 'Hunter', 'Hunter', 'village', 'custom', false, 'hunter', 5,
 'When you die, you may take one final shot at a suspect.',
 'Saat kau mati, kau boleh menembak satu tersangka terakhir.'),

('witch', 'Witch', 'Witch', 'village', 'custom', true, 'witch', 6,
 'You hold one heal and one poison. The host will adjudicate your powers.',
 'Kau punya satu ramuan penyembuh dan satu racun. Host akan mengatur kekuatanmu.'),

('cupid', 'Cupid', 'Cupid', 'village', 'custom', false, 'cupid', 7,
 'You link two lovers. If one dies, the other follows.',
 'Kau menghubungkan dua kekasih. Jika satu mati, yang lain mengikuti.'),

('tanner', 'Tanner', 'Tanner', 'neutral', 'custom', false, 'tanner', 8,
 'You win only if you are lynched by the village. Play carefully.',
 'Kau menang hanya jika digantung oleh desa. Bermainlah dengan hati-hati.');
