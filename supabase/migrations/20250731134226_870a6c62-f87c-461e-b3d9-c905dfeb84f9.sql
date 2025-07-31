-- Create categories table
CREATE TABLE public.categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#6366f1',
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on categories
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Create policies for categories
CREATE POLICY "Users can view all default categories and their own custom categories" 
ON public.categories 
FOR SELECT 
USING (is_default = true OR auth.uid() = user_id);

CREATE POLICY "Users can create their own custom categories" 
ON public.categories 
FOR INSERT 
WITH CHECK (auth.uid() = user_id AND is_default = false);

CREATE POLICY "Users can update their own custom categories" 
ON public.categories 
FOR UPDATE 
USING (auth.uid() = user_id AND is_default = false);

CREATE POLICY "Users can delete their own custom categories" 
ON public.categories 
FOR DELETE 
USING (auth.uid() = user_id AND is_default = false);

-- Update ideas table to add new columns
ALTER TABLE public.ideas 
ADD COLUMN category_id UUID REFERENCES public.categories(id),
ADD COLUMN parent_recording_id UUID,
ADD COLUMN idea_sequence INTEGER DEFAULT 1;

-- Create trigger for categories updated_at
CREATE TRIGGER update_categories_updated_at
BEFORE UPDATE ON public.categories
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default categories
INSERT INTO public.categories (name, color, is_default, user_id) VALUES
('Business', '#ef4444', true, null),
('Technology', '#3b82f6', true, null),
('Creative', '#8b5cf6', true, null),
('Personal', '#10b981', true, null),
('Learning', '#f59e0b', true, null),
('Health & Fitness', '#06b6d4', true, null),
('Travel', '#84cc16', true, null),
('Finance', '#eab308', true, null),
('Relationships', '#ec4899', true, null),
('Other', '#6b7280', true, null);