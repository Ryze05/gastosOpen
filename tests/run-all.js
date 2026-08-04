"use strict";

const { execFileSync } = require("child_process");
const path = require("path");
const fs = require("fs");

const dir = __dirname;
const archivos = fs
  .readdirSync(dir)
  .filter((f) => f.endsWith(".test.js"))
  .sort();

let fallo = false;
for (const archivo of archivos) {
  console.log(`\n=== ${archivo} ===`);
  try {
    execFileSync(process.execPath, [path.join(dir, archivo)], { stdio: "inherit" });
  } catch (e) {
    fallo = true;
  }
}

if (fallo) {
  console.error("\nAlgunos tests fallaron.");
  process.exit(1);
}
console.log("\nTodos los tests pasaron.");
