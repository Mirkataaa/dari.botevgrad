
-- Enum types
create type public.app_role as enum ('admin', 'moderator', 'user');
create type public.campaign_status as enum ('pending', 'active', 'completed', 'rejected', 'stopped');
create type public.campaign_category as enum (
  'social',
  'healthcare', 
  'education',
  'culture',
  'ecology',
  'infrastructure'
);

-- Profiles table
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  phone text,
  is_organization boolean default false,
  organization_name text,
  organization_verified boolean default false,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

alter table public.profiles enable row level security;

create policy "Public profiles are viewable by everyone"
  on public.profiles for select
  using (true);

create policy "Users can update own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  to authenticated
  with check (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    coalesce(new.raw_user_meta_data ->> 'avatar_url', '')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- User roles table (separate from profiles per security best practice)
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role app_role not null,
  unique (user_id, role)
);

alter table public.user_roles enable row level security;

-- Security definer function to check roles (prevents RLS recursion)
create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = _user_id
      and role = _role
  )
$$;

create policy "Users can view own roles"
  on public.user_roles for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Admins can manage roles"
  on public.user_roles for all
  to authenticated
  using (public.has_role(auth.uid(), 'admin'));

-- Campaigns table
create table public.campaigns (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null,
  short_description text,
  category campaign_category not null,
  target_amount numeric(12, 2) not null,
  current_amount numeric(12, 2) default 0 not null,
  status campaign_status default 'pending' not null,
  deadline timestamptz,
  images text[] default '{}',
  documents text[] default '{}',
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

alter table public.campaigns enable row level security;

create policy "Campaigns viewable by everyone"
  on public.campaigns for select
  using (status in ('active', 'completed') or auth.uid() = created_by or public.has_role(auth.uid(), 'admin'));

create policy "Verified orgs and admins can create campaigns"
  on public.campaigns for insert
  to authenticated
  with check (true);

create policy "Creators and admins can update campaigns"
  on public.campaigns for update
  to authenticated
  using (auth.uid() = created_by or public.has_role(auth.uid(), 'admin'));

-- Donations table
create table public.donations (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid references public.campaigns(id) on delete cascade not null,
  donor_id uuid references auth.users(id) on delete set null,
  donor_name text,
  amount numeric(12, 2) not null,
  is_anonymous boolean default false,
  stripe_payment_id text,
  stripe_session_id text,
  status text default 'pending' not null,
  created_at timestamptz default now() not null
);

alter table public.donations enable row level security;

create policy "Public donations are viewable"
  on public.donations for select
  using (
    (status = 'completed' and is_anonymous = false)
    or donor_id = auth.uid()
    or public.has_role(auth.uid(), 'admin')
  );

create policy "Anyone can create a donation"
  on public.donations for insert
  with check (true);

-- Comments table
create table public.comments (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid references public.campaigns(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  content text not null,
  is_suggestion boolean default false,
  likes_count integer default 0,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

alter table public.comments enable row level security;

create policy "Comments are viewable by everyone"
  on public.comments for select
  using (true);

create policy "Authenticated users can create comments"
  on public.comments for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can update own comments"
  on public.comments for update
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can delete own comments or admin can delete"
  on public.comments for delete
  to authenticated
  using (auth.uid() = user_id or public.has_role(auth.uid(), 'admin'));

-- Campaign updates table
create table public.campaign_updates (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid references public.campaigns(id) on delete cascade not null,
  title text not null,
  content text not null,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz default now() not null
);

alter table public.campaign_updates enable row level security;

create policy "Updates are viewable by everyone"
  on public.campaign_updates for select
  using (true);

create policy "Campaign creators and admins can add updates"
  on public.campaign_updates for insert
  to authenticated
  with check (true);

-- Updated_at trigger function
create or replace function public.update_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger update_profiles_updated_at
  before update on public.profiles
  for each row execute function public.update_updated_at();

create trigger update_campaigns_updated_at
  before update on public.campaigns
  for each row execute function public.update_updated_at();

create trigger update_comments_updated_at
  before update on public.comments
  for each row execute function public.update_updated_at();
