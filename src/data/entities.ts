/**
 * Entidades físicas internas (fase 4). Las secciones de navegación
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
  /** Cabezal integrado (no reemplazable) o null si admite heads. */
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

/** Proyecta un ítem de dominio `coil` hacia cartucho o cabezal. */
export function projectCoil(coil: Coil): Cartridge | CoilHead {
  if (coil.build === "capsula" || coil.familyId === "capsula") {
    return {
      kind: "cartridge",
      id: coil.id,
      slug: coil.slug,
      name: coil.name,
      platformIds: coil.platformIds,
      capacityMl: null,
      refillable: coil.refillable,
      draws: coil.draws,
      coilReplaceable: coil.build !== "capsula",
      integratedCoilId: coil.build === "capsula" ? coil.id : null,
    };
  }
  return {
    kind: "coil_head",
    id: coil.id,
    slug: coil.slug,
    name: coil.name,
    platformIds: coil.platformIds,
    ohms: coil.ohms,
    wattMin: coil.wattMin,
    wattMax: coil.wattMax,
    draws: coil.draws,
    housingInterfaceId: coil.platformIds[0]
      ? `coil_housing:${coil.platformIds[0]}`
      : `coil_housing:${coil.id}`,
  };
}

export function projectDevice(device: Device): {
  device: Device;
  kit: KitContents;
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
  return {
    device,
    kit: {
      deviceId: device.id,
      atomizerIds: [],
      cartridgeIds: [],
      coilHeadIds: [],
      accessoryIds: [],
      platformIds: [...device.platformIds, ...device.kitPlatformIds],
    },
    interfaces,
  };
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
    fitsPlatformIds: part.fitsPlatformIds,
    fitsConnector: part.fitsConnector,
    fitsBattery: part.fitsBattery,
  };
}

export function projectLiquid(
  liquid: Liquid,
): Liquid & { physicalKind: "liquid"; tpdStatus: TpdStatus } {
  return { ...liquid, physicalKind: "liquid", tpdStatus: liquid.variations[0]?.tpd ?? "no-aplica" };
}

/**
 * Dos interfaces solo son candidatas a encaje si comparten `kind`.
 * Una coincidencia textual entre kinds distintos no implica compatibilidad.
 */
export function interfacesMayMate(a: MatingInterface, b: MatingInterface): boolean {
  return a.kind === b.kind && a.id === b.id;
}
