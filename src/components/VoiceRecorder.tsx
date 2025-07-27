import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Send, Square } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface VoiceRecorderProps {
  onSendMessage: (message: string) => void;
  isProcessing?: boolean;
}

export function VoiceRecorder({ onSendMessage, isProcessing = false }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [hasRecording, setHasRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const { toast } = useToast();

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      const audioChunks: Blob[] = [];
      mediaRecorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
        setAudioBlob(audioBlob);
        setHasRecording(true);
        stream.getTracks().forEach(track => track.stop());
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
      
      toast({
        title: "Recording stopped",
        description: "Press send to submit your idea!",
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
    if (hasRecording) return 'default';
    return 'voice';
  };

  const getButtonIcon = () => {
    if (isRecording) return <Square className="h-6 w-6" />;
    if (hasRecording) return <Send className="h-6 w-6" />;
    return <Mic className="h-6 w-6" />;
  };

  const handleMainButtonClick = () => {
    if (isRecording) {
      stopRecording();
    } else if (hasRecording) {
      sendRecording();
    } else {
      startRecording();
    }
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      <Button
        onClick={handleMainButtonClick}
        variant={getButtonVariant()}
        size="voice"
        disabled={isProcessing}
        className="relative"
      >
        {getButtonIcon()}
        {isRecording && (
          <div className="absolute inset-0 rounded-full bg-recording/20 animate-ping" />
        )}
      </Button>
      
      <div className="text-center">
        {isRecording && (
          <p className="text-sm text-muted-foreground animate-pulse">
            Recording... Tap to stop
          </p>
        )}
        {hasRecording && (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Ready to send your voice message
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
        {!isRecording && !hasRecording && (
          <p className="text-sm text-muted-foreground">
            Tap to record your idea
          </p>
        )}
      </div>
    </div>
  );
}