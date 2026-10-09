import { Card, CardHeader, SettingRow, Divider, PageHeader } from '../components/Primitives';
import SegmentedControl from '../components/SegmentedControl';
import Toggle from '../components/Toggle';

const VISIBILITY_OPTIONS = [
  { value: 'everyone', label: 'Everyone' },
  { value: 'contacts', label: 'Contacts' },
  { value: 'nobody', label: 'Nobody' },
];

export default function PrivacySection({ settings, onChange, saveState }) {
  const set = (key) => (val) => onChange({ ...settings, [key]: val });
  const isLoading = saveState === 'loading';
  const saveMessage = {
    loading: 'Loading preferences...',
    saving: 'Saving...',
    saved: 'Saved',
    error: 'Could not save. Try changing a setting again.',
  }[saveState];

  return (
    <div>
      <PageHeader title="Privacy" description="Control who can see your activity and information. Contacts are people you share a conversation with." />

      <Card>
        <CardHeader title="Visibility" />
        <SettingRow
          label="Last seen"
          description="Who can see when you were last online"
          control={<SegmentedControl options={VISIBILITY_OPTIONS} value={settings.lastSeen} onChange={set('lastSeen')} disabled={isLoading} />}
        />
        <Divider />
        <SettingRow
          label="Online status"
          description="Show a green dot when you're active"
          control={<Toggle checked={settings.onlineStatus} onChange={set('onlineStatus')} label="Show online status" disabled={isLoading} />}
        />
        <Divider />
        <SettingRow
          label="Profile photo"
          description="Who can see your profile photo"
          control={<SegmentedControl options={VISIBILITY_OPTIONS} value={settings.photoVisibility} onChange={set('photoVisibility')} disabled={isLoading} />}
        />
        <Divider />
        <SettingRow
          label="Read receipts"
          description="Let others see when you've read their messages"
          control={<Toggle checked={settings.readReceipts} onChange={set('readReceipts')} label="Send read receipts" disabled={isLoading} />}
        />
      </Card>
      <p className={`mt-3 min-h-5 text-xs ${saveState === 'error' ? 'text-rose-400' : 'text-base-400'}`} role="status" aria-live="polite">
        {saveMessage}
      </p>
    </div>
  );
}
