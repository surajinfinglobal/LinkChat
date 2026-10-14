import { useState } from 'react';
import { Volume2 } from 'lucide-react';
import { Card, CardHeader, SettingRow, Divider, PageHeader } from '../components/Primitives';
import Toggle from '../components/Toggle';

const SOUND_OPTIONS = ['Chime', 'Pop', 'Ding', 'None'];

export default function NotificationsSection({ settings, onChange }) {
  const [soundOpen, setSoundOpen] = useState(false);

  const set = (key) => (val) => onChange({ ...settings, [key]: val });

  return (
    <div>
      <PageHeader title="Notifications" description="Choose what you want to be notified about." />

      <div className="space-y-5">
        <Card>
          <CardHeader title="Messages" />
          <SettingRow
            label="Message notifications"
            description="Get notified when you receive a new message"
            control={<Toggle checked={settings.messages} onChange={set('messages')} />}
          />
          <Divider />
          <SettingRow
            label="Sound"
            description="Play a sound for incoming messages"
            control={
              <div className="flex items-center gap-2">
                <div className="relative">
                  <button
                    onClick={() => setSoundOpen((s) => !s)}
                    disabled={!settings.sound}
                    className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-base-800 border border-base-700 text-xs text-base-200 disabled:opacity-40 hover:border-base-600 transition-colors"
                  >
                    <Volume2 size={13} />
                    {settings.soundOption}
                  </button>
                  {soundOpen && settings.sound && (
                    <div className="absolute right-0 top-full mt-1.5 w-32 rounded-xl bg-base-800 border border-base-600 shadow-panel py-1 z-20 animate-pop-in">
                      {SOUND_OPTIONS.map((s) => (
                        <button
                          key={s}
                          onClick={() => {
                            set('soundOption')(s);
                            setSoundOpen(false);
                          }}
                          className="w-full text-left px-3 py-1.5 text-xs text-base-200 hover:bg-base-700"
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <Toggle checked={settings.sound} onChange={set('sound')} />
              </div>
            }
          />
          <Divider />
          <SettingRow
            label="Desktop notifications"
            description="Show a system notification when LinkChat is in the background"
            control={<Toggle checked={settings.desktop} onChange={set('desktop')} />}
          />
        </Card>

        <Card>
          <CardHeader title="Mentions & groups" />
          <SettingRow
            label="Mention notifications"
            description="Always notify when someone @mentions you"
            control={<Toggle checked={settings.mentions} onChange={set('mentions')} />}
          />
          <Divider />
          <SettingRow
            label="Group notifications"
            description="Get notified for messages in group chats"
            control={<Toggle checked={settings.groups} onChange={set('groups')} />}
          />
        </Card>
      </div>
    </div>
  );
}
