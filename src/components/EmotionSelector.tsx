import { EMOTIONS } from '../constants/emotions.ts';
import { EmotionId } from '../types/index.ts';

interface EmotionSelectorProps {
  value: EmotionId;
  onChange: (emotion: EmotionId) => void;
  allowClear?: boolean;
}

export function EmotionSelector({
  value,
  onChange,
  allowClear = true,
}: EmotionSelectorProps) {
  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label="Select an emotion">
      {EMOTIONS.map((emotion) => {
        const selected = value === emotion.id;
        return (
          <button
            key={emotion.id}
            type="button"
            onClick={() =>
              onChange(selected && allowClear ? '' : emotion.id)
            }
            aria-pressed={selected}
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              selected
                ? 'border-[#29272B] text-[#29272B]'
                : 'border-[#EAE4DD] bg-[#FCFBFA] text-[#6B6770] hover:text-[#29272B] hover:border-[#D5CCC3]'
            }`}
            style={selected ? { backgroundColor: emotion.tintBg } : undefined}
          >
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: emotion.dotColor }}
              aria-hidden="true"
            />
            <span>{emotion.label}</span>
          </button>
        );
      })}
    </div>
  );
}
