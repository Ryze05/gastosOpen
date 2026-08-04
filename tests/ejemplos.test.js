"use strict";

const assert = require("assert");
const { test, resumen } = require("./_utils.js");
const { crearGrupo, agregarGasto, balances, liquidacion, resumen: resumenGrupo } = require("../lib/gastos.js");

// Casos de aceptación oficiales de SPEC.md sección 5 (oráculo de pruebas)

test("Ejemplo 1: reparto exacto", () => {
  const grupo = crearGrupo("Casa Rural", ["Ana", "Luis", "Marta"]);
  agregarGasto(grupo, { concepto: "Alquiler", importe: 30, pagadoPor: "Ana" });

  assert.deepStrictEqual(balances(grupo), { Ana: 20, Luis: -10, Marta: -10 });
  assert.deepStrictEqual(liquidacion(grupo), [
    { de: "Luis", a: "Ana", importe: 10 },
    { de: "Marta", a: "Ana", importe: 10 }
  ]);
});

test("Ejemplo 2: reparto con decimales repetitivos", () => {
  const grupo = crearGrupo("Viaje", ["Ana", "Luis", "Marta"]);
  agregarGasto(grupo, { concepto: "Gasolina", importe: 10, pagadoPor: "Ana" });

  assert.deepStrictEqual(balances(grupo), { Ana: 6.67, Luis: -3.33, Marta: -3.33 });
  assert.deepStrictEqual(liquidacion(grupo), [
    { de: "Luis", a: "Ana", importe: 3.33 },
    { de: "Marta", a: "Ana", importe: 3.33 }
  ]);
});

test("Ejemplo 3: grupo recién creado (sin gastos)", () => {
  const grupo = crearGrupo("Escapada", ["Ana", "Luis"]);

  assert.deepStrictEqual(balances(grupo), { Ana: 0, Luis: 0 });
  assert.deepStrictEqual(liquidacion(grupo), []);
  assert.deepStrictEqual(resumenGrupo(grupo), { total: 0, cuota: 0, numGastos: 0, participantes: 2 });
});

resumen("ejemplos.test.js");
