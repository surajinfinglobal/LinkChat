export function formatTime(iso) {
  const d = new Date(iso);
  let hours = d.getHours();
  const minutes = d.getMinutes().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  return `${hours}:${minutes} ${ampm}`;
}

export function formatListTime(iso) {
  const d = new Date(iso);
  const now = new Date('2026-09-25T10:00:00');
  const diffMs = now - d;
  const diffDays = Math.floor((now.setHours(0, 0, 0, 0) - new Date(d).setHours(0, 0, 0, 0)) / 86400000);

  if (diffDays === 0) return formatTime(iso);
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return d.toLocaleDateString('en-US', { weekday: 'short' });
  return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
}

export function formatDateSeparator(iso) {
  const d = new Date(iso);
  const now = new Date('2026-09-25T10:00:00');
  const diffDays = Math.floor((now.setHours(0, 0, 0, 0) - new Date(d).setHours(0, 0, 0, 0)) / 86400000);

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  return d.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' });
}

export function dayKey(iso) {
  return new Date(iso).toDateString();
}
