import { Moon, Sun, Monitor, Check } from 'lucide-react';
import { Card, CardHeader, PageHeader, Divider } from '../components/Primitives';
import SegmentedControl from '../components/SegmentedControl';
import { wallpapers } from '../mockSettingsData';

const THEMES = [
  { id: 'dark', label: 'Dark', icon: Moon, preview: 'bg-[#0B0D13]' },
  { id: 'light', label: 'Light', icon: Sun, preview: 'bg-[#F3F4F7]' },
  { id: 'system', label: 'System', icon: Monitor, preview: 'bg-gradient-to-br from-[#0B0D13] to-[#F3F4F7]' },
];

const DENSITY_OPTIONS = [
  { value: 'compact', label: 'Compact' },
  { value: 'comfortable', label: 'Comfortable' },
  { value: 'cozy', label: 'Cozy' },
];

export default function AppearanceSection({ theme, onThemeChange, wallpaper, onWallpaperChange, density, onDensityChange }) {
  return (
    <div>
      <PageHeader title="Appearance" description="Customize how LinkChat looks for you." />

      <div className="space-y-5">
        <Card>
          <CardHeader title="Theme" description="Choose how LinkChat appears across your devices." />
          <div className="px-5 sm:px-6 pb-5 pt-3 grid grid-cols-3 gap-3">
            {THEMES.map(({ id, label, icon: Icon, preview }) => {
              const active = theme === id;
              return (
                <button
                  key={id}
                  onClick={() => onThemeChange(id)}
                  className={`relative flex flex-col items-center gap-2 p-3 rounded-2xl border transition-all ${
                    active ? 'border-accent-cyan/60 bg-accent-cyan/5' : 'border-base-700 hover:border-base-600'
                  }`}
                >
                  {active && (
                    <span className="absolute top-2 right-2 w-4 h-4 rounded-full bg-accent-gradient grid place-items-center">
                      <Check size={10} strokeWidth={3} className="text-base-950" />
                    </span>
                  )}
                  <div className={`w-full h-14 rounded-xl border border-base-600/60 ${preview}`} />
                  <div className="flex items-center gap-1.5">
                    <Icon size={13} className="text-base-300" />
                    <span className="text-xs font-medium text-base-200">{label}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </Card>

        <Card>
          <CardHeader title="Chat wallpaper" description="Pick a background for your conversations." />
          <div className="px-5 sm:px-6 pb-5 pt-3 grid grid-cols-3 sm:grid-cols-6 gap-3">
            {wallpapers.map((w) => {
              const active = wallpaper === w.id;
              return (
                <button key={w.id} onClick={() => onWallpaperChange(w.id)} className="flex flex-col items-center gap-1.5">
                  <div
                    style={{ background: w.swatch }}
                    className={`w-full aspect-square rounded-xl border-2 transition-all ${
                      active ? 'border-accent-cyan shadow-glow-accent' : 'border-base-700 hover:border-base-600'
                    }`}
                  />
                  <span className={`text-[11px] ${active ? 'text-accent-cyan font-medium' : 'text-base-400'}`}>{w.label}</span>
                </button>
              );
            })}
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between px-5 sm:px-6 py-4 flex-wrap gap-3">
            <div>
              <p className="text-sm font-medium text-base-100">Message density</p>
              <p className="mt-0.5 text-xs text-base-400">Adjust the spacing between messages in a chat.</p>
            </div>
            <SegmentedControl options={DENSITY_OPTIONS} value={density} onChange={onDensityChange} />
          </div>
        </Card>
      </div>
    </div>
  );
}
