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
      
      toast({
        title: "Ideas saved successfully!",
        description: isMultiple 
          ? `Found ${ideaCount} ideas in your recording!`
          : "Your voice idea has been processed!",
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
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Use WebM format consistently for better compatibility
      const options = { mimeType: 'audio/webm' };
      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;

      const audioChunks: Blob[] = [];
      mediaRecorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        setAudioBlob(audioBlob);
        stream.getTracks().forEach(track => track.stop());
        
        try {
          setIsAnalyzing(true);
          
          // Convert audio blob to base64
          const reader = new FileReader();
          reader.onloadend = async () => {
            const base64Audio = reader.result as string;
            const base64Data = base64Audio.split(',')[1]; // Remove data:audio/webm;base64, prefix
            
            console.log('Sending audio to voice-to-text function...');
            console.log('Audio data length:', base64Data?.length || 0);
            
            // Validate audio data before sending
            if (!base64Data || base64Data.length < 100) {
              throw new Error('Audio data is too small or invalid');
            }

            try {
              // Send to Supabase edge function with timeout
              const { data, error } = await Promise.race([
                supabase.functions.invoke('voice-to-text', {
                  body: { audio: base64Data },
                  headers: {
                    'Content-Type': 'application/json'
                  }
                }),
                new Promise((_, reject) => 
                  setTimeout(() => reject(new Error('Request timeout')), 30000)
                )
              ]) as any;
              
              if (error) {
                console.error('Voice-to-text error:', error);
                const errorMessage = error.message || 'Unknown error occurred';
                console.error('Detailed error:', errorMessage);
                
                toast({
                  title: "Voice processing failed",
                  description: `Error: ${errorMessage}. Please try again.`,
                  variant: "destructive"
                });
                
                onSendMessage("Sorry, I couldn't process your voice message. Please try again.");
              } else if (!data) {
                console.error('No data received from voice-to-text function');
                toast({
                  title: "No response",
                  description: "No response received from voice processing service.",
                  variant: "destructive"
                });
                onSendMessage("Sorry, no response received. Please try again.");
              } else {
                console.log('Transcription received:', data);
                await handleAnalysisResult(data);
                onSendMessage(data.text || "Voice message processed", data);
              }
            } finally {
              setIsAnalyzing(false);
              setHasRecording(false);
              setAudioBlob(null);
            }
          };
          reader.readAsDataURL(audioBlob);
        } catch (error) {
          console.error('Error processing audio:', error);
          setIsAnalyzing(false);
          onSendMessage("Sorry, I couldn't process your voice message. Please try again.");
          toast({
            title: "Error",
            description: "Failed to process voice message.",
            variant: "destructive"
          });
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      
      toast({
        title: "Recording started",
        description: "Speak your idea...",
      });
    } catch (error) {
      toast({
        title: "Microphone access denied",
        description: "Please allow microphone access to record voice messages.",
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
            <div className="flex items-center justify-center space-x-2">
              <Brain className="h-4 w-4 text-primary animate-pulse" />
              <p className="text-sm text-muted-foreground animate-pulse">
                Analyzing your ideas...
              </p>
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