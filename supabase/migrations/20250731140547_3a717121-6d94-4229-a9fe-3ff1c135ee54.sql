-- Add tags column to ideas table
ALTER TABLE public.ideas 
ADD COLUMN tags TEXT[] DEFAULT '{}';

-- Create an index for better performance on tag searches
CREATE INDEX idx_ideas_tags ON public.ideas USING GIN(tags);