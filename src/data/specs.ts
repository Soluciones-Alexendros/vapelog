import { platformById } from "./catalog.ts";
import { defsFor } from "./spec-def.ts";
import { formatPlain } from "../components/labels.ts";
import type { CatalogItem, Device, Liquid, LiquidVariation, NicotineType, Part } from "./types.ts";

export const EMPTY = "Sin dato publicado";

export interface SpecFact {
  key: string;
  group: string;
  groupLabel: string;
  label: string;
  display: string;
  published: boolean;
  unit: string | null;
  confidence: string | null;
}

export interface SpecGroup {
  id: string;
  label: string;
  facts: SpecFact[];
}

export interface CompareRow {
  key: string;
  label: string;
  values: string[];
  published: boolean[];
}

export interface RelationRow {
  key: string;
  label: string;
  value: string;
}

export function specFacts(item: CatalogItem): SpecFact[] {
  return defsFor(item.domain).map((row) => {
    const value = row.read(item);
    const published = value != null && value.trim() !== "";
    const confidence = published ? (row.confidence?.(item) ?? null) : null;
    return {
      key: row.key,
      group: row.group,
      groupLabel: row.groupLabel,
      label: row.label,
      published,
      unit: row.unit,
      confidence,
      display: published ? (row.unit ? `${value} ${row.unit}` : value!.trim()) : EMPTY,
    };
  });
}

export function specGroups(item: CatalogItem): SpecGroup[] {
  const groups: SpecGroup[] = [];
  for (const row of specFacts(item)) {
    const current = groups.find((group) => group.id === row.group);
    if (current) current.facts.push(row);
    else groups.push({ id: row.group, label: row.groupLabel, facts: [row] });
  }
  return groups;
}

export function relationRows(item: CatalogItem): RelationRow[] {
  if (item.domain === "device") return deviceRelations(item);
  if (item.domain === "coil") {
    return [{ key: "platforms", label: "Plataforma", value: names(item.platformIds) ?? EMPTY }];
  }
  if (item.domain === "part") return partRelations(item);
  return [];
}

function deviceRelations(item: Device): RelationRow[] {
  return [
    { key: "platforms", label: "Plataforma", value: names(item.platformIds) ?? EMPTY },
    {
      key: "kit_platforms",
      label: "Atomizador del kit",
      value: names(item.kitPlatformIds) ?? EMPTY,
    },
  ];
}

function partRelations(item: Part): RelationRow[] {
  return [{ key: "platforms", label: "Plataforma", value: names(item.fitsPlatformIds) ?? EMPTY }];
}

function names(ids: string[]): string | null {
  if (ids.length === 0) return null;
  return ids.map((id) => platformById(id)?.name ?? id).join(", ");
}

function nicotineTypeLabel(type: NicotineType): string {
  if (type === "sal") return "Sales";
  if (type === "freebase") return "Freebase";
  return "Sin nicotina";
}

export function variationRows(liquid: Liquid): SpecFact[] {
  return liquid.variations.map((variation) => ({
    key: variation.id,
    group: "variaciones",
    groupLabel: "Variaciones",
    label: variation.label,
    display: variationDisplay(variation),
    published: true,
    unit: null,
    confidence: null,
  }));
}

function variationDisplay(variation: LiquidVariation): string {
  const parts: string[] = [`${formatPlain(variation.volumeMl)} ml`];
  parts.push(
    variation.nicotineMg > 0
      ? `${formatPlain(variation.nicotineMg)} mg/ml ${nicotineTypeLabel(variation.nicotineType)}`
      : "0 mg/ml",
  );
  if (variation.ratio) parts.push(variation.ratio);
  if (variation.bottle) parts.push(variation.bottle);
  if (variation.assumedBottleMl) parts.push(`botella ${formatPlain(variation.assumedBottleMl)} ml`);
  return parts.join(" · ");
}

export function compareFacts(items: CatalogItem[]): CompareRow[] {
  const first = items[0];
  if (!first) return [];
  return specFacts(first).map((row) => ({
    key: row.key,
    label: row.label,
    values: items.map(
      (item) => specFacts(item).find((factRow) => factRow.key === row.key)?.display ?? EMPTY,
    ),
    published: items.map(
      (item) => specFacts(item).find((factRow) => factRow.key === row.key)?.published ?? false,
    ),
  }));
}
