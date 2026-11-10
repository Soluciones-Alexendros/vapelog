/** Filtro compartido E2E / a11y: no amplía más allá de vercel.live CSP y recursos triviales. */

export function isPreviewHostNoise(text) {
  return (
    /vercel\.live/i.test(text) &&
    (/Content Security Policy/i.test(text) || /report-only/i.test(text) || /Framing '/i.test(text))
  );
}

export function isBenignConsoleNoise(text) {
  return /favicon|Failed to load resource/i.test(text) || isPreviewHostNoise(text);
}
