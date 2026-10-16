import assert from "node:assert/strict";
import { test } from "node:test";
import {
  AGE_STORAGE_KEY,
  AGE_STORAGE_OK,
  storeGet,
  storeSet,
  type StorageLike,
} from "../lib/browser-store.ts";

function memoryStore(initial: Record<string, string> = {}): StorageLike & {
  data: Record<string, string>;
} {
  const data = { ...initial };
  return {
    data,
    getItem(key: string) {
      return Object.prototype.hasOwnProperty.call(data, key) ? data[key]! : null;
    },
    setItem(key: string, value: string) {
      data[key] = value;
    },
  };
}

function throwingStore(mode: "get" | "set" | "both"): StorageLike {
  return {
    getItem() {
      if (mode === "get" || mode === "both") throw new Error("denied");
      return null;
    },
    setItem() {
      if (mode === "set" || mode === "both") throw new Error("denied");
    },
  };
}

test("storeGet lee un valor persistido", () => {
  const storage = memoryStore({ [AGE_STORAGE_KEY]: AGE_STORAGE_OK });
  assert.equal(storeGet(AGE_STORAGE_KEY, storage), AGE_STORAGE_OK);
});

test("storeGet devuelve null si el almacenamiento lanza", () => {
  assert.equal(storeGet(AGE_STORAGE_KEY, throwingStore("get")), null);
});

test("storeGet devuelve null sin almacenamiento", () => {
  assert.equal(storeGet(AGE_STORAGE_KEY, null), null);
});

test("storeSet persiste y reporta éxito", () => {
  const storage = memoryStore();
  assert.equal(storeSet(AGE_STORAGE_KEY, AGE_STORAGE_OK, storage), true);
  assert.equal(storage.data[AGE_STORAGE_KEY], AGE_STORAGE_OK);
});

test("storeSet no condiciona el éxito de la visita: falla sin lanzar", () => {
  assert.equal(storeSet(AGE_STORAGE_KEY, AGE_STORAGE_OK, throwingStore("set")), false);
  assert.equal(storeSet(AGE_STORAGE_KEY, AGE_STORAGE_OK, null), false);
});
