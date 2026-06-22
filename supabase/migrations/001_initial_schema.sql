-- Roles (seeded, global)
create table if not exists roles (
    id serial primary key,
    role_key varchar(40) unique not null,
    name_en varchar(60) not null,
    name_id varchar(60) not null,
    faction varchar(20) not null default 'village' check (faction in ('village', 'werewolf', 'neutral')),
    description_en text,
    description_id text,
    action_type varchar(20) not null default 'none' check (action_type in ('none', 'kill', 'protect', 'investigate', 'custom')),
    acts_at_night boolean default false,
    card_image varchar(190),
    is_active boolean default true,
    sort_order int default 0,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- Rooms
create table if not exists rooms (
    id serial primary key,
    code varchar(6) unique not null,
    host_user_id uuid references auth.users(id),
    status varchar(20) not null default 'lobby' check (status in ('lobby', 'playing', 'over')),
    phase varchar(10) not null default 'night' check (phase in ('day', 'night')),
    day_number int not null default 0,
    locale varchar(5) not null default 'en',
    settings jsonb default '{}',
    voting_open boolean default false,
    state_version bigint not null default 1,
    winner varchar(20) check (winner in ('village', 'werewolf', 'tanner')),
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- Players in a room
create table if not exists room_players (
    id serial primary key,
    room_id int not null references rooms(id) on delete cascade,
    user_id uuid references auth.users(id),
    guest_token varchar(64),
    display_name varchar(40) not null,
    seat_no int,
    role_id int references roles(id) on delete set null,
    is_alive boolean default true,
    is_protected boolean default false,
    marked_for_death boolean default false,
    revealed boolean default false,
    voted_for_id int references room_players(id),
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

create index if not exists idx_room_players_room_user on room_players(room_id, user_id);
create index if not exists idx_room_players_room_guest on room_players(room_id, guest_token);

-- Room role config (host picks which roles + counts)
create table if not exists room_roles (
    room_id int not null references rooms(id) on delete cascade,
    role_id int not null references roles(id) on delete cascade,
    qty int not null default 1,
    primary key (room_id, role_id)
);

-- Game events (for audit/replay)
create table if not exists game_events (
    id serial primary key,
    room_id int not null references rooms(id) on delete cascade,
    day_number int not null,
    phase varchar(10) not null check (phase in ('day', 'night')),
    type varchar(20) not null check (type in ('kill', 'protect', 'investigate', 'vote', 'death', 'custom')),
    actor_player_id int references room_players(id) on delete set null,
    target_player_id int references room_players(id) on delete set null,
    payload jsonb,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

create index if not exists idx_game_events_room_day_phase on game_events(room_id, day_number, phase);

-- Enable realtime on all tables
alter publication supabase_realtime add table roles;
alter publication supabase_realtime add table rooms;
alter publication supabase_realtime add table room_players;
alter publication supabase_realtime add table room_roles;
alter publication supabase_realtime add table game_events;
