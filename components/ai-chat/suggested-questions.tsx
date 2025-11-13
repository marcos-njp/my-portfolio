"use client";

interface SuggestedQuestionsProps {
  suggestions: string[];
  onSelect: (suggestion: string) => void;
  disabled?: boolean;
}

export function SuggestedQuestions({ suggestions, onSelect, disabled = false }: SuggestedQuestionsProps) {
  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground">💡 Try asking:</p>
      <div className="flex flex-wrap gap-2">
        {suggestions.map((suggestion, idx) => (
          <button
            key={idx}
            onClick={() => !disabled && onSelect(suggestion)}
            disabled={disabled}
            className={`text-xs px-2 py-1 rounded-md transition-colors ${
              disabled 
                ? 'bg-muted text-muted-foreground cursor-not-allowed' 
                : 'bg-primary/10 hover:bg-primary/20 text-primary cursor-pointer'
            }`}
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  );
}
