# Reparto de Gastos

Módulo en Node.js (CommonJS) para gestionar y distribuir de forma equitativa los gastos de un viaje o evento grupal. Incluye una interfaz web para uso visual.

## Funcionalidades

- Registrar participantes y gastos individuales.
- Repartir gastos entre todos o un subconjunto de participantes (`entre`).
- Editar y eliminar gastos con reasignación automática de IDs.
- Calcular el total pagado por cada persona (`totalPorPersona`).
- Calcular los saldos netos de cada miembro (`balances`).
- Generar un plan optimizado de transferencias mínimas para saldar las deudas (`liquidacion`).
- Obtener un resumen financiero del grupo (`resumen`).
- Tema claro/oscuro con persistencia en `localStorage`.
- Persistencia automática del grupo en `localStorage`.
- Modo demo con datos de ejemplo.

## API

| Función | Descripción |
| --- | --- |
| `crearGrupo(nombre, participantes)` | Crea un grupo con al menos 2 participantes. |
| `agregarGasto(grupo, gasto)` | Añade un gasto al grupo de forma atómica. Soporta `entre` para repartir entre un subconjunto. |
| `eliminarGasto(grupo, id)` | Elimina un gasto por su `id` y reasigna los ids correlativos. |
| `modificarGasto(grupo, id, gasto)` | Modifica un gasto existente por su `id`; lanza Error si no existe. |
| `totalPorPersona(grupo)` | Total pagado por cada participante. |
| `balances(grupo)` | Saldo neto (pagado − cuota) por participante. |
| `liquidacion(grupo)` | Transferencias mínimas para liquidar deudas. |
| `resumen(grupo)` | Resumen: total, cuota, nº de gastos y participantes. |

## Uso del módulo

```javascript
const { crearGrupo, agregarGasto, balances, liquidacion } = require("./lib/gastos.js");

const grupo = crearGrupo("Casa Rural", ["Ana", "Luis", "Marta"]);
agregarGasto(grupo, { concepto: "Alquiler", importe: 30, pagadoPor: "Ana" });
agregarGasto(grupo, { concepto: "Taxi", importe: 20, pagadoPor: "Ana", entre: ["Ana", "Luis"] });

console.log(balances(grupo));    // { Ana: 0, Luis: -20, Marta: 20 }
console.log(liquidacion(grupo)); // [{ de: "Luis", a: "Marta", importe: 20 }]
```

## Interfaz Web

Abre `web/index.html` en un navegador para usar la interfaz visual.

### Características de la UI

- **Crear grupo:** nombre + participantes (pulsando Enter para añadir cada uno).
- **Añadir gastos:** concepto, importe, pagado por y checkboxes para seleccionar entre quién se reparte.
- **Editar gastos:** botón ✎ en cada gasto para modificar sus campos.
- **Eliminar gastos:** botón × con confirmación.
- **Panel de stats:** total gastado, cuota por persona, nº de gastos y participantes.
- **Totales por persona:** barras de progreso con el total pagado por cada uno.
- **Balances:** saldo neto de cada participante (verde = le deben, rojo = debe).
- **Liquidación:** plan de transferencias óptimas para saldar deudas.
- **Tema oscuro:** botón 🌙/☀️ en la barra superior.
- **Persistencia:** el grupo se guarda automáticamente en `localStorage`.
- **Nuevo grupo:** botón para reiniciar y crear un grupo nuevo.

## Estructura

```
├── lib/
│   └── gastos.js          # Módulo CommonJS (API pública)
├── web/
│   ├── index.html          # Interfaz web
│   ├── styles.css          # Estilos (tema claro/oscuro)
│   └── app.js              # Lógica de la UI
├── tests/
│   ├── run-all.js          # Ejecutor de la suite
│   ├── ejemplos.test.js    # Casos de aceptación de SPEC.md
│   ├── validaciones.test.js # Validaciones y atomicidad
│   ├── calculos.test.js    # totalPorPersona, balances, resumen
│   ├── liquidacion.test.js # Algoritmo greedy
│   └── entre.test.js       # Campo entre, eliminar, modificar
└── SPEC.md                 # Especificación técnica
```

## Tests

Sin dependencias externas. Ejecuta la suite completa con:

```bash
node tests/run-all.js
```

## Requisitos

- Node.js (estándar, sin dependencias externas).
- Naveador web moderno (para la interfaz visual).
