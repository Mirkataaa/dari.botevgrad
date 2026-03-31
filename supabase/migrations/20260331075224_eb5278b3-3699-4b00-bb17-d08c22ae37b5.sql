
-- Create comment_votes table for like/dislike on comments
CREATE TABLE public.comment_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id uuid NOT NULL REFERENCES public.comments(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vote_type text NOT NULL CHECK (vote_type IN ('like', 'dislike')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(comment_id, user_id)
);

ALTER TABLE public.comment_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view votes" ON public.comment_votes FOR SELECT USING (true);
CREATE POLICY "Auth users can insert votes" ON public.comment_votes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own votes" ON public.comment_votes FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own votes" ON public.comment_votes FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Create update_votes table for like/dislike on campaign updates
CREATE TABLE public.update_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  update_id uuid NOT NULL REFERENCES public.campaign_updates(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vote_type text NOT NULL CHECK (vote_type IN ('like', 'dislike')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(update_id, user_id)
);

ALTER TABLE public.update_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view update votes" ON public.update_votes FOR SELECT USING (true);
CREATE POLICY "Auth users can insert update votes" ON public.update_votes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own update votes" ON public.update_votes FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own update votes" ON public.update_votes FOR DELETE TO authenticated USING (auth.uid() = user_id);
