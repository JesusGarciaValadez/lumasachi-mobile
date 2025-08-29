export function formatDateTimeLocal(dateString?: string | null): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  }).formatToParts(date);

  const map: Record<string, string> = {};
  for (const part of parts) {
    if (part.type !== 'literal') {
      map[part.type] = part.value;
    }
  }

  const year = map.year || '0000';
  const month = map.month || '00';
  const day = map.day || '00';
  const hour = map.hour || '00';
  const minute = map.minute || '00';
  const second = map.second || '00';
  const dayPeriod = map.dayPeriod || '';

  return `${year}-${month}-${day} ${hour}:${minute}:${second} ${dayPeriod}`.trim();
}

export function formatDateLocal(dateString?: string | null): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);

  const map: Record<string, string> = {};
  for (const part of parts) {
    if (part.type !== 'literal') {
      map[part.type] = part.value;
    }
  }

  const year = map.year || '0000';
  const month = map.month || '00';
  const day = map.day || '00';

  return `${year}-${month}-${day}`;
}


