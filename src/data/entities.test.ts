import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { coilBySlug, deviceBySlug } from "./catalog.ts";
import { interfacesMayMate, projectCoil, projectDevice, type MatingInterface } from "./entities.ts";

describe("entidades físicas proyectadas", () => {
  it("una cápsula XROS se proyecta como cartucho", () => {
    const coil = coilBySlug("xros-corex-0-8");
    assert.ok(coil);
    const projected = projectCoil(coil!);
    assert.equal(projected.kind, "cartridge");
  });

  it("una coil de tanque se proyecta como cabezal con interfaz de alojamiento", () => {
    const coil = coilBySlug("geekvape-z-0-15");
    assert.ok(coil);
    const projected = projectCoil(coil!);
    assert.equal(projected.kind, "coil_head");
    if (projected.kind === "coil_head") {
      assert.match(projected.housingInterfaceId, /^coil_housing:/);
    }
  });

  it("interfaces de distinto kind no se emparejan por coincidencia textual", () => {
    const a: MatingInterface = {
      kind: "device_atomizer",
      id: "shared-label",
      label: "510",
    };
    const b: MatingInterface = {
      kind: "coil_housing",
      id: "shared-label",
      label: "510",
    };
    assert.equal(interfacesMayMate(a, b), false);
  });

  it("el kit del dispositivo lista plataformas explícitas", () => {
    const device = deviceBySlug("vaporesso-xros-4");
    assert.ok(device);
    const { kit, interfaces } = projectDevice(device!);
    assert.ok(kit.platformIds.length > 0);
    assert.ok(interfaces.some((entry) => entry.kind === "device_cartridge"));
  });
});
