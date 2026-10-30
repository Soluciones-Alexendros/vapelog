import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { clearFxPrefs, FX_PREF_KEYS } from "../lib/clear-fx-prefs.ts";

function memoryStore(initial: Record<string, string> = {}): Storage {
  const data = new Map(Object.entries(initial));
  return {
    get length() {
      return data.size;
    },
    clear() {
      data.clear();
    },
    getItem(key: string) {
      return data.has(key) ? (data.get(key) as string) : null;
    },
    key() {
      return null;
    },
    removeItem(key: string) {
      data.delete(key);
    },
    setItem(key: string, value: string) {
      data.set(key, value);
    },
  };
}

describe("clearFxPrefs", () => {
  it("no falla con store nulo", () => {
    assert.deepEqual(clearFxPrefs(null), { hadLegacy: false });
    assert.deepEqual(clearFxPrefs(undefined), { hadLegacy: false });
  });

  it("borra vapelog-fx y vapelog-fx:v2 sin reescribirlas", () => {
    const store = memoryStore({
      "vapelog-fx:v2": "on",
      "vapelog-fx": "off",
      "vapelog-theme": "dark",
    });
    const result = clearFxPrefs(store);
    assert.equal(result.hadLegacy, true);
    for (const key of FX_PREF_KEYS) {
      assert.equal(store.getItem(key), null);
    }
    assert.equal(store.getItem("vapelog-theme"), "dark");
  });

  it("reporta ausencia cuando no había claves", () => {
    const store = memoryStore({ "vapelog-theme": "light" });
    assert.deepEqual(clearFxPrefs(store), { hadLegacy: false });
    assert.equal(store.getItem("vapelog-theme"), "light");
  });

  it("tolera getItem/removeItem que lanzan", () => {
    const store = {
      getItem() {
        throw new Error("blocked");
      },
      removeItem() {
        throw new Error("blocked");
      },
    };
    assert.deepEqual(clearFxPrefs(store), { hadLegacy: false });
  });
});
