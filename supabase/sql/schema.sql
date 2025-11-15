create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  openid text unique not null,
  role text check (role in ('husband','wife')),
  nickname text,
  avatar_url text,
  created_at timestamp with time zone default now()
);

create table if not exists menus (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text check (category in ('meat','vegetable')) not null,
  ingredients jsonb,
  method text,
  source text,
  created_by uuid references users(id),
  created_at timestamp with time zone default now()
);

create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references users(id) not null,
  accepted_by uuid references users(id),
  status text check (status in ('pending','accepted','in_progress','completed','cancelled')) not null default 'pending',
  total_price numeric(10,2) default 0,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create table if not exists order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references orders(id) on delete cascade not null,
  menu_id uuid references menus(id) not null,
  quantity integer not null check (quantity > 0),
  unit_price numeric(10,2) not null
);

create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references orders(id) on delete cascade not null,
  sender_id uuid references users(id) not null,
  content text not null,
  created_at timestamp with time zone default now()
);