import { useEffect, useRef, useState } from 'react';
import { Moon, Sun, Monitor, Check, ImagePlus, Trash2 } from 'lucide-react';
import { Card, CardHeader, PageHeader, Divider } from '../components/Primitives';
import SegmentedControl from '../components/SegmentedControl';
import { wallpapers } from '../mockSettingsData';
import {
  deleteCustomWallpaper,
  getCustomWallpapers,
  saveCustomWallpaper,
} from '../../utils/customWallpapers';

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
  const [customWallpapers, setCustomWallpapers] = useState([]);
  const [customPreviews, setCustomPreviews] = useState({});
  const [wallpaperError, setWallpaperError] = useState('');
  const [savingWallpaper, setSavingWallpaper] = useState(false);
  const imageInputRef = useRef(null);

  useEffect(() => {
    let active = true;
    let previewUrls = [];

    getCustomWallpapers()
      .then((savedWallpapers) => {
        if (!active) return;

        const previews = {};
        savedWallpapers.forEach((savedWallpaper) => {
          const url = URL.createObjectURL(savedWallpaper.image);
          previews[savedWallpaper.id] = url;
          previewUrls.push(url);
        });

        setCustomWallpapers(savedWallpapers);
        setCustomPreviews(previews);
      })
      .catch((error) => {
        console.error('Custom wallpaper loading error:', error);
        if (active) setWallpaperError('Unable to load custom wallpapers.');
      });

    return () => {
      active = false;
      previewUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  const handleAddWallpaper = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setWallpaperError('Choose a JPG, PNG, or WEBP image.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setWallpaperError('Wallpaper images must be 5 MB or smaller.');
      return;
    }

    setSavingWallpaper(true);
    setWallpaperError('');
    try {
      const savedWallpaper = {
        id: `custom:${crypto.randomUUID()}`,
        name: file.name.replace(/\.[^.]+$/, '') || 'Custom wallpaper',
        image: file,
      };
      await saveCustomWallpaper(savedWallpaper);

      const previewUrl = URL.createObjectURL(file);
      setCustomWallpapers((previous) => [...previous, savedWallpaper]);
      setCustomPreviews((previous) => ({
        ...previous,
        [savedWallpaper.id]: previewUrl,
      }));
      onWallpaperChange(savedWallpaper.id);
    } catch (error) {
      console.error('Custom wallpaper save error:', error);
      setWallpaperError('Unable to save this wallpaper. Please try again.');
    } finally {
      setSavingWallpaper(false);
    }
  };

  const handleDeleteWallpaper = async (id) => {
    try {
      await deleteCustomWallpaper(id);
      setCustomWallpapers((previous) => previous.filter((item) => item.id !== id));
      setCustomPreviews((previous) => {
        const next = { ...previous };
        if (next[id]) URL.revokeObjectURL(next[id]);
        delete next[id];
        return next;
      });
      if (wallpaper === id) onWallpaperChange('default');
    } catch (error) {
      console.error('Custom wallpaper delete error:', error);
      setWallpaperError('Unable to remove this wallpaper. Please try again.');
    }
  };

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
          <div className="px-5 sm:px-6 pb-5 pt-3 grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-3">
            {wallpapers.map((w) => {
              const active = wallpaper === w.id;
              return (
                <button key={w.id} onClick={() => onWallpaperChange(w.id)} className="flex flex-col items-center gap-1.5">
                  <div
                    style={w.image
                      ? { backgroundImage: `url(${w.image})`, backgroundSize: 'cover', backgroundPosition: 'center' }
                      : { background: w.swatch }}
                    className={`w-full aspect-square rounded-xl border-2 transition-all ${
                      active ? 'border-accent-cyan shadow-glow-accent' : 'border-base-700 hover:border-base-600'
                    }`}
                  />
                  <span className={`text-[11px] ${active ? 'text-accent-cyan font-medium' : 'text-base-400'}`}>{w.label}</span>
                </button>
              );
            })}
            {customWallpapers.map((customWallpaper) => {
              const active = wallpaper === customWallpaper.id;
              return (
                <div key={customWallpaper.id} className="group relative min-w-0">
                  <button
                    type="button"
                    onClick={() => onWallpaperChange(customWallpaper.id)}
                    className="flex w-full flex-col items-center gap-1.5"
                  >
                    <div
                      style={{ backgroundImage: `url(${customPreviews[customWallpaper.id]})` }}
                      className={`w-full aspect-square rounded-xl border-2 bg-cover bg-center transition-all ${
                        active ? 'border-accent-cyan shadow-glow-accent' : 'border-base-700 hover:border-base-600'
                      }`}
                    />
                    <span className={`w-full truncate text-[11px] ${active ? 'text-accent-cyan font-medium' : 'text-base-400'}`}>
                      {customWallpaper.name}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteWallpaper(customWallpaper.id)}
                    aria-label={`Remove ${customWallpaper.name}`}
                    className="absolute right-1 top-1 grid h-7 w-7 place-items-center rounded-lg bg-base-950/80 text-base-200 opacity-0 transition hover:bg-rose-500 hover:text-white group-hover:opacity-100 focus:opacity-100"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              );
            })}
            <button
              type="button"
              onClick={() => imageInputRef.current?.click()}
              disabled={savingWallpaper}
              className="flex flex-col items-center gap-1.5 disabled:opacity-60"
            >
              <span className="grid aspect-square w-full place-items-center rounded-xl border-2 border-dashed border-base-700 text-base-400 transition hover:border-accent-cyan hover:text-accent-cyan">
                <ImagePlus size={22} />
              </span>
              <span className="text-[11px] text-base-400">
                {savingWallpaper ? 'Adding…' : 'Add image'}
              </span>
            </button>
            <input
              ref={imageInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleAddWallpaper}
            />
          </div>
          {wallpaperError && (
            <p role="alert" className="px-5 pb-4 text-xs text-rose-400 sm:px-6">
              {wallpaperError}
            </p>
          )}
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
