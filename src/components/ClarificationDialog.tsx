import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { AlertCircle, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ClarificationItem {
  id: string;
  question: string;
  ideaContent: string;
  onAnswer: (answer: boolean) => void;
}

interface ClarificationDialogProps {
  items: ClarificationItem[];
  onComplete: () => void;
  className?: string;
}

export function ClarificationDialog({ items, onComplete, className }: ClarificationDialogProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, boolean>>({});

  if (items.length === 0) return null;

  const currentItem = items[currentIndex];
  const isLastItem = currentIndex === items.length - 1;

  const handleAnswer = (answer: boolean) => {
    const newAnswers = { ...answers, [currentItem.id]: answer };
    setAnswers(newAnswers);
    
    // Call the answer handler
    currentItem.onAnswer(answer);

    if (isLastItem) {
      // Complete the dialog
      setTimeout(() => {
        onComplete();
      }, 300);
    } else {
      // Move to next question
      setCurrentIndex(currentIndex + 1);
    }
  };

  return (
    <div className={cn("fixed inset-0 bg-black/50 flex items-center justify-center z-50", className)}>
      <Card className="mx-4 p-6 max-w-lg w-full">
        <div className="flex items-start gap-3 mb-4">
          <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <h3 className="font-medium text-foreground mb-2">
              Quick Question ({currentIndex + 1} of {items.length})
            </h3>
            <p className="text-sm text-muted-foreground mb-3">
              {currentItem.question}
            </p>
            <div className="bg-muted/30 rounded-lg p-3 mb-4">
              <p className="text-sm text-foreground italic">
                "{currentItem.ideaContent}"
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-3 justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleAnswer(false)}
            className="flex items-center gap-2"
          >
            <X className="h-4 w-4" />
            No
          </Button>
          <Button
            size="sm"
            onClick={() => handleAnswer(true)}
            className="flex items-center gap-2"
          >
            <Check className="h-4 w-4" />
            Yes
          </Button>
        </div>

        {items.length > 1 && (
          <div className="mt-4 flex gap-1">
            {items.map((_, index) => (
              <div
                key={index}
                className={cn(
                  "h-1 rounded-full flex-1",
                  index <= currentIndex ? "bg-primary" : "bg-muted"
                )}
              />
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}