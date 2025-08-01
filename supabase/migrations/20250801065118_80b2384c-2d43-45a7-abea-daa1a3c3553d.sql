-- Insert a sample idea with category and tags to test the display
INSERT INTO ideas (content, ai_response, tags, category_id, user_id) 
SELECT 
  'This is a sample business idea about creating a mobile app for voice notes while driving',
  'That sounds like an interesting concept! Voice-to-text technology could really help with productivity and safety.',
  ARRAY['business', 'mobile-app', 'productivity'],
  c.id,
  auth.uid()
FROM categories c 
WHERE c.name = 'Business' AND c.user_id = auth.uid()
LIMIT 1;