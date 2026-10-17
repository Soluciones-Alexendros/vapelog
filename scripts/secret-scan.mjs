#!/usr/bin/env node
// Detector mínimo de credenciales sintéticas / patrones (VAL-005-02).
// No sustituye al escáner de CI; sirve para el ensayo unitario con fixture.

/** Patrones de credenciales de ensayo (nunca secretos reales). */
export const SYNTHETIC_SECRET_PATTERNS = [
  {
    id: "aws-access-key-id",
    // Prefijo AKIA + 16 alfanuméricos (patrón clásico de Access Key ID).
    re: /\bAKIA[0-9A-Z]{16}\b/g,
  },
  {
    id: "generic-api-token",
    re: /\bvapelog_test_secret_[A-Za-z0-9]{16,}\b/g,
  },
];

/**
 * @param {string} text
 * @returns {{ ok: boolean, findings: Array<{ id: string, match: string }> }}
 */
export function scanSecrets(text) {
  const findings = [];
  for (const { id, re } of SYNTHETIC_SECRET_PATTERNS) {
    re.lastIndex = 0;
    let m;
    while ((m = re.exec(text))) {
      findings.push({ id, match: m[0] });
    }
  }
  return { ok: findings.length === 0, findings };
}
