import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { VoiceRecorder } from './VoiceRecorder';
import { MessageBubble } from './MessageBubble';
import { Bot, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useSupabaseAuth } from './SupabaseAuthProvider';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
}

interface ChatInterfaceProps {
  apiKey?: string;
}

export function ChatInterface({ apiKey }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: 'Hi! I\'m your AI assistant for capturing ideas. Record a voice message to get started!',
      sender: 'assistant',
      timestamp: new Date(),
    }
  ]);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();
  const { user } = useSupabaseAuth();

  const handleSendMessage = async (content: string) => {
    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      content,
      sender: 'user',
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    setIsProcessing(true);

    // Save idea to database if user has auto-save enabled
    try {
      if (user) {
        const { error } = await supabase
          .from('ideas')
          .insert({
            user_id: user.id,
            content,
            original_audio_transcription: content
          });

        if (error) {
          console.error('Error saving idea:', error);
        }
      }
    } catch (error) {
      console.error('Error saving idea:', error);
    }

    // Simulate AI response (replace with actual OpenAI API call)
    setTimeout(() => {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: apiKey 
          ? `Got it! I've captured your idea: "${content}". It's been saved for future reference.`
          : 'Please configure your OpenAI API key in the settings to enable AI responses.',
        sender: 'assistant',
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, assistantMessage]);
      setIsProcessing(false);
    }, 1500);
  };

  return (
    <div className="flex flex-col h-full max-w-md mx-auto bg-gradient-subtle">
      {/* Chat Messages */}
      <Card className="flex-1 m-4 mb-2 shadow-soft">
        <ScrollArea className="h-[60vh] p-4">
          <div className="space-y-4">
            {messages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                icon={message.sender === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
              />
            ))}
            {isProcessing && (
              <div className="flex justify-start">
                <div className="bg-secondary rounded-lg p-3 max-w-[80%]">
                  <div className="flex items-center space-x-2">
                    <Bot className="h-4 w-4 text-muted-foreground" />
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce delay-100" />
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce delay-200" />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </Card>

      {/* Voice Recorder */}
      <div className="p-4 pt-2">
        <VoiceRecorder 
          onSendMessage={handleSendMessage}
          isProcessing={isProcessing}
        />
      </div>
    </div>
  );
}