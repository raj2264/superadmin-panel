-- Drop existing policies if they exist
drop policy if exists "Essential documents are viewable by all authenticated users" on essential_documents;
drop policy if exists "Essential documents are manageable by superadmins only" on essential_documents;
drop policy if exists "Essential documents are accessible by all authenticated users" on storage.objects;
drop policy if exists "Essential documents are manageable by superadmins only" on storage.objects;
drop policy if exists "Enable read access for all authenticated users" on essential_documents;
drop policy if exists "Enable insert for superadmins" on essential_documents;
drop policy if exists "Enable update for superadmins" on essential_documents;
drop policy if exists "Enable delete for superadmins" on essential_documents;
drop policy if exists "Enable read access for all authenticated users" on storage.objects;
drop policy if exists "Enable insert for superadmins" on storage.objects;
drop policy if exists "Enable update for superadmins" on storage.objects;
drop policy if exists "Enable delete for superadmins" on storage.objects;

-- Create table for essential documents if it doesn't exist
create table if not exists essential_documents (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  description text,
  file_path text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table essential_documents enable row level security;

-- Create policies for the essential_documents table
create policy "Enable read access for all authenticated users"
  on essential_documents for select
  to authenticated
  using (true);

create policy "Enable insert for superadmins"
  on essential_documents for insert
  to authenticated
  with check (
    exists (
      select 1 from superadmins
      where superadmins.id = auth.uid()
    )
  );

create policy "Enable update for superadmins"
  on essential_documents for update
  to authenticated
  using (
    exists (
      select 1 from superadmins
      where superadmins.id = auth.uid()
    )
  );

create policy "Enable delete for superadmins"
  on essential_documents for delete
  to authenticated
  using (
    exists (
      select 1 from superadmins
      where superadmins.id = auth.uid()
    )
  );

-- Create storage bucket if it doesn't exist
insert into storage.buckets (id, name, public)
values ('essential-documents', 'essential-documents', false)
on conflict (id) do nothing;

-- Create policies for storage
create policy "Enable read access for all authenticated users"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'essential-documents');

create policy "Enable insert for superadmins"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'essential-documents'
    and exists (
      select 1 from superadmins
      where superadmins.id = auth.uid()
    )
  );

create policy "Enable update for superadmins"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'essential-documents'
    and exists (
      select 1 from superadmins
      where superadmins.id = auth.uid()
    )
  );

create policy "Enable delete for superadmins"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'essential-documents'
    and exists (
      select 1 from superadmins
      where superadmins.id = auth.uid()
    )
  );

-- Grant necessary permissions
grant usage on schema public to authenticated;
grant all on essential_documents to authenticated;
grant all on storage.objects to authenticated; 