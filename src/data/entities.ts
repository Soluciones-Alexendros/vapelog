/**
 * Entidades físicas internas. Las secciones de navegación
 * device/coil/liquid/part siguen siendo proyecciones sobre este modelo.
 */
import type { Coil, Device, Draw, Liquid, Part, TpdStatus } from "./types.ts";

export type PhysicalKind =
  "device" | "atomizer" | "cartridge" | "coil_head" | "accessory" | "liquid";

export type InterfaceKind =
  "device_atomizer" | "device_cartridge" | "coil_housing" | "mouthpiece_housing";

export interface MatingInterface {
  kind: InterfaceKind;
  id: string;
  label: string;
}

export interface Atomizer {
  kind: "atomizer";
  id: string;
  slug: string;
  name: string;
  platformIds: string[];
  connector: "510" | "propietario";
  capacityMl: number | null;
  refillable: boolean;
  draws: Draw[];
  /** Cabezal integrado embebido (sin identidad comercial aparte) o null. */
  heaterEmbedded: boolean;
  integratedCoilId: string | null;
}

export interface Cartridge {
  kind: "cartridge";
  id: string;
  slug: string;
  name: string;
  platformIds: string[];
  capacityMl: number | null;
  refillable: boolean;
  draws: Draw[];
  coilReplaceable: boolean;
  /** Calefactor embebido sin ficha comercial independiente. */
  heaterEmbedded: boolean;
  /** Solo si existe un CoilHead con identidad propia en el catálogo. */
  integratedCoilId: string | null;
}

export interface CoilHead {
  kind: "coil_head";
  id: string;
  slug: string;
  name: string;
  platformIds: string[];
  ohms: number;
  wattMin: number | null;
  wattMax: number | null;
  draws: Draw[];
  housingInterfaceId: string;
  meshCount: 1 | 2 | 3 | 4 | null;
}

export type AccessoryKind = "drip_tip" | "battery" | "glass" | "other";

export interface Accessory {
  kind: "accessory";
  accessoryKind: AccessoryKind;
  id: string;
  slug: string;
  name: string;
  fitsPlatformIds: string[];
  fitsConnector: "510" | null;
  fitsBattery: "18650" | null;
}

export interface KitContents {
  deviceId: string;
  atomizerIds: string[];
  cartridgeIds: string[];
  coilHeadIds: string[];
  accessoryIds: string[];
  platformIds: string[];
}

/**
 * Contenido de kit: desconocido ≠ lista vacía confirmada.
 * Sin documentación editorial no se inventan componentes.
 */
export type KitProjection =
  | { status: "unknown"; deviceId: string; platformIds: string[] }
  | { status: "empty_confirmed"; deviceId: string; platformIds: string[] }
  | { status: "documented"; contents: KitContents };

/** Discriminante: cápsula/pod vs cabezal reemplazable. */
export function isCartridgeProjection(coil: Coil): boolean {
  // Familia tanque / cabezal: no reclasificar por un build legado "capsula".
  if (coil.familyId === "tanque" || coil.familyId?.startsWith("tanque.")) {
    return false;
  }
  if (coil.familyId === "capsula" || coil.build === "capsula") return true;
  return false;
}

function meshCountFromCoil(coil: Coil): 1 | 2 | 3 | 4 | null {
  if (coil.wireKind === "doble-malla") return 2;
  if (coil.wireKind === "malla") return 1;
  if (coil.wireKind === "alambre") return null;
  return null;
}

/** Proyecta un ítem de dominio `coil` hacia cartucho o cabezal. */
export function projectCoil(coil: Coil): Cartridge | CoilHead {
  if (isCartridgeProjection(coil)) {
    // Pod/cápsula: la malla puede aparecer en `build` como construcción del
    // calefactor embebido; no implica un CoilHead comercial independiente.
    const heaterEmbedded = true;
    return {
      kind: "cartridge",
      id: coil.id,
      slug: coil.slug,
      name: coil.name,
      platformIds: [...coil.platformIds],
      capacityMl: null,
      refillable: coil.refillable,
      draws: [...coil.draws],
      coilReplaceable: false,
      heaterEmbedded,
      // Sin identidad comercial independiente: no autorreferencia ficticia.
      integratedCoilId: null,
    };
  }
  return {
    kind: "coil_head",
    id: coil.id,
    slug: coil.slug,
    name: coil.name,
    platformIds: [...coil.platformIds],
    ohms: coil.ohms,
    wattMin: coil.wattMin,
    wattMax: coil.wattMax,
    draws: [...coil.draws],
    housingInterfaceId: coil.platformIds[0]
      ? `coil_housing:${coil.platformIds[0]}`
      : `coil_housing:${coil.id}`,
    meshCount: meshCountFromCoil(coil),
  };
}

export function projectDevice(device: Device): {
  device: Device;
  kit: KitProjection;
  interfaces: MatingInterface[];
} {
  const interfaces: MatingInterface[] = [];
  if (device.connector === "510") {
    interfaces.push({
      kind: "device_atomizer",
      id: `device_atomizer:510:${device.id}`,
      label: "Rosca 510",
    });
  }
  for (const platformId of device.platformIds) {
    interfaces.push({
      kind: "device_cartridge",
      id: `device_cartridge:${platformId}`,
      label: `Cápsula ${platformId}`,
    });
  }
  const platformIds = [...device.platformIds, ...device.kitPlatformIds];
  // Sin inventario editorial de componentes del kit: unknown, no lista vacía «comprobada».
  const kit: KitProjection = {
    status: "unknown",
    deviceId: device.id,
    platformIds,
  };
  return {
    device,
    kit,
    interfaces,
  };
}

/** Presentación documentada de kit (solo cuando hay datos editoriales). */
export function documentedKit(contents: KitContents): KitProjection {
  return { status: "documented", contents };
}

export function projectPart(part: Part): Accessory {
  let accessoryKind: AccessoryKind = "other";
  if (part.fitsBattery) accessoryKind = "battery";
  else if (part.dripMm != null) accessoryKind = "drip_tip";
  else if (/cristal|glass/i.test(part.spec)) accessoryKind = "glass";
  return {
    kind: "accessory",
    accessoryKind,
    id: part.id,
    slug: part.slug,
    name: part.name,
    fitsPlatformIds: [...part.fitsPlatformIds],
    fitsConnector: part.fitsConnector,
    fitsBattery: part.fitsBattery,
  };
}

/** Agrega TPD de variantes sin elegir silenciosamente la primera. */
export function aggregateVariationTpd(liquid: Liquid): TpdStatus {
  const values = liquid.variations.map((variation) => variation.tpd);
  if (values.length === 0) return "no-aplica";
  const unique = new Set(values);
  if (unique.size === 1) return values[0]!;
  // Conflictos entre variantes: parcial, no «si» por orden de array.
  if (unique.has("si") || unique.has("parcial")) return "parcial";
  if (unique.has("no")) return "no";
  return "no-aplica";
}

export function projectLiquid(
  liquid: Liquid,
): Liquid & { physicalKind: "liquid"; tpdStatus: TpdStatus } {
  return {
    ...liquid,
    physicalKind: "liquid",
    tpdStatus: aggregateVariationTpd(liquid),
  };
}

/**
 * Dos interfaces solo son candidatas a encaje si comparten `kind` e `id`.
 * Una coincidencia textual entre kinds distintos no implica compatibilidad.
 */
export function interfacesMayMate(a: MatingInterface, b: MatingInterface): boolean {
  return a.kind === b.kind && a.id === b.id;
}

/** Recorre referencias de kit documentado; falla si hay id inexistente. */
export function assertKitReferencesResolvable(
  kit: KitContents,
  knownIds: ReadonlySet<string>,
): string[] {
  const errors: string[] = [];
  if (!knownIds.has(kit.deviceId)) {
    errors.push(`deviceId inexistente: ${kit.deviceId}`);
  }
  for (const id of [
    ...kit.atomizerIds,
    ...kit.cartridgeIds,
    ...kit.coilHeadIds,
    ...kit.accessoryIds,
  ]) {
    if (!knownIds.has(id)) errors.push(`referencia de kit inexistente: ${id}`);
  }
  return errors;
}
