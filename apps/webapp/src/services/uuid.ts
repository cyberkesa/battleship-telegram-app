export function randomUUID(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    // @ts-ignore
    return crypto.randomUUID();
  }
  // Fallback RFC4122 v4-ish
  const buf = new Uint8Array(16);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(buf);
  } else {
    for (let i = 0; i < buf.length; i++) buf[i] = Math.floor(Math.random() * 256);
  }
  buf[6] = (buf[6] & 0x0f) | 0x40;
  buf[8] = (buf[8] & 0x3f) | 0x80;
  const hex: string[] = [];
  for (let i = 0; i < buf.length; i++) {
    hex.push((buf[i] + 0x100).toString(16).slice(1));
  }
  return (
    hex[0] + hex[1] + hex[2] + hex[3] + '-' +
    hex[4] + '-' + hex[5] + '-' + hex[6] + '-' +
    hex[7] + hex[8] + hex[9] + hex[10] + hex[11]
  );
}

