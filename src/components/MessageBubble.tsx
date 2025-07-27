import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
}

interface MessageBubbleProps {
  message: Message;
  icon?: ReactNode;
}

export function MessageBubble({ message, icon }: MessageBubbleProps) {
  const isUser = message.sender === 'user';
  
  return (
    <div className={cn(
      "flex",
      isUser ? "justify-end" : "justify-start"
    )}>
      <div className={cn(
        "max-w-[80%] rounded-lg p-3 shadow-soft",
        isUser 
          ? "bg-gradient-primary text-primary-foreground" 
          : "bg-card hover:bg-card-hover text-card-foreground border"
      )}>
        <div className="flex items-start space-x-2">
          {!isUser && icon && (
            <div className="mt-0.5 text-muted-foreground">
              {icon}
            </div>
          )}
          <div className="flex-1">
            <p className="text-sm leading-relaxed">
              {message.content}
            </p>
            <p className={cn(
              "text-xs mt-1 opacity-70",
              isUser ? "text-primary-foreground/70" : "text-muted-foreground"
            )}>
              {message.timestamp.toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </p>
          </div>
          {isUser && icon && (
            <div className="mt-0.5 text-primary-foreground/70">
              {icon}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}