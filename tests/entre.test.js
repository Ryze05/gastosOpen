"use strict";

const assert = require("assert");
const { crearGrupo, agregarGasto, eliminarGasto, balances, liquidacion, totalPorPersona, resumen } = require("../lib/gastos.js");

// --- eliminarGasto ---
function testEliminarGastoReasignaIds() {
  const grupo = crearGrupo("Test", ["Ana", "Luis", "Marta"]);
  agregarGasto(grupo, { concepto: "A", importe: 10, pagadoPor: "Ana" });
  agregarGasto(grupo, { concepto: "B", importe: 20, pagadoPor: "Luis" });
  agregarGasto(grupo, { concepto: "C", importe: 30, pagadoPor: "Marta" });

  eliminarGasto(grupo, 2);

  assert.strictEqual(grupo.gastos.length, 2);
  assert.deepStrictEqual(grupo.gastos.map(function (g) { return g.id; }), [1, 2]);
  assert.deepStrictEqual(grupo.gastos.map(function (g) { return g.concepto; }), ["A", "C"]);
}

function testEliminarGastoInexistenteNoMuta() {
  const grupo = crearGrupo("Test", ["Ana", "Luis"]);
  agregarGasto(grupo, { concepto: "A", importe: 10, pagadoPor: "Ana" });
  eliminarGasto(grupo, 999);
  assert.strictEqual(grupo.gastos.length, 1);
}

function testEliminarGastoRecalculaBalances() {
  const grupo = crearGrupo("Test", ["Ana", "Luis"]);
  agregarGasto(grupo, { concepto: "A", importe: 30, pagadoPor: "Ana" });
  agregarGasto(grupo, { concepto: "B", importe: 10, pagadoPor: "Luis" });

  assert.deepStrictEqual(balances(grupo), { Ana: 10, Luis: -10 });

  eliminarGasto(grupo, 1);

  // After removing Ana's 30€: only Luis's 10€ remains → total=10, cuota=5
  assert.deepStrictEqual(balances(grupo), { Ana: -5, Luis: 5 });
}

// --- entre ---
function testEntreEjemploSpec() {
  const grupo = crearGrupo("Casa Rural", ["Ana", "Luis", "Marta"]);
  agregarGasto(grupo, { concepto: "Taxi", importe: 20, pagadoPor: "Ana", entre: ["Ana", "Luis"] });
  agregarGasto(grupo, { concepto: "Casa", importe: 30, pagadoPor: "Marta" });

  assert.deepStrictEqual(balances(grupo), { Ana: 0, Luis: -20, Marta: 20 });
  assert.deepStrictEqual(liquidacion(grupo), [{ de: "Luis", a: "Marta", importe: 20 }]);
}

function testEntreSoloPagador() {
  const grupo = crearGrupo("Test", ["Ana", "Luis", "Marta"]);
  agregarGasto(grupo, { concepto: "Café", importe: 30, pagadoPor: "Ana", entre: ["Ana"] });
  assert.deepStrictEqual(balances(grupo), { Ana: 0, Luis: 0, Marta: 0 });
  assert.deepStrictEqual(liquidacion(grupo), []);
}

function testEntreInvitacion() {
  const grupo = crearGrupo("Test", ["Ana", "Luis", "Marta"]);
  agregarGasto(grupo, { concepto: "Fiesta", importe: 30, pagadoPor: "Ana", entre: ["Luis"] });
  assert.deepStrictEqual(balances(grupo), { Ana: 30, Luis: -30, Marta: 0 });
  assert.deepStrictEqual(liquidacion(grupo), [{ de: "Luis", a: "Ana", importe: 30 }]);
}

function testEntreNombreNoParticipante() {
  const grupo = crearGrupo("Test", ["Ana", "Luis"]);
  assert.throws(function () {
    agregarGasto(grupo, { concepto: "X", importe: 10, pagadoPor: "Ana", entre: ["Pedro"] });
  }, /entre/);
}

function testEntreDuplicados() {
  const grupo = crearGrupo("Test", ["Ana", "Luis"]);
  assert.throws(function () {
    agregarGasto(grupo, { concepto: "X", importe: 10, pagadoPor: "Ana", entre: ["Ana", "Ana"] });
  }, /duplicados|entre/);
}

function testEntreArrayVacio() {
  const grupo = crearGrupo("Test", ["Ana", "Luis"]);
  assert.throws(function () {
    agregarGasto(grupo, { concepto: "X", importe: 10, pagadoPor: "Ana", entre: [] });
  }, /entre/);
}

function testEntreNoArray() {
  const grupo = crearGrupo("Test", ["Ana", "Luis"]);
  assert.throws(function () {
    agregarGasto(grupo, { concepto: "X", importe: 10, pagadoPor: "Ana", entre: "Ana" });
  }, /entre/);
}

function testEntreSeGuarda() {
  const grupo = crearGrupo("Test", ["Ana", "Luis"]);
  agregarGasto(grupo, { concepto: "X", importe: 10, pagadoPor: "Ana", entre: ["Ana", "Luis"] });
  assert.deepStrictEqual(grupo.gastos[0].entre, ["Ana", "Luis"]);
}

function testSinEntreComportamientoIgual() {
  const grupo = crearGrupo("Test", ["Ana", "Luis", "Marta"]);
  agregarGasto(grupo, { concepto: "Alquiler", importe: 30, pagadoPor: "Ana" });
  // Sin entre → reparto entre todos (3 personas): cuota 10
  assert.deepStrictEqual(balances(grupo), { Ana: 20, Luis: -10, Marta: -10 });
}

function testEntreCombinado() {
  const grupo = crearGrupo("Viaje", ["Ana", "Luis", "Marta"]);
  agregarGasto(grupo, { concepto: "Taxi", importe: 20, pagadoPor: "Ana", entre: ["Ana", "Luis"] });
  agregarGasto(grupo, { concepto: "Cena", importe: 30, pagadoPor: "Marta" });
  agregarGasto(grupo, { concepto: "Café", importe: 6, pagadoPor: "Luis", entre: ["Luis"] });

  // Taxi: Ana 10, Luis 10
  // Cena: 10 cada uno
  // Café: Luis 6
  // Justo: Ana 20, Luis 26, Marta 10
  // Pagado: Ana 20, Luis 6, Marta 30
  assert.deepStrictEqual(balances(grupo), { Ana: 0, Luis: -20, Marta: 20 });
  assert.deepStrictEqual(liquidacion(grupo), [{ de: "Luis", a: "Marta", importe: 20 }]);
}

// --- Runner ---
function main() {
  const tests = [
    testEliminarGastoReasignaIds,
    testEliminarGastoInexistenteNoMuta,
    testEliminarGastoRecalculaBalances,
    testEntreEjemploSpec,
    testEntreSoloPagador,
    testEntreInvitacion,
    testEntreNombreNoParticipante,
    testEntreDuplicados,
    testEntreArrayVacio,
    testEntreNoArray,
    testEntreSeGuarda,
    testSinEntreComportamientoIgual,
    testEntreCombinado
  ];

  let passed = 0;
  tests.forEach(function (test) {
    try {
      test();
      console.log("  OK  " + test.name);
      passed++;
    } catch (e) {
      console.log("  ✗  " + test.name + " → " + e.message);
    }
  });

  console.log("");
  console.log(tests.length + " tests: " + passed + " passed, " + (tests.length - passed) + " failed");
  if (passed !== tests.length) {
    process.exit(1);
  }
}

main();
