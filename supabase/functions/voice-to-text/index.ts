import "https://deno.land/x/xhr@0.1.0/mod.ts"
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Process base64 in chunks to prevent memory issues
function processBase64Chunks(base64String: string, chunkSize = 32768) {
  const chunks: Uint8Array[] = [];
  let position = 0;
  
  while (position < base64String.length) {
    const chunk = base64String.slice(position, position + chunkSize);
    const binaryChunk = atob(chunk);
    const bytes = new Uint8Array(binaryChunk.length);
    
    for (let i = 0; i < binaryChunk.length; i++) {
      bytes[i] = binaryChunk.charCodeAt(i);
    }
    
    chunks.push(bytes);
    position += chunkSize;
  }

  const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;

  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }

  return result;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { audio } = await req.json()
    
    if (!audio) {
      throw new Error('No audio data provided')
    }

    // Get the authorization header to identify the user
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    // Create Supabase client to get user's API key
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } }
    })

    // Get user from the auth header
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      throw new Error('Unauthorized')
    }

    // Get user's profile with API key
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('api_key')
      .eq('user_id', user.id)
      .single()

    if (profileError || !profile?.api_key) {
      throw new Error('OpenAI API key not found. Please configure it in settings.')
    }

    // Get default categories for auto-categorization
    const { data: categories, error: categoriesError } = await supabase
      .from('categories')
      .select('id, name')
      .eq('is_default', true)

    console.log('Processing audio with OpenAI...')
    
    // Process audio in chunks
    const binaryAudio = processBase64Chunks(audio)
    
    // Prepare form data
    const formData = new FormData()
    const blob = new Blob([binaryAudio], { type: 'audio/webm' })
    formData.append('file', blob, 'audio.webm')
    formData.append('model', 'whisper-1')

    console.log('Sending to OpenAI Whisper API...')

    // Send to OpenAI
    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${profile.api_key}`,
      },
      body: formData,
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('OpenAI API error:', errorText)
      throw new Error(`OpenAI API error: ${errorText}`)
    }

    const result = await response.json()
    console.log('Transcription result:', result)

    const transcriptText = result.text
    
    // Analyze the transcription for multiple ideas and categorization
    console.log('Analyzing transcription for ideas and categories...')
    
    const categoryNames = categories ? categories.map(c => c.name).join(', ') : 'Business, Technology, Creative, Personal, Learning, Health & Fitness, Travel, Finance, Relationships, Other'
    
    const analysisPrompt = `Analyze this transcribed text and identify if it contains multiple separate ideas or concepts. Extract each distinct idea and categorize it.

Text: "${transcriptText}"

Available categories: ${categoryNames}

Return a JSON response with this exact structure:
{
  "multiple_ideas": boolean,
  "ideas": [
    {
      "content": "extracted idea text",
      "category": "category_name",
      "sequence": 1
    }
  ]
}

Guidelines:
- If there's only one idea, set multiple_ideas to false and return one item
- Extract each distinct, actionable idea separately
- Choose the most appropriate category for each idea
- Keep the original wording but clean up obvious speech-to-text errors
- Number ideas in sequence if multiple exist`

    const analysisResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${profile.api_key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are a helpful assistant that analyzes transcribed voice recordings to extract and categorize ideas. Always respond with valid JSON.' },
          { role: 'user', content: analysisPrompt }
        ],
        temperature: 0.3,
        response_format: { type: "json_object" }
      }),
    })

    if (!analysisResponse.ok) {
      console.error('Analysis API error:', await analysisResponse.text())
      // Fallback to simple response if analysis fails
      return new Response(
        JSON.stringify({ 
          text: transcriptText,
          ideas: [{
            content: transcriptText,
            category: null,
            sequence: 1
          }],
          multiple_ideas: false
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const analysisResult = await analysisResponse.json()
    console.log('Analysis result:', analysisResult)

    let parsedAnalysis
    try {
      parsedAnalysis = JSON.parse(analysisResult.choices[0].message.content)
    } catch (e) {
      console.error('Failed to parse analysis result:', e)
      // Fallback to simple response
      parsedAnalysis = {
        multiple_ideas: false,
        ideas: [{
          content: transcriptText,
          category: null,
          sequence: 1
        }]
      }
    }

    // Map category names to IDs
    const ideasWithCategoryIds = parsedAnalysis.ideas.map((idea: any) => {
      const category = categories?.find(c => 
        c.name.toLowerCase() === idea.category?.toLowerCase()
      )
      
      return {
        ...idea,
        category_id: category?.id || null
      }
    })

    return new Response(
      JSON.stringify({ 
        text: transcriptText,
        ideas: ideasWithCategoryIds,
        multiple_ideas: parsedAnalysis.multiple_ideas
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in voice-to-text function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})