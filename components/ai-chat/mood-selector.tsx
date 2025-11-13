"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getAllMoods, type AIMood } from "@/lib/ai-moods";

interface MoodSelectorProps {
  currentMood: AIMood;
  onMoodChange: (mood: AIMood) => void;
}

export function MoodSelector({ currentMood, onMoodChange }: MoodSelectorProps) {
  const moods = getAllMoods();

  return (
    <div className="space-y-2">
      <label className="text-xs font-medium text-muted-foreground">AI Personality Mode:</label>
      <Select value={currentMood} onValueChange={(value) => onMoodChange(value as AIMood)}>
        <SelectTrigger className="w-full">
          <SelectValue>
            {moods.find(m => m.id === currentMood)?.icon} {moods.find(m => m.id === currentMood)?.name}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {moods.map((mood) => (
            <SelectItem key={mood.id} value={mood.id}>
              <div className="flex items-center gap-2">
                <span>{mood.icon}</span>
                <div>
                  <div className="font-medium">{mood.name}</div>
                  <div className="text-xs text-muted-foreground">{mood.description}</div>
                </div>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
