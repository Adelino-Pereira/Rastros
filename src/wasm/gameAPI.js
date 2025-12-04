let wasm = null;

export async function initWasm() {
  if (!wasm) {
    if (!window.createGameModule) {
      throw new Error("WASM game.js not loaded in HTML");
    }
    wasm = await window.createGameModule();
  }
  return wasm;
}
