# Reparto de Gastos

Módulo en Node.js (CommonJS) para gestionar y distribuir de forma equitativa los gastos de un viaje o evento grupal.

## Funcionalidades

- Registrar participantes y gastos individuales.
- Calcular el total pagado por cada persona (`totalPorPersona`).
- Calcular los saldos netos de cada miembro (`balances`).
- Generar un plan optimizado de transferencias mínimas para saldar las deudas (`liquidacion`).
- Obtener un resumen financiero del grupo (`resumen`).

## API

| Función | Descripción |
| --- | --- |
| `crearGrupo(nombre, participantes)` | Crea un grupo con al menos 2 participantes. |
| `agregarGasto(grupo, gasto)` | Añade un gasto al grupo de forma atómica. |
| `totalPorPersona(grupo)` | Total pagado por cada participante. |
| `balances(grupo)` | Saldo neto (pagado − cuota) por participante. |
| `liquidacion(grupo)` | Transferencias mínimas para liquidar deudas. |
| `resumen(grupo)` | Resumen: total, cuota, nº de gastos y participantes. |

## Uso

```javascript
const { crearGrupo, agregarGasto, balances, liquidacion } = require("./lib/gastos.js");

const grupo = crearGrupo("Casa Rural", ["Ana", "Luis", "Marta"]);
agregarGasto(grupo, { concepto: "Alquiler", importe: 30, pagadoPor: "Ana" });

console.log(balances(grupo));    // { Ana: 20, Luis: -10, Marta: -10 }
console.log(liquidacion(grupo)); // [{ de: "Luis", a: "Ana", importe: 10 }, { de: "Marta", a: "Ana", importe: 10 }]
```

## Tests

Sin dependencias externas. Ejecuta la suite completa con:

```bash
node tests/run-all.js
```

## Requisitos

- Node.js (estándar, sin dependencias externas).