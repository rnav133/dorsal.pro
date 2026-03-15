-- Tabla de suscriptores
create table if not exists subscribers (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  name text,
  plan text not null default 'free' check (plan in ('free', 'pro')),
  stripe_customer_id text,
  stripe_subscription_id text,
  preferences jsonb default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Tabla de carreras inscritas (plan pro)
create table if not exists race_registrations (
  id uuid primary key default gen_random_uuid(),
  subscriber_id uuid references subscribers(id) on delete cascade,
  race_id text not null,        -- ID de Airtable
  race_name text not null,
  race_date date not null,
  registered_at timestamptz default now(),
  training_plan_id uuid
);

-- Tabla de planes de entrenamiento (plan pro)
create table if not exists training_plans (
  id uuid primary key default gen_random_uuid(),
  subscriber_id uuid references subscribers(id) on delete cascade,
  race_registration_id uuid references race_registrations(id) on delete cascade,
  race_name text not null,
  race_date date not null,
  plan_data jsonb not null,     -- semanas y días de entrenamiento
  pdf_url text,
  created_at timestamptz default now()
);

-- RLS básico
alter table subscribers enable row level security;
alter table race_registrations enable row level security;
alter table training_plans enable row level security;

-- Índices
create index if not exists subscribers_email_idx on subscribers(email);
create index if not exists race_registrations_subscriber_idx on race_registrations(subscriber_id);
create index if not exists training_plans_subscriber_idx on training_plans(subscriber_id);
