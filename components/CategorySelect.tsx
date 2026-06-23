'use client';

const FOOD_GROUPS = [
  {
    id: '치킨·버거·피자류',
    emoji: '🍗',
    label: '치킨·버거·피자',
    desc: '바삭한 튀김류 & 패스트푸드',
    examples: '후라이드·양념치킨, 버거, 피자, 돈가스',
  },
  {
    id: '떡볶이·분식류',
    emoji: '🌶️',
    label: '떡볶이·분식',
    desc: '분식·길거리 음식',
    examples: '떡볶이, 김밥, 순대, 튀김, 어묵',
  },
  {
    id: '한식·국밥·찌개',
    emoji: '🍲',
    label: '한식·국밥·찌개',
    desc: '집밥·백반·찌개·국밥',
    examples: '된장찌개, 순대국, 비빔밥, 갈비탕',
  },
  {
    id: '고기·구이',
    emoji: '🥩',
    label: '고기·구이',
    desc: '구이·바베큐·고기 요리',
    examples: '삼겹살, 갈비, 불고기, 스테이크',
  },
  {
    id: '면류·파스타',
    emoji: '🍜',
    label: '면류·파스타',
    desc: '국수·라면·파스타',
    examples: '라면, 짜장면, 짬뽕, 파스타, 우동',
  },
  {
    id: '일식·중식·아시안',
    emoji: '🍱',
    label: '일식·중식·아시안',
    desc: '스시·중화요리·동남아',
    examples: '초밥, 짜장면, 쌀국수, 타코야키',
  },
  {
    id: '카페 음료',
    emoji: '☕',
    label: '카페·음료',
    desc: '커피·버블티·주스',
    examples: '아메리카노, 버블티, 주스, 스무디',
  },
  {
    id: '디저트·베이커리',
    emoji: '🍰',
    label: '디저트·베이커리',
    desc: '케이크·빵·마카롱·아이스크림',
    examples: '케이크, 마카롱, 도넛, 아이스크림',
  },
];

const UNKNOWN = {
  id: '잘 모르겠어요',
  emoji: '❓',
  label: '잘 모르겠어요',
  desc: '애매하거나 해당 없음',
  examples: '',
};

interface Props {
  selected: string | null;
  onSelect: (category: string) => void;
}

export default function CategorySelect({ selected, onSelect }: Props) {
  return (
    <div className="space-y-2">
      {/* 8개 음식 그룹: 2열 그리드 */}
      <div className="grid grid-cols-2 gap-2">
        {FOOD_GROUPS.map((cat) => {
          const isSelected = selected === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => onSelect(cat.id)}
              className={`flex flex-col gap-0.5 px-3 py-2.5 rounded-xl border text-left transition-all ${
                isSelected
                  ? 'border-orange-500 bg-orange-50 ring-2 ring-orange-200'
                  : 'border-gray-200 bg-white hover:border-orange-300 hover:bg-orange-50/50'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <span className="text-xl leading-none">{cat.emoji}</span>
                <span className={`text-sm font-semibold leading-tight ${isSelected ? 'text-orange-700' : 'text-gray-800'}`}>
                  {cat.label}
                </span>
              </div>
              <p className="text-xs text-gray-400 leading-snug pl-0.5">{cat.desc}</p>
              <p className="text-[11px] text-gray-300 leading-snug pl-0.5 truncate">{cat.examples}</p>
            </button>
          );
        })}
      </div>

      {/* 잘 모르겠어요: 전체 너비 */}
      {(() => {
        const isSelected = selected === UNKNOWN.id;
        return (
          <button
            onClick={() => onSelect(UNKNOWN.id)}
            className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-xl border text-left transition-all ${
              isSelected
                ? 'border-orange-500 bg-orange-50 ring-2 ring-orange-200'
                : 'border-gray-200 bg-white hover:border-orange-300 hover:bg-orange-50/50'
            }`}
          >
            <span className="text-xl leading-none">{UNKNOWN.emoji}</span>
            <div>
              <span className={`text-sm font-semibold ${isSelected ? 'text-orange-700' : 'text-gray-600'}`}>
                {UNKNOWN.label}
              </span>
              <span className="text-xs text-gray-400 ml-2">{UNKNOWN.desc}</span>
            </div>
          </button>
        );
      })()}
    </div>
  );
}
