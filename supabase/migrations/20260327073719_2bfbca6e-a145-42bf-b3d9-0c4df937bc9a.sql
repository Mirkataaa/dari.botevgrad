
-- Fix search_path on update_updated_at function
create or replace function public.update_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Drop overly permissive INSERT policies and replace with proper checks

-- Campaigns: only verified orgs or admins can create
drop policy "Verified orgs and admins can create campaigns" on public.campaigns;
create policy "Verified orgs and admins can create campaigns"
  on public.campaigns for insert
  to authenticated
  with check (
    auth.uid() = created_by
    and (
      public.has_role(auth.uid(), 'admin')
      or exists (
        select 1 from public.profiles
        where id = auth.uid()
        and is_organization = true
        and organization_verified = true
      )
    )
  );

-- Donations: only authenticated or allow donor_id to be null for guest donations
drop policy "Anyone can create a donation" on public.donations;
create policy "Anyone can create a donation"
  on public.donations for insert
  to authenticated
  with check (donor_id = auth.uid());

create policy "Anonymous donations allowed"
  on public.donations for insert
  to anon
  with check (donor_id is null);

-- Campaign updates: only campaign creators or admins
drop policy "Campaign creators and admins can add updates" on public.campaign_updates;
create policy "Campaign creators and admins can add updates"
  on public.campaign_updates for insert
  to authenticated
  with check (
    auth.uid() = created_by
    and (
      public.has_role(auth.uid(), 'admin')
      or exists (
        select 1 from public.campaigns
        where id = campaign_id
        and created_by = auth.uid()
      )
    )
  );
