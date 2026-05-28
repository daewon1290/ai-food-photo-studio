'use client';

const CATEGORIES = [
  { id: '후라이드 치킨', emoji: '🍗' },
  { id: '양념치킨', emoji: '🍖' },
  { id: '닭강정', emoji: '🍢' },
  { id: '떡볶이', emoji: '🌶️' },
  { id: '돈가스', emoji: '🥩' },
  { id: '카페 음료', emoji: '☕' },
  { id: '디저트', emoji: '🍰' },
];

interface Props {
  selected: string | null;
  onSelect: (category: string) => void;
}

export default function CategorySelect({ selected, onSelect }: Props) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {CATEGORIES.map((cat) => (
        <button
          key={cat.id}
          onClick={() => onSelect(cat.id)}
          className={`
            flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all
            ${
              selected === cat.id
                ? 'border-orange-500 bg-orange-50 text-orange-700 font-semibold'
                : 'border-gray-200 bg-white text-gray-700 hover:border-orange-200 hover:bg-orange-50'
            }
          `}
        >
          <span className="text-2xl">{cat.emoji}</span>
          <span className="text-sm font-medium">{cat.id}</span>
        </button>
      ))}
    </div>
  );
}
