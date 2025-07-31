import { useState, useEffect } from 'react';
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
  // Load conversation from localStorage on component mount
  const [messages, setMessages] = useState<Message[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('chat-messages');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          return parsed.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          }));
        } catch (e) {
          console.error('Failed to parse saved messages:', e);
        }
      }
    }
    return [
      {
        id: '1',
        content: 'Hi! I\'m your AI assistant for capturing ideas. Record a voice message to get started!',
        sender: 'assistant',
        timestamp: new Date(),
      }
    ];
  });
  
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();
  const { user } = useSupabaseAuth();

  // Persist messages to localStorage whenever they change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('chat-messages', JSON.stringify(messages));
    }
  }, [messages]);

  const handleSendMessage = async (content: string, voiceAnalysis?: any) => {
    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      content,
      sender: 'user',
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    setIsProcessing(true);

    // Save idea(s) to database if user is logged in
    try {
      if (user && voiceAnalysis?.ideas) {
        const parentRecordingId = crypto.randomUUID(); // Generate proper UUID for this recording session
        
        // Save multiple ideas if they exist
        const ideasToSave = voiceAnalysis.ideas.map((idea: any, index: number) => ({
          user_id: user.id,
          content: idea.content,
          original_audio_transcription: content,
          category_id: idea.category_id,
          parent_recording_id: parentRecordingId,
          idea_sequence: idea.sequence || index + 1,
          tags: idea.tags || []
        }));

        const { error } = await supabase
          .from('ideas')
          .insert(ideasToSave);

        if (error) {
          console.error('Error saving ideas:', error);
          toast({
            title: "Error",
            description: "Failed to save your ideas. Please try again.",
            variant: "destructive"
          });
        }
      } else if (user) {
        // Fallback: save single idea if no voice analysis
        const { error } = await supabase
          .from('ideas')
          .insert({
            user_id: user.id,
            content,
            original_audio_transcription: content,
            tags: []
          });

        if (error) {
          console.error('Error saving idea:', error);
        }
      }
    } catch (error) {
      console.error('Error saving ideas:', error);
    }

    // Generate AI response based on analysis
    setTimeout(() => {
      let responseContent = '';
      
      if (voiceAnalysis?.multiple_ideas && voiceAnalysis?.ideas?.length > 1) {
        const ideaCount = voiceAnalysis.ideas.length;
        responseContent = `Great! I found ${ideaCount} distinct ideas in your recording:\n\n`;
        voiceAnalysis.ideas.forEach((idea: any, index: number) => {
          responseContent += `${index + 1}. ${idea.content}\n`;
        });
        responseContent += `\nAll ideas have been saved and categorized for you!`;
      } else if (apiKey) {
        responseContent = `Got it! I've captured your idea: "${content}". It's been saved for future reference.`;
      } else {
        responseContent = 'Please configure your OpenAI API key in the settings to enable AI responses.';
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: responseContent,
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