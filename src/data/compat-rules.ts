export interface CompatExclusion {
  deviceSlug: string;
  coilSlug: string;
  blockedKind: "nativa" | "kit";
  reason: string;
}

export const compatExclusions: CompatExclusion[] = [
  {
    deviceSlug: "geekvape-aegis-legend-2",
    coilSlug: "geekvape-z-0-15",
    blockedKind: "kit",
    reason:
      "Comparten la plataforma Z, pero el PDF de Geekvape no lista el L200 en la fila de la Z 0,15 Ω. No es el tanque del kit.",
  },
  {
    deviceSlug: "geekvape-aegis-legend-2",
    coilSlug: "geekvape-z-0-15-xm",
    blockedKind: "kit",
    reason:
      "Comparten la plataforma Z, pero el PDF no nombra el L200 para la Z 0,15 Ω XM. No es el tanque del kit.",
  },
];

export function exclusionReason(
  deviceSlug: string,
  coilSlug: string,
  kind: "nativa" | "kit",
): string | null {
  return (
    compatExclusions.find(
      (rule) =>
        rule.deviceSlug === deviceSlug && rule.coilSlug === coilSlug && rule.blockedKind === kind,
    )?.reason ?? null
  );
}
