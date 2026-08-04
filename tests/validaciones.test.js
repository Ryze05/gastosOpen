"use strict";

const assert = require("assert");
const { test, resumen } = require("./_utils.js");
const { crearGrupo, agregarGasto } = require("../lib/gastos.js");

// Validaciones de crearGrupo
test("crearGrupo con nombre vacío lanza Error", () => {
  assert.throws(() => crearGrupo("   ", ["Ana", "Luis"]));
});

test("crearGrupo con menos de 2 participantes lanza Error", () => {
  assert.throws(() => crearGrupo("Grupo", ["Ana"]));
});

test("crearGrupo con participante vacío lanza Error", () => {
  assert.throws(() => crearGrupo("Grupo", ["Ana", "  "]));
});

test("crearGrupo con duplicados exactos lanza Error", () => {
  assert.throws(() => crearGrupo("Grupo", ["Ana", "Ana"]));
});

test("crearGrupo permite nombres que difieren en mayúsculas", () => {
  const grupo = crearGrupo("Grupo", ["Ana", "ana"]);
  assert.deepStrictEqual(grupo.participantes, ["Ana", "ana"]);
});

test("crearGrupo devuelve estructura inicial correcta", () => {
  const grupo = crearGrupo("Viaje a la Sierra", ["Ana", "Luis", "Marta"]);
  assert.deepStrictEqual(grupo, { nombre: "Viaje a la Sierra", participantes: ["Ana", "Luis", "Marta"], gastos: [] });
});

// Validaciones de agregarGasto
test("agregarGasto con concepto vacío lanza Error", () => {
  const grupo = crearGrupo("Grupo", ["Ana", "Luis"]);
  assert.throws(() => agregarGasto(grupo, { concepto: "   ", importe: 10, pagadoPor: "Ana" }));
});

test("agregarGasto con importe 0 lanza Error", () => {
  const grupo = crearGrupo("Grupo", ["Ana", "Luis"]);
  assert.throws(() => agregarGasto(grupo, { concepto: "X", importe: 0, pagadoPor: "Ana" }));
});

test("agregarGasto con importe negativo lanza Error", () => {
  const grupo = crearGrupo("Grupo", ["Ana", "Luis"]);
  assert.throws(() => agregarGasto(grupo, { concepto: "X", importe: -5, pagadoPor: "Ana" }));
});

test("agregarGasto con importe NaN o Infinity lanza Error", () => {
  const grupo = crearGrupo("Grupo", ["Ana", "Luis"]);
  assert.throws(() => agregarGasto(grupo, { concepto: "X", importe: NaN, pagadoPor: "Ana" }));
  assert.throws(() => agregarGasto(grupo, { concepto: "X", importe: Infinity, pagadoPor: "Ana" }));
});

test("agregarGasto con pagadoPor que no es participante lanza Error", () => {
  const grupo = crearGrupo("Grupo", ["Ana", "Luis"]);
  assert.throws(() => agregarGasto(grupo, { concepto: "X", importe: 10, pagadoPor: "Marta" }));
});

test("agregarGasto con pagadoPor con distinta capitalización lanza Error", () => {
  const grupo = crearGrupo("Grupo", ["Ana", "Luis"]);
  assert.throws(() => agregarGasto(grupo, { concepto: "X", importe: 10, pagadoPor: "ana" }));
});

// Atomicidad
test("agregarGasto fallido no muta el grupo", () => {
  const grupo = crearGrupo("Grupo", ["Ana", "Luis"]);
  assert.throws(() => agregarGasto(grupo, { concepto: "X", importe: 0, pagadoPor: "Ana" }));
  assert.strictEqual(grupo.gastos.length, 0);
  assert.throws(() => agregarGasto(grupo, { concepto: "X", importe: 10, pagadoPor: "Marta" }));
  assert.strictEqual(grupo.gastos.length, 0);
  assert.throws(() => agregarGasto(grupo, { concepto: "  ", importe: 10, pagadoPor: "Ana" }));
  assert.strictEqual(grupo.gastos.length, 0);
});

// Id correlativo
test("agregarGasto asigna ids correlativos desde 1", () => {
  const grupo = crearGrupo("Grupo", ["Ana", "Luis"]);
  agregarGasto(grupo, { concepto: "A", importe: 10, pagadoPor: "Ana" });
  agregarGasto(grupo, { concepto: "B", importe: 20, pagadoPor: "Luis" });
  assert.deepStrictEqual(grupo.gastos.map((x) => x.id), [1, 2]);
});

test("agregarGasto devuelve el grupo actualizado", () => {
  const grupo = crearGrupo("Grupo", ["Ana", "Luis"]);
  const resultado = agregarGasto(grupo, { concepto: "A", importe: 10, pagadoPor: "Ana" });
  assert.strictEqual(resultado, grupo);
});

resumen("validaciones.test.js");
