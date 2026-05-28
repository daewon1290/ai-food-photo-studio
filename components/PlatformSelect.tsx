'use client';

import { platformPresets, PlatformPreset, formatLabel } from '@/lib/platformPresets';

const PLATFORM_ICONS: Record<string, string> = {
  Instagram: '📸',
  Baemin: '🛵',
  CoupangEats: '🚀',
  Yogiyo: '🍜',
  Daangn: '🥕',
  NaverPlace: '📍',
  Blog: '📝',
};

interface Props {
  selected: PlatformPreset | null;
  onSelect: (platform: PlatformPreset) => void;
}

const groups = ['인스타그램', '배달앱', '기타'];

export default function PlatformSelect({ selected, onSelect }: Props) {
  return (
    <div className="space-y-4">
      {groups.map((group) => {
        const items = platformPresets.filter((p) => p.platformGroupKo === group);
        return (
          <div key={group}>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
              {group}
            </p>
            <div className="space-y-2">
              {items.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => onSelect(preset)}
                  className={`
                    w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all
                    ${
                      selected?.id === preset.id
                        ? 'border-orange-500 bg-orange-50'
                        : 'border-gray-200 bg-white hover:border-orange-200 hover:bg-orange-50'
                    }
                  `}
                >
                  <span className="text-xl">{PLATFORM_ICONS[preset.platform] ?? '📁'}</span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${selected?.id === preset.id ? 'text-orange-700' : 'text-gray-800'}`}>
                      {preset.nameKo}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">{preset.descriptionKo}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-mono text-gray-500">
                      {preset.width}×{preset.height}
                    </p>
                    <p className="text-xs text-gray-400">{formatLabel(preset.format)}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
