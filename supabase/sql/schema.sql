create extension if not exists pgcrypto;

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

create index if not exists idx_orders_customer on orders(customer_id);
create index if not exists idx_orders_accepted on orders(accepted_by);
create index if not exists idx_orders_status on orders(status);
create index if not exists idx_order_items_order on order_items(order_id);
create index if not exists idx_messages_order on messages(order_id);

create or replace function set_order_item_price()
returns trigger as $$
declare cat text;
begin
  select category into cat from menus where id = new.menu_id;
  if cat = 'meat' then
    new.unit_price := 3.00;
  else
    new.unit_price := 1.50;
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_set_price on order_items;
create trigger trg_set_price before insert on order_items
for each row execute function set_order_item_price();

create or replace function recompute_order_total_any()
returns trigger as $$
declare oid uuid;
begin
  oid := coalesce(new.order_id, old.order_id);
  update orders
    set total_price = (
      select coalesce(sum(quantity*unit_price),0)
      from order_items where order_id = oid
    ),
    updated_at = now()
  where id = oid;
  return null;
end;
$$ language plpgsql;

drop trigger if exists trg_order_items_after_change on order_items;
create trigger trg_order_items_after_change
after insert or update or delete on order_items
for each row execute function recompute_order_total_any();