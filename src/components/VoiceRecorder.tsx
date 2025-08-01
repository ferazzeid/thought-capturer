import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Send, Square, Brain } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { audioFeedback } from '@/utils/audioFeedback';
import { ClarificationDialog } from './ClarificationDialog';

interface VoiceRecorderProps {
  onSendMessage: (message: string, voiceAnalysis?: any) => void;
  isProcessing?: boolean;
}

export function VoiceRecorder({ onSendMessage, isProcessing = false }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [hasRecording, setHasRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStatus, setAnalysisStatus] = useState<string>('');
  const [clarificationItems, setClarificationItems] = useState<any[]>([]);
  const [pendingIdeas, setPendingIdeas] = useState<any[]>([]);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const { toast } = useToast();

  const handleAnalysisResult = async (data: any) => {
    const ideas = data.ideas || [];
    
    // Check for clarifications needed
    const needsClarification = ideas.filter((idea: any) => idea.needs_clarification);
    
    if (needsClarification.length > 0) {
      // Play clarification sound
      await audioFeedback.playClarificationNeeded();
      
      // Set up clarification items
      const clarificationItems = needsClarification.map((idea: any) => ({
        id: idea.sequence?.toString() || Math.random().toString(),
        question: idea.clarification_question || "Should this be linked to an existing idea?",
        ideaContent: idea.content,
        onAnswer: (answer: boolean) => {
          // Handle linking logic here - would need to update the backend
          console.log(`Clarification answer for "${idea.content}": ${answer}`);
        }
      }));
      
      setClarificationItems(clarificationItems);
      setPendingIdeas(ideas);
    } else {
      // No clarifications needed, play success sounds immediately
      await audioFeedback.playMultipleIdeasSequence(ideas);
      
      const ideaCount = ideas.length || 1;
      const isMultiple = data.multiple_ideas && ideaCount > 1;
      
      setIsAnalyzing(false);
      setAnalysisStatus('');
      
      // Show detailed breakdown of analysis results
      let description = '';
      if (isMultiple) {
        const mainIdeas = ideas.filter((idea: any) => idea.idea_type === 'main').length;
        const subComponents = ideas.filter((idea: any) => idea.idea_type === 'sub-component').length;
        const followUps = ideas.filter((idea: any) => idea.idea_type === 'follow-up').length;
        
        const parts = [];
        if (mainIdeas > 0) parts.push(`${mainIdeas} main idea${mainIdeas > 1 ? 's' : ''}`);
        if (subComponents > 0) parts.push(`${subComponents} sub-component${subComponents > 1 ? 's' : ''}`);
        if (followUps > 0) parts.push(`${followUps} follow-up${followUps > 1 ? 's' : ''}`);
        
        description = `Found ${parts.join(', ')} in your recording!`;
      } else {
        const idea = ideas[0];
        if (idea?.category) {
          description = `Categorized as ${idea.category}`;
          if (idea.confidence_level < 0.8) {
            description += ` (${Math.round(idea.confidence_level * 100)}% confidence)`;
          }
        } else {
          description = "Your voice idea has been processed!";
        }
      }
      
      toast({
        title: "Ideas analyzed successfully!",
        description,
      });
    }
  };

  const handleClarificationComplete = async () => {
    setClarificationItems([]);
    
    // Play success sounds for all pending ideas
    if (pendingIdeas.length > 0) {
      await audioFeedback.playMultipleIdeasSequence(pendingIdeas);
      
      toast({
        title: "Ideas saved successfully!",
        description: `All ${pendingIdeas.length} ideas have been processed!`,
      });
      
      setPendingIdeas([]);
    }
  };

  const startRecording = async () => {
    console.log('VoiceRecorder: Starting recording...');
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        } 
      });
      
      console.log('VoiceRecorder: Got media stream');
      
      // Create MediaRecorder with better codec support
      const options = { mimeType: 'audio/webm;codecs=opus' };
      let mediaRecorder;
      
      if (MediaRecorder.isTypeSupported(options.mimeType)) {
        mediaRecorder = new MediaRecorder(stream, options);
        console.log('VoiceRecorder: Using opus codec');
      } else {
        console.warn('VoiceRecorder: Opus codec not supported, using default');
        mediaRecorder = new MediaRecorder(stream);
      }
      
      mediaRecorderRef.current = mediaRecorder;
      const audioChunks: BlobPart[] = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.push(event.data);
          console.log('VoiceRecorder: Audio chunk received, size:', event.data.size);
        }
      };

      mediaRecorder.onstop = async () => {
        console.log('VoiceRecorder: Recording stopped, processing audio...');
        
        try {
          const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
          console.log('VoiceRecorder: Audio blob created, size:', audioBlob.size);
          
          if (audioBlob.size === 0) {
            throw new Error('Audio recording is empty');
          }

          setAudioBlob(audioBlob);
          setIsAnalyzing(true);
          setAnalysisStatus('Converting audio to text...');
          
          // Convert to base64
          const reader = new FileReader();
          reader.onloadend = async () => {
            try {
              const base64Data = (reader.result as string).split(',')[1];
              
              if (!base64Data || base64Data.length === 0) {
                throw new Error('Failed to convert audio to base64');
              }
            
              console.log('VoiceRecorder: Audio converted to base64, length:', base64Data.length);

              // Validate base64
              if (base64Data.length < 100) {
                throw new Error('Audio data too small, recording may have failed');
              }

              // Always use direct Supabase Edge Function URL
              const endpoint = 'https://wdjvsuiyayjuzivvdxvh.supabase.co/functions/v1/voice-to-text';
              
              console.log('VoiceRecorder: Using direct Supabase endpoint:', endpoint);
              
              const session = await supabase.auth.getSession();
              if (!session.data.session) {
                throw new Error('Not authenticated. Please sign in.');
              }
              
              console.log('VoiceRecorder: Session check passed, user:', session.data.session.user.email);
              
              const headers = {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session.data.session.access_token}`,
                'x-client-info': 'supabase-js-web/2.53.0',
                'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndkanZzdWl5YXlqdXppdnZkeHZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM5NjI0MDQsImV4cCI6MjA2OTUzODQwNH0.jnDsIcdlw0boiGr12YpL0bWSu98tMJbwFot8SIjmwpY'
              };
              
              console.log('VoiceRecorder: Making API call to:', endpoint);
              console.log('VoiceRecorder: Request headers:', Object.keys(headers));
              console.log('VoiceRecorder: Audio data size:', base64Data.length, 'chars');
              console.log('VoiceRecorder: Request body preview:', JSON.stringify({ audio: base64Data.substring(0, 50) + '...' }));
              
              const controller = new AbortController();
              const timeoutId = setTimeout(() => {
                console.log('VoiceRecorder: Request timeout triggered');
                controller.abort();
              }, 45000); // Increased to 45 seconds for optimized processing
              
              try {
              setAnalysisStatus('Transcribing audio with AI...');
              console.log('VoiceRecorder: Sending fetch request...');
                const response = await fetch(endpoint, {
                  method: 'POST',
                  headers,
                  body: JSON.stringify({ audio: base64Data }),
                  signal: controller.signal
                });

                clearTimeout(timeoutId);
                console.log('VoiceRecorder: Response received');
                console.log('VoiceRecorder: Response status:', response.status);
                console.log('VoiceRecorder: Response ok:', response.ok);
                console.log('VoiceRecorder: Response headers:', Object.fromEntries(response.headers.entries()));
                
                if (!response.ok) {
                  const errorText = await response.text();
                  console.error('VoiceRecorder: Error response body:', errorText);
                  throw new Error(`API request failed: ${response.status} - ${errorText}`);
                }
                
                const data = await response.json();
                console.log('VoiceRecorder: Response data:', data);
                
                if (!data) {
                  throw new Error('Empty response from voice-to-text API');
                }
                
                setAnalysisStatus('Analyzing ideas and finding patterns...');
                
                // Update status to reflect actual backend processing
                setTimeout(() => setAnalysisStatus('Checking for similar ideas...'), 1000);
                setTimeout(() => setAnalysisStatus('Categorizing and tagging...'), 2000);
                setTimeout(() => setAnalysisStatus('Finalizing analysis...'), 3000);
                
                console.log('VoiceRecorder: Processing successful response...');
                await handleAnalysisResult(data);
                onSendMessage(data.text || "Voice message processed", data);
                
              } catch (fetchError) {
                clearTimeout(timeoutId);
                console.error('VoiceRecorder: Fetch error:', fetchError);
                
                if (fetchError instanceof Error && fetchError.name === 'AbortError') {
                  throw new Error('Request timed out after 45 seconds');
                }
                throw fetchError;
              }
              
            } catch (error) {
              console.error('VoiceRecorder: Error during API call:', error);
              setIsAnalyzing(false);
              setAnalysisStatus('');
              setHasRecording(false);
              setAudioBlob(null);
              
              let errorMessage = 'Voice processing failed';
              if (error instanceof Error) {
                if (error.message.includes('timeout') || error.message.includes('timed out')) {
                  errorMessage = 'Voice processing timed out. Please try again.';
                } else if (error.message.includes('Failed to fetch') || error.message.includes('Network')) {
                  errorMessage = 'Network error. Please check your connection.';
                } else if (error.message.includes('Not authenticated')) {
                  errorMessage = 'Authentication error. Please sign in again.';
                } else {
                  errorMessage = error.message;
                }
              }
              
              toast({
                title: "Voice Recording Error",
                description: errorMessage,
                variant: "destructive",
              });
              
              onSendMessage("Sorry, I couldn't process your voice message. Please try again.");
            }
          };
          
          console.log('VoiceRecorder: Starting base64 conversion...');
          reader.readAsDataURL(audioBlob);
          
        } catch (error) {
          console.error('VoiceRecorder: Error processing audio blob:', error);
          setIsAnalyzing(false);
          setAnalysisStatus('');
          setHasRecording(false);
          setAudioBlob(null);
          
          toast({
            title: "Recording Error",
            description: error instanceof Error ? error.message : "Failed to process audio recording",
            variant: "destructive",
          });
        }
        
        // Clean up the stream
        console.log('VoiceRecorder: Cleaning up media stream...');
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      console.log('VoiceRecorder: Recording started successfully');
      
      toast({
        title: "Recording started",
        description: "Speak your idea...",
      });
      
    } catch (error) {
      console.error('VoiceRecorder: Failed to start recording:', error);
      
      let errorMessage = "Could not access microphone";
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          errorMessage = "Microphone access denied. Please allow microphone permissions.";
        } else if (error.name === 'NotFoundError') {
          errorMessage = "No microphone found. Please connect a microphone.";
        } else {
          errorMessage = error.message;
        }
      }
      
      toast({
        title: "Recording Failed",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setHasRecording(true);
      
      toast({
        title: "Recording stopped",
        description: "Ready to analyze your voice message...",
      });
    }
  };

  const sendRecording = () => {
    if (audioBlob) {
      // For now, we'll simulate converting to text
      // In the real implementation, this would use OpenAI's Whisper API
      const simulatedText = "Voice message recorded - OpenAI API integration needed";
      onSendMessage(simulatedText);
      
      setHasRecording(false);
      setAudioBlob(null);
      
      toast({
        title: "Message sent",
        description: "Your voice idea has been processed!",
      });
    }
  };

  const cancelRecording = () => {
    setHasRecording(false);
    setAudioBlob(null);
    
    toast({
      title: "Recording cancelled",
      description: "Ready to record a new message.",
    });
  };

  const getButtonVariant = () => {
    if (isRecording) return 'recording';
    if (isAnalyzing) return 'analyzing';
    if (hasRecording) return 'default';
    return 'voice';
  };

  const getButtonIcon = () => {
    if (isRecording) return <Square className="h-6 w-6" />;
    if (isAnalyzing) return <Brain className="h-6 w-6" />;
    if (hasRecording) return <Send className="h-6 w-6" />;
    return <Mic className="h-6 w-6" />;
  };

  const handleMainButtonClick = () => {
    if (isAnalyzing) return; // Don't allow clicks during analysis
    
    if (isRecording) {
      stopRecording();
    } else if (hasRecording) {
      sendRecording();
    } else {
      startRecording();
    }
  };

  return (
    <>
      <div className="flex flex-col items-center space-y-4">
        <Button
          onClick={handleMainButtonClick}
          variant={getButtonVariant()}
          size="voice"
          disabled={isProcessing || isAnalyzing}
          className="relative"
        >
          {getButtonIcon()}
          {isRecording && (
            <div className="absolute inset-0 rounded-full bg-recording/20 animate-ping" />
          )}
          {isAnalyzing && (
            <div className="absolute inset-0 rounded-full bg-primary/20 animate-pulse" />
          )}
        </Button>
        
        <div className="text-center">
          {isRecording && (
            <p className="text-sm text-muted-foreground animate-pulse">
              Recording... Tap to stop
            </p>
          )}
          {isAnalyzing && (
            <div className="flex flex-col items-center space-y-2">
              <div className="flex items-center justify-center space-x-2">
                <Brain className="h-4 w-4 text-primary animate-pulse" />
                <p className="text-sm text-muted-foreground animate-pulse">
                  Analyzing your ideas...
                </p>
              </div>
              {analysisStatus && (
                <p className="text-xs text-muted-foreground/70 animate-pulse">
                  {analysisStatus}
                </p>
              )}
            </div>
          )}
          {hasRecording && !isAnalyzing && (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Ready to analyze your voice message
              </p>
              <Button
                onClick={cancelRecording}
                variant="ghost"
                size="sm"
                className="text-xs"
              >
                Cancel & Record Again
              </Button>
            </div>
          )}
          {!isRecording && !hasRecording && !isAnalyzing && (
            <p className="text-sm text-muted-foreground">
              Tap to record your idea
            </p>
          )}
        </div>
      </div>

      {/* Clarification Dialog */}
      {clarificationItems.length > 0 && (
        <ClarificationDialog
          items={clarificationItems}
          onComplete={handleClarificationComplete}
        />
      )}
    </>
  );
}