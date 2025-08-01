import "https://deno.land/x/xhr@0.1.0/mod.ts"
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
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
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  console.log(`Voice-to-text function called: ${req.method} ${req.url}`)
  console.log('Request headers:', Object.fromEntries(req.headers.entries()))

  // Only accept POST requests for the actual voice-to-text processing
  if (req.method !== 'POST') {
    console.log(`Rejecting ${req.method} request - only POST supported`)
    return new Response(
      JSON.stringify({ error: 'Only POST method supported' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  try {
    // Validate environment variables
    const requiredEnvVars = ['SUPABASE_URL', 'SUPABASE_ANON_KEY']
    for (const envVar of requiredEnvVars) {
      if (!Deno.env.get(envVar)) {
        console.error(`Missing environment variable: ${envVar}`)
        return new Response(
          JSON.stringify({ error: `Server configuration error: Missing ${envVar}` }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    // Validate request body exists and content type for POST requests
    const contentType = req.headers.get('content-type') || ''
    console.log('Content-Type:', contentType)
    
    if (!contentType.includes('application/json')) {
      console.error('Invalid content type for POST request:', contentType)
      return new Response(
        JSON.stringify({ error: 'Content-Type must be application/json for API requests' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if request has a body
    const contentLength = req.headers.get('content-length')
    console.log('Content-Length:', contentLength)
    
    if (contentLength === '0' || contentLength === null) {
      console.error('Empty request body')
      return new Response(
        JSON.stringify({ error: 'Request body is empty' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Try to parse JSON with proper error handling
    let requestData
    try {
      const bodyText = await req.text()
      console.log('Request body length:', bodyText.length)
      console.log('Request body preview:', bodyText.substring(0, 100) + '...')
      
      if (!bodyText.trim()) {
        throw new Error('Request body is empty')
      }
      
      requestData = JSON.parse(bodyText)
    } catch (jsonError) {
      console.error('JSON parsing error:', jsonError)
      console.error('Request body was not valid JSON')
      return new Response(
        JSON.stringify({ error: 'Invalid JSON in request body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { audio } = requestData
    
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

    // Send to OpenAI for transcription (quick response)
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
    
    // Return immediate response with transcription and start background analysis
    console.log('Starting optimized analysis process...')
    
    try {
      // Quick embedding generation for immediate similarity search
      console.log('Generating embedding for quick similarity check...')
      const embeddingResponse = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${profile.api_key}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'text-embedding-ada-002',
          input: transcriptText,
        }),
      })

      let queryEmbedding = null
      let similarIdeas = []
      
      if (embeddingResponse.ok) {
        const embeddingResult = await embeddingResponse.json()
        queryEmbedding = embeddingResult.data[0].embedding

        // Quick similarity search
        console.log('Quick similarity search...')
        const { data: foundSimilarIdeas, error: similarError } = await supabase
          .rpc('find_similar_ideas', {
            query_embedding: queryEmbedding,
            similarity_threshold: 0.75,
            match_count: 3
          })

        if (!similarError && foundSimilarIdeas) {
          similarIdeas = foundSimilarIdeas
        }
      }
      
      // Fast analysis with optimized prompt for speed
      console.log('Running fast analysis...')
      const categoryNames = categories ? categories.map(c => c.name).join(', ') : 'Business, Technology, Creative, Personal, Learning, Health & Fitness, Travel, Finance, Relationships, Other'
      
      const quickAnalysisPrompt = `Quickly analyze this voice transcription for ideas:

Text: "${transcriptText}"

Categories: ${categoryNames}

Return JSON with this structure (respond quickly, prioritize speed over perfection):
{
  "multiple_ideas": boolean,
  "ideas": [
    {
      "content": "extracted idea text",
      "idea_type": "main|sub-component|follow-up", 
      "category": "best_fit_category",
      "sequence": 1,
      "tags": ["key-tag1", "key-tag2"],
      "ai_auto_tags": ["auto-tag1", "auto-tag2"],
      "confidence_level": 0.8,
      "needs_clarification": false,
      "embedding": ${queryEmbedding ? JSON.stringify(queryEmbedding) : 'null'}
    }
  ],
  "similar_ideas": ${JSON.stringify(similarIdeas)}
}

Guidelines:
- Extract 1-3 main ideas maximum 
- Use simple categorization
- Keep confidence levels realistic (0.7-1.0)
- Focus on speed over detailed analysis`

      const analysisResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${profile.api_key}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini', // Use faster model
          messages: [
            { role: 'system', content: 'You are a fast idea analyzer. Respond with valid JSON quickly.' },
            { role: 'user', content: quickAnalysisPrompt }
          ],
          temperature: 0.1,
          max_tokens: 1000, // Limit tokens for speed
          response_format: { type: "json_object" }
        }),
      })

      if (analysisResponse.ok) {
        const analysisResult = await analysisResponse.json()
        console.log('Fast analysis completed:', analysisResult)
        
        // Parse the JSON content from the GPT response
        const analysisData = JSON.parse(analysisResult.choices[0].message.content)
        
        // Return optimized analysis results
        return new Response(
          JSON.stringify({ 
            text: transcriptText,
            ideas: analysisData.ideas || [],
            multiple_ideas: analysisData.multiple_ideas || false,
            similar_ideas: analysisData.similar_ideas || similarIdeas
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      } else {
        console.error('Fast analysis API error:', await analysisResponse.text())
      }
      
    } catch (error) {
      console.error('Fast analysis error:', error)
    }

    // Fallback response if analysis fails
    const fallbackIdea = {
      content: transcriptText,
      idea_type: 'main',
      category: null,
      sequence: 1,
      tags: [],
      ai_auto_tags: [],
      confidence_level: 1.0,
      needs_clarification: false,
      embedding: null
    }

    return new Response(
      JSON.stringify({ 
        text: transcriptText,
        ideas: [fallbackIdea],
        multiple_ideas: false,
        similar_ideas: []
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