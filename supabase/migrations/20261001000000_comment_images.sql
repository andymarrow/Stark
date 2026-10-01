-- Lets a comment carry attached images.
--
-- Mentors and judges reviewing contest entries asked for this: pointing at
-- a specific screen is far clearer with a screenshot or an annotated
-- mock-up than with a paragraph describing where to look.
--
-- Nullable, so every existing comment stays valid and application code
-- reading comments written before this migration just sees no images.
alter table public.comments add column if not exists image_urls text[];
