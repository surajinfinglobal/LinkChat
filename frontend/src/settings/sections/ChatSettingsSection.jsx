import { Download } from 'lucide-react';
import { Card, CardHeader, SettingRow, Divider, PageHeader } from '../components/Primitives';
import SegmentedControl from '../components/SegmentedControl';
import Toggle from '../components/Toggle';

const FONT_OPTIONS = [
  { value: 'small', label: 'Small' },
  { value: 'medium', label: 'Medium' },
  { value: 'large', label: 'Large' },
];

export default function ChatSettingsSection({ settings, onChange }) {
  const set = (key) => (val) => onChange({ ...settings, [key]: val });

  return (
    <div>
      <PageHeader title="Chat Settings" description="Fine-tune how conversations look and behave." />

      <div className="space-y-5">
        <Card>
          <CardHeader title="Composing" />
          <SettingRow
            label="Send with Enter"
            description="Press Enter to send, Shift + Enter for a new line"
            control={<Toggle checked={settings.enterToSend} onChange={set('enterToSend')} />}
          />
          <Divider />
          <SettingRow
            label="Spell check"
            description="Underline misspelled words while typing"
            control={<Toggle checked={settings.spellCheck} onChange={set('spellCheck')} />}
          />
          <Divider />
          <SettingRow
            label="Message font size"
            description="Adjust text size across all conversations"
            control={<SegmentedControl options={FONT_OPTIONS} value={settings.fontSize} onChange={set('fontSize')} />}
          />
        </Card>

        <Card>
          <CardHeader title="Media" />
          <SettingRow
            label="Auto-download media"
            description="Automatically download photos and files in chats"
            control={<Toggle checked={settings.autoDownload} onChange={set('autoDownload')} />}
          />
          <Divider />
          <SettingRow
            label="Auto-play videos"
            description="Play video messages automatically without tapping"
            control={<Toggle checked={settings.autoPlayVideos} onChange={set('autoPlayVideos')} />}
          />
        </Card>

        <Card>
          <CardHeader title="Archiving & backup" />
          <SettingRow
            label="Keep archived chats at top"
            description="Pin the archive folder above your conversation list"
            control={<Toggle checked={settings.archiveOnTop} onChange={set('archiveOnTop')} />}
          />
          <Divider />
          <SettingRow
            label="Export chat data"
            description="Download a copy of your conversations and media"
            control={
              <button className="flex items-center gap-1.5 h-9 px-3.5 rounded-lg text-xs font-medium text-base-200 border border-base-600 hover:bg-base-800 transition-colors">
                <Download size={13} />
                Export
              </button>
            }
          />
        </Card>
      </div>
    </div>
  );
}
