#!/usr/bin/env node
/**
 * One-shot migration: LiquidVariation volumeMl/hasNicotine/nicotineMg/ratio/assumedBottleMl
 * → fillVolumeMl/containerCapacityMl/nicotineMgPerMl/ratioVgPct/ratioPgPct.
 * Run from repo root. Idempotent on already-migrated blocks (skips if fillVolumeMl present).
 */
import { readFileSync, writeFileSync } from "node:fs";

const FILES = [
  "src/data/liquids-bombo.ts",
  "src/data/liquids-drifter.ts",
  "src/data/liquids-herrera.ts",
  "src/data/liquids-kings-crest.ts",
  "src/data/liquids-oxva.ts",
  "src/data/catalog.ts",
  "src/data/logic.test.ts",
  "src/data/search.test.ts",
  "src/data/specs.test.ts",
];

function parseRatio(ratio) {
  if (!ratio || ratio === "null") return { vg: null, pg: null };
  const m = String(ratio).match(/^(\d+(?:\.\d+)?)\/(\d+(?:\.\d+)?)$/);
  if (!m) return { vg: null, pg: null };
  return { vg: Number(m[1]), pg: Number(m[2]) };
}

function migrateObjectLiteral(block) {
  if (/\bfillVolumeMl\s*:/.test(block)) return block;

  const volume = block.match(/\bvolumeMl\s*:\s*(\d+(?:\.\d+)?)/)?.[1];
  const assumed = block.match(/\bassumedBottleMl\s*:\s*(\d+(?:\.\d+)?)/)?.[1];
  const hasNic = /\bhasNicotine\s*:\s*true/.test(block);
  const hasNicFalse = /\bhasNicotine\s*:\s*false/.test(block);
  const nicMg = block.match(/\bnicotineMg\s*:\s*(\d+(?:\.\d+)?)/)?.[1];
  const ratioLit = block.match(/\bratio\s*:\s*(null|"[^"]+")/)?.[1];
  const ratioVal = ratioLit === "null" || !ratioLit ? null : ratioLit.slice(1, -1);
  const { vg, pg } = parseRatio(ratioVal);

  if (volume == null && !hasNic && !hasNicFalse && nicMg == null) return block;

  let next = block;
  const fill = volume ?? assumed ?? "0";
  const container = assumed ?? volume ?? fill;

  if (/\bvolumeMl\s*:/.test(next)) {
    next = next.replace(/\bvolumeMl\s*:\s*\d+(?:\.\d+)?/, `fillVolumeMl: ${fill}`);
  } else if (!/\bfillVolumeMl\s*:/.test(next)) {
    next = next.replace(
      /(\bid\s*:\s*"[^"]+",\s*\n\s*label:\s*"[^"]*",)/,
      `$1\n        fillVolumeMl: ${fill},`,
    );
  }

  if (/\bassumedBottleMl\s*:/.test(next)) {
    next = next.replace(
      /\bassumedBottleMl\s*:\s*\d+(?:\.\d+)?/,
      `containerCapacityMl: ${container}`,
    );
  } else if (!/\bcontainerCapacityMl\s*:/.test(next)) {
    next = next.replace(
      /\bfillVolumeMl\s*:\s*\d+(?:\.\d+)?/,
      (m) => `${m},\n        containerCapacityMl: ${container}`,
    );
  }

  let nicPerMl = "null";
  if (hasNic) nicPerMl = nicMg ?? "null";
  else if (hasNicFalse) nicPerMl = nicMg ?? "0";
  else if (nicMg != null) nicPerMl = nicMg;

  next = next.replace(/\bhasNicotine\s*:\s*(true|false),?\s*\n?/, "");
  if (/\bnicotineMg\s*:/.test(next)) {
    next = next.replace(/\bnicotineMg\s*:\s*\d+(?:\.\d+)?/, `nicotineMgPerMl: ${nicPerMl}`);
  } else if (!/\bnicotineMgPerMl\s*:/.test(next)) {
    next = next.replace(
      /\bcontainerCapacityMl\s*:\s*\d+(?:\.\d+)?/,
      (m) => `${m},\n        nicotineMgPerMl: ${nicPerMl}`,
    );
  }

  const vgLit = vg == null ? "null" : String(vg);
  const pgLit = pg == null ? "null" : String(pg);
  if (/\bratio\s*:/.test(next)) {
    next = next.replace(
      /\bratio\s*:\s*(null|"[^"]+"),?/,
      `ratioVgPct: ${vgLit},\n        ratioPgPct: ${pgLit},`,
    );
  }

  return next;
}

function migrateFile(path) {
  let src = readFileSync(path, "utf8");
  if (
    !/\bvolumeMl\s*:/.test(src) &&
    !/\bhasNicotine\s*:/.test(src) &&
    !/\bnicotineMg\s*:/.test(src)
  ) {
    console.log(`skip (clean): ${path}`);
    return;
  }

  // Rewrite helper return objects and inline variation literals by scanning brace-balanced blocks
  // that contain volumeMl or hasNicotine.
  const marker = /\b(volumeMl|hasNicotine|nicotineMg|assumedBottleMl)\s*:/;
  let out = "";
  let i = 0;
  while (i < src.length) {
    const rest = src.slice(i);
    const m = rest.search(marker);
    if (m < 0) {
      out += rest;
      break;
    }
    // walk back to nearest `{`
    const abs = i + m;
    let start = abs;
    while (start > i && src[start] !== "{") start--;
    if (src[start] !== "{") {
      out += src.slice(i, abs + 1);
      i = abs + 1;
      continue;
    }
    let depth = 0;
    let end = start;
    for (; end < src.length; end++) {
      if (src[end] === "{") depth++;
      else if (src[end] === "}") {
        depth--;
        if (depth === 0) {
          end++;
          break;
        }
      }
    }
    const block = src.slice(start, end);
    out += src.slice(i, start);
    out += migrateObjectLiteral(block);
    i = end;
  }

  writeFileSync(path, out);
  console.log(`migrated: ${path}`);
}

for (const file of FILES) {
  try {
    migrateFile(file);
  } catch (err) {
    console.error(`fail ${file}:`, err);
    process.exitCode = 1;
  }
}
