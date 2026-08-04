# Especificación Técnica: Módulo de Reparto de Gastos (`lib/gastos.js`)

## 1. Visión General
El módulo `lib/gastos.js` proporciona la lógica de negocio para la gestión y distribución equitativa de gastos en viajes o eventos grupales. Permite registrar participantes, ingresar gastos individuales, calcular los saldos de cada miembro y generar un plan optimizado de transferencias mínimas para liquidar todas las deudas del grupo.

Está concebido para funcionar como una librería pura en Node.js, integrable en cualquier sistema sin necesidad de base de datos ni interfaz gráfica previa.

---

## 2. Requisitos Técnicos Generales

- **Ubicación del archivo:** `lib/gastos.js`
- **Formato del módulo:** CommonJS (`module.exports = { ... }`).
- **Dependencias:** Ninguna (0 dependencias externas, solo JavaScript estándar / Node.js).
- **Regla de Redondeo Global:**
  - Todos los cálculos intermedios (cuotas, sumatorios, iteraciones del algoritmo) deben mantenerse en precisión de punto flotante de 64 bits (`Number`).
  - Únicamente se redondean los valores devueltos como **resultado final** en las respuestas públicas mediante la fórmula:
    $$\text{Math.round}(n \times 100) / 100$$

---

## 3. Modelo de Datos Interno

### 3.1. Estructura de `Grupo`
```json
{
  "nombre": "Viaje a la Sierra",
  "participantes": ["Ana", "Luis", "Marta"],
  "gastos": [
    {
      "id": 1,
      "concepto": "Gasolina",
      "importe": 30.00,
      "pagadoPor": "Ana"
    }
  ]
}
```

### 3.2. Estructura de `Gasto`
```json
{
  "id": 1,
  "concepto": "Cena de bienvenida",
  "importe": 45.50,
  "pagadoPor": "Luis",
  "entre": ["Ana", "Luis", "Marta"]
}
```

- `entre` es un campo **opcional**. Si no se indica, el gasto se reparte entre **todos** los participantes del grupo.
- Si se indica, el gasto se reparte solo entre las personas listadas en este array.
- El pagador (`pagadoPor`) **no** tiene por qué estar en `entre` (puede invitar a otros).

---

## 4. API Pública (Firmas y Comportamiento)

### 4.1. `crearGrupo(nombre, participantes)`

Inicializa la estructura básica de un nuevo grupo de gastos.

- **Parámetros:**
  - `nombre` (`string`): Nombre representativo del grupo. Debe ser un texto no vacío (tras aplicar `.trim()`).
  - `participantes` (`Array<string>`): Array con los nombres de las personas.
    - Debe contener **al menos 2 participantes**.
    - Cada elemento debe ser una cadena no vacía.
    - **Sin duplicados:** La comprobación es sensible a mayúsculas y minúsculas (`"Ana"` y `"ana"` son personas distintas).
- **Devuelve:** Objeto `Grupo`: `{ nombre, participantes, gastos: [] }`.
- **Manejo de Errores:** Lanza un `Error` si no cumple cualquiera de las condiciones anteriores.

---

### 4.2. `agregarGasto(grupo, gasto)`

Añade un gasto al registro del grupo de forma atómica.

- **Parámetros:**
  - `grupo` (`Object`): Instancia válida de un objeto `Grupo`.
  - `gasto` (`Object`): Objeto con las propiedades `{ concepto, importe, pagadoPor, entre }`:
    - `concepto` (`string`): Texto explicativo no vacío (tras `.trim()`).
    - `importe` (`number`): Número finito **estrictamente mayor que 0** (`importe > 0`).
    - `pagadoPor` (`string`): Debe coincidir exactamente con uno de los miembros listados en `grupo.participantes`.
    - `entre` (`Array<string>`, **opcional**): Lista de participantes entre los que se reparte este gasto.
      - Si no se indica, el gasto se reparte entre **todos** los participantes del grupo.
      - Debe contener al menos un nombre.
      - Todos los nombres deben estar en `grupo.participantes`.
      - Sin duplicados.
      - El pagador **no** tiene por qué estar en `entre`.
- **Comportamiento:**
  - Asigna al nuevo gasto un `id` correlativo incremental comenzando en **1** (`id = grupo.gastos.length + 1`).
  - Si `entre` se indica, el gasto guardado incluye `entre` con esa lista.
  - Añade el objeto al array `grupo.gastos`.
- **Devuelve:** El objeto `grupo` actualizado.
- **Garantía de Inmutabilidad en Fallo:** Si alguna validación falla, debe lanzar un `Error` y **no realizar ninguna modificación** sobre el objeto `grupo` original.

---

### 4.3. `eliminarGasto(grupo, id)`

Elimina un gasto registrado del grupo por su `id`.

- **Parámetros:**
  - `grupo` (`Object`): Instancia válida de un objeto `Grupo`.
  - `id` (`number`): Identificador del gasto a eliminar.
- **Comportamiento:**
  - Busca el gasto con el `id` indicado en `grupo.gastos`.
  - Si existe, lo elimina y **reasigna los `id` correlativos** a partir de 1 para mantener la secuencia.
  - Si no existe, no modifica el grupo.
- **Devuelve:** El objeto `grupo` actualizado.

---

### 4.4. `modificarGasto(grupo, id, gasto)`

Modifica un gasto existente del grupo, identificado por su `id`.

- **Parámetros:**
  - `grupo` (`Object`): Instancia válida de un objeto `Grupo`.
  - `id` (`number`): Identificador del gasto a modificar.
  - `gasto` (`Object`): Objeto con las mismas validaciones que `agregarGasto` (`{ concepto, importe, pagadoPor, entre }`).
- **Comportamiento:**
  - Aplica las mismas validaciones que `agregarGasto`.
  - Busca el gasto con el `id` indicado en `grupo.gastos`.
  - Si existe, reemplaza los campos `concepto`, `importe`, `pagadoPor` y `entre` manteniendo el `id` original.
  - **Si no existe, lanza `Error`.**
- **Devuelve:** El objeto `grupo` actualizado.

---

### 4.5. `totalPorPersona(grupo)`

Calcula el total absoluto que ha pagado cada integrante del grupo.

- **Parámetros:** `grupo` (`Object`).
- **Devuelve:** Objeto `{ [participante: string]: number }`.
  - Debe listar a **todos** los participantes del grupo.
  - Si una persona no ha pagado nada, debe figurar con valor `0`.
  - Todos los importes devueltos se redondean a 2 decimales (`Math.round(n * 100) / 100`).

---

### 4.6. `balances(grupo)`

Calcula el saldo individual neto de cada participante.

- **Parámetros:** `grupo` (`Object`).
- **Fórmulas de Cálculo:**
  - Para cada gasto, la "parte justa" de cada persona que participa en él es:
    $$\text{parte} = \frac{\text{importe del gasto}}{\text{número de personas en } entre}$$
  - Si el gasto no tiene `entre`, se reparte entre **todos** los participantes del grupo.
  - La **cuota justa** de cada persona es la suma de sus partes en cada gasto en el que participa.
  - $$\text{Saldo} = \text{Total Pagado por el Participante} - \text{Cuota Justa}$$
- **Interpretación del resultado:**
  - Saldo positivo (`> 0`): A la persona le deben dinero.
  - Saldo negativo (`< 0`): La persona debe dinero.
- **Devuelve:** Objeto `{ [participante: string]: number }` con los saldos redondeados a 2 decimales.

---

### 4.7. `liquidacion(grupo)`

Calcula el conjunto óptimo (mínimo número) de transferencias necesarias para liquidar todas las deudas.

- **Parámetros:** `grupo` (`Object`).
- **Especificación del Algoritmo (*Greedy* / Ávido):**
  1. Obtener los saldos netos en precisión exacta (sin redondear) para cada participante.
  2. Clasificar a las personas en **Deudores** (saldo negativo) y **Acreedores** (saldo positivo). Omitir saldos en 0.
  3. Iterar mientras existan deudores y acreedores:
     - Identificar al **mayor deudor** (quien tiene la deuda absoluta más grande) y al **mayor acreedor** (quien debe recibir más).
     - Determinar el monto de transferencia: $M = \min(|\text{saldo\_deudor}|, \text{saldo\_acreedor})$.
     - Si $M > 0.01$ (se ignoran diferencias iguales o menores a 1 céntimo), registrar la transacción: `{ de: deudor, a: acreedor, importe: Math.round(M * 100) / 100 }`.
     - Restar $M$ del saldo deudor y acreedor y continuar la iteración.
- **Reglas de Ordenación de Salida:**
  - Ordenar las transacciones de **mayor a menor por el campo `importe`**.
  - Si dos transferencias empatan en `importe`, ordenar alfabéticamente por el campo `de` (nombre del deudor).
- **Devuelve:** Array de transacciones `[ { de, a, importe } ]`. Si nadie se debe nada, devuelve `[]`.

---

### 4.8. `resumen(grupo)`

Genera un informe financiero sintético del grupo.

- **Parámetros:** `grupo` (`Object`).
- **Devuelve:** Objeto `{ total, cuota, numGastos, participantes }`:
  - `total` (`number`): Suma acumulada de todos los gastos (redondeado a 2 decimales).
  - `cuota` (`number`): `total / participantes` (redondeado a 2 decimales).
  - `numGastos` (`number`): Cantidad total de gastos registrados (`grupo.gastos.length`).
  - `participantes` (`number`): Número total de miembros (`grupo.participantes.length`).

---

## 5. Casos de Aceptación Oficiales

### Ejemplo 1: Reparto Exacto
```javascript
const grupo = crearGrupo("Casa Rural", ["Ana", "Luis", "Marta"]);
agregarGasto(grupo, { concepto: "Alquiler", importe: 30, pagadoPor: "Ana" });

balances(grupo);
// Devuelve: { Ana: 20, Luis: -10, Marta: -10 }

liquidacion(grupo);
// Devuelve: [
//   { de: "Luis", a: "Ana", importe: 10 },
//   { de: "Marta", a: "Ana", importe: 10 }
// ]
```

### Ejemplo 2: Reparto con Decimales Repetitivos
```javascript
const grupo = crearGrupo("Viaje", ["Ana", "Luis", "Marta"]);
agregarGasto(grupo, { concepto: "Gasolina", importe: 10, pagadoPor: "Ana" });

balances(grupo);
// Devuelve: { Ana: 6.67, Luis: -3.33, Marta: -3.33 }

liquidacion(grupo);
// Devuelve: [
//   { de: "Luis", a: "Ana", importe: 3.33 },
//   { de: "Marta", a: "Ana", importe: 3.33 }
// ]
```

### Ejemplo 3: Grupo Recién Creado (Sin Gastos)
```javascript
const grupo = crearGrupo("Escapada", ["Ana", "Luis"]);

balances(grupo);     // Devuelve: { Ana: 0, Luis: 0 }
liquidacion(grupo);  // Devuelve: []
resumen(grupo);      // Devuelve: { total: 0, cuota: 0, numGastos: 0, participantes: 2 }
```

### Ejemplo 4: Gasto compartido solo entre algunos (`entre`)
```javascript
const grupo = crearGrupo("Casa Rural", ["Ana", "Luis", "Marta"]);
agregarGasto(grupo, { concepto: "Taxi", importe: 20, pagadoPor: "Ana", entre: ["Ana", "Luis"] });
agregarGasto(grupo, { concepto: "Casa", importe: 30, pagadoPor: "Marta" });

// Taxi: 20/2 = 10 para Ana, 10 para Luis
// Casa: 30/3 = 10 para cada uno (sin 'entre' → todos)
// Justo: Ana 20, Luis 10, Marta 10
// Pagado: Ana 20, Luis 0, Marta 30

balances(grupo);
// Devuelve: { Ana: 0, Luis: -20, Marta: 20 }

liquidacion(grupo);
// Devuelve: [ { de: "Luis", a: "Marta", importe: 20 } ]
```
