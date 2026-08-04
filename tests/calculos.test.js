"use strict";

const assert = require("assert");
const { test, resumen } = require("./_utils.js");
const { crearGrupo, agregarGasto, totalPorPersona, balances, resumen: resumenGrupo } = require("../lib/gastos.js");

// totalPorPersona
test("totalPorPersona lista a todos los participantes con 0 si no pagaron", () => {
  const grupo = crearGrupo("Grupo", ["Ana", "Luis", "Marta"]);
  agregarGasto(grupo, { concepto: "X", importe: 10, pagadoPor: "Ana" });
  assert.deepStrictEqual(totalPorPersona(grupo), { Ana: 10, Luis: 0, Marta: 0 });
});

test("totalPorPersona acumula varios gastos", () => {
  const grupo = crearGrupo("Grupo", ["Ana", "Luis"]);
  agregarGasto(grupo, { concepto: "A", importe: 10.5, pagadoPor: "Ana" });
  agregarGasto(grupo, { concepto: "B", importe: 4.25, pagadoPor: "Ana" });
  agregarGasto(grupo, { concepto: "C", importe: 7.75, pagadoPor: "Luis" });
  assert.deepStrictEqual(totalPorPersona(grupo), { Ana: 14.75, Luis: 7.75 });
});

test("totalPorPersona redondea a 2 decimales", () => {
  const grupo = crearGrupo("Grupo", ["Ana", "Luis"]);
  agregarGasto(grupo, { concepto: "X", importe: 1 / 3, pagadoPor: "Ana" });
  assert.deepStrictEqual(totalPorPersona(grupo), { Ana: 0.33, Luis: 0 });
});

// balances
test("balances con gastos decimales redondea a 2 decimales", () => {
  const grupo = crearGrupo("Viaje", ["Ana", "Luis", "Marta"]);
  agregarGasto(grupo, { concepto: "Gasolina", importe: 10, pagadoPor: "Ana" });
  assert.deepStrictEqual(balances(grupo), { Ana: 6.67, Luis: -3.33, Marta: -3.33 });
});

test("balances con grupo sin gastos devuelve ceros", () => {
  const grupo = crearGrupo("Grupo", ["Ana", "Luis"]);
  assert.deepStrictEqual(balances(grupo), { Ana: 0, Luis: 0 });
});

test("balances con todos pagando lo mismo da ceros", () => {
  const grupo = crearGrupo("Grupo", ["Ana", "Luis", "Marta"]);
  agregarGasto(grupo, { concepto: "A", importe: 30, pagadoPor: "Ana" });
  agregarGasto(grupo, { concepto: "B", importe: 30, pagadoPor: "Luis" });
  agregarGasto(grupo, { concepto: "C", importe: 30, pagadoPor: "Marta" });
  assert.deepStrictEqual(balances(grupo), { Ana: 0, Luis: 0, Marta: 0 });
});

// resumen
test("resumen redondea total y cuota a 2 decimales", () => {
  const grupo = crearGrupo("Grupo", ["Ana", "Luis", "Marta"]);
  agregarGasto(grupo, { concepto: "X", importe: 10, pagadoPor: "Ana" });
  assert.deepStrictEqual(resumenGrupo(grupo), { total: 10, cuota: 3.33, numGastos: 1, participantes: 3 });
});

test("resumen con varios gastos acumula el total", () => {
  const grupo = crearGrupo("Grupo", ["Ana", "Luis"]);
  agregarGasto(grupo, { concepto: "A", importe: 10, pagadoPor: "Ana" });
  agregarGasto(grupo, { concepto: "B", importe: 20, pagadoPor: "Luis" });
  assert.deepStrictEqual(resumenGrupo(grupo), { total: 30, cuota: 15, numGastos: 2, participantes: 2 });
});

test("resumen de grupo recién creado", () => {
  const grupo = crearGrupo("Grupo", ["Ana", "Luis"]);
  assert.deepStrictEqual(resumenGrupo(grupo), { total: 0, cuota: 0, numGastos: 0, participantes: 2 });
});

resumen("calculos.test.js");
