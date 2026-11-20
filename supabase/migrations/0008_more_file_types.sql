-- More file types: documents, presentations, spreadsheets, text, images and archives.
-- Generated from lib/formats.ts. Safe to run more than once.

alter table public.resources drop constraint if exists resources_file_ext_check;
alter table public.resources add constraint resources_file_ext_check check (file_ext in ('pdf', 'doc', 'dot', 'docx', 'dotx', 'odt', 'rtf', 'ppt', 'pps', 'pot', 'pptx', 'ppsx', 'potx', 'odp', 'xls', 'xlsx', 'ods', 'csv', 'txt', 'md', 'png', 'jpg', 'jpeg', 'gif', 'webp', 'zip', 'rar', '7z'));

do $$
begin
  if to_regclass('public.submissions') is not null then
    alter table public.submissions drop constraint if exists submissions_file_ext_check;
    alter table public.submissions add constraint submissions_file_ext_check check (file_ext in ('pdf', 'doc', 'dot', 'docx', 'dotx', 'odt', 'rtf', 'ppt', 'pps', 'pot', 'pptx', 'ppsx', 'potx', 'odp', 'xls', 'xlsx', 'ods', 'csv', 'txt', 'md', 'png', 'jpg', 'jpeg', 'gif', 'webp', 'zip', 'rar', '7z'));
  end if;
end $$;

-- Storage buckets accept the same MIME types.
update storage.buckets
set allowed_mime_types = array[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.template',
    'application/vnd.oasis.opendocument.text',
    'application/rtf',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.openxmlformats-officedocument.presentationml.slideshow',
    'application/vnd.openxmlformats-officedocument.presentationml.template',
    'application/vnd.oasis.opendocument.presentation',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.oasis.opendocument.spreadsheet',
    'text/csv',
    'text/plain',
    'text/markdown',
    'image/png',
    'image/jpeg',
    'image/gif',
    'image/webp',
    'application/zip',
    'application/vnd.rar',
    'application/x-7z-compressed'
]
where id in ('resources', 'submissions');
