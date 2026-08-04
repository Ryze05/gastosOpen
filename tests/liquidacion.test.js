"use strict";

const assert = require("assert");
const { test, resumen } = require("./_utils.js");
const { crearGrupo, agregarGasto, liquidacion } = require("../lib/gastos.js");

test("liquidacion ordena por importe descendente y por 'de' alfabético en empates", () => {
  const grupo = crearGrupo("Grupo", ["Ana", "Luis", "Marta", "Zoe"]);
  agregarGasto(grupo, { concepto: "Cena", importe: 40, pagadoPor: "Ana" });
  assert.deepStrictEqual(liquidacion(grupo), [
    { de: "Luis", a: "Ana", importe: 10 },
    { de: "Marta", a: "Ana", importe: 10 },
    { de: "Zoe", a: "Ana", importe: 10 }
  ]);
});

test("liquidacion con varios gastos y varios deudores", () => {
  const grupo = crearGrupo("Viaje", ["Ana", "Luis", "Marta"]);
  agregarGasto(grupo, { concepto: "Hotel", importe: 90, pagadoPor: "Luis" });
  agregarGasto(grupo, { concepto: "Comida", importe: 30, pagadoPor: "Marta" });
  assert.deepStrictEqual(liquidacion(grupo), [
    { de: "Ana", a: "Luis", importe: 40 },
    { de: "Marta", a: "Luis", importe: 10 }
  ]);
});

test("liquidacion con saldos en 0 no genera transferencias", () => {
  const grupo = crearGrupo("Grupo", ["Ana", "Luis", "Marta"]);
  agregarGasto(grupo, { concepto: "A", importe: 30, pagadoPor: "Ana" });
  agregarGasto(grupo, { concepto: "B", importe: 30, pagadoPor: "Luis" });
  agregarGasto(grupo, { concepto: "C", importe: 30, pagadoPor: "Marta" });
  assert.deepStrictEqual(liquidacion(grupo), []);
});

test("liquidacion ignora diferencias de 1 céntimo (M <= 0.01)", () => {
  const grupo = crearGrupo("Grupo", ["Ana", "Luis", "Marta"]);
  agregarGasto(grupo, { concepto: "A", importe: 10, pagadoPor: "Ana" });
  agregarGasto(grupo, { concepto: "B", importe: 10, pagadoPor: "Luis" });
  agregarGasto(grupo, { concepto: "C", importe: 10.01, pagadoPor: "Marta" });
  assert.deepStrictEqual(liquidacion(grupo), []);
});

test("liquidacion de grupo recién creado devuelve array vacío", () => {
  const grupo = crearGrupo("Grupo", ["Ana", "Luis"]);
  assert.deepStrictEqual(liquidacion(grupo), []);
});

test("liquidacion minimiza el número de transferencias", () => {
  const grupo = crearGrupo("Grupo", ["Ana", "Luis", "Marta", "Pepe"]);
  agregarGasto(grupo, { concepto: "Hotel", importe: 400, pagadoPor: "Ana" });
  agregarGasto(grupo, { concepto: "Comida", importe: 100, pagadoPor: "Luis" });
  // total 500, cuota 125. Ana +275, Luis -25, Marta -125, Pepe -125
  assert.deepStrictEqual(liquidacion(grupo), [
    { de: "Marta", a: "Ana", importe: 125 },
    { de: "Pepe", a: "Ana", importe: 125 },
    { de: "Luis", a: "Ana", importe: 25 }
  ]);
});

test("liquidacion con un solo acreedor concentra las transferencias", () => {
  const grupo = crearGrupo("Grupo", ["Ana", "Luis", "Marta"]);
  agregarGasto(grupo, { concepto: "Todo", importe: 30, pagadoPor: "Ana" });
  assert.deepStrictEqual(liquidacion(grupo), [
    { de: "Luis", a: "Ana", importe: 10 },
    { de: "Marta", a: "Ana", importe: 10 }
  ]);
});

resumen("liquidacion.test.js");
