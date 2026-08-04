"use strict";

const assert = require("assert");

let pasadas = 0;
let fallidas = 0;

function test(nombre, fn) {
  try {
    fn();
    pasadas++;
    console.log(`  OK  ${nombre}`);
  } catch (e) {
    fallidas++;
    console.error(`  FAIL ${nombre} :: ${e.message}`);
  }
}

function resumen(archivo) {
  console.log(`\n${archivo}: ${pasadas} pasadas, ${fallidas} fallidas`);
  if (fallidas > 0) {
    process.exitCode = 1;
  }
  pasadas = 0;
  fallidas = 0;
}

module.exports = { test, resumen };
