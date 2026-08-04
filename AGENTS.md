# AGENTS.md

## Estado del repositorio

- El repositorio solo contiene `SPEC.md` (especificación técnica en español). **No existe código todavía.**
- Único entregable requerido: `lib/gastos.js`, un módulo CommonJS (`module.exports = { ... }`).
- **0 dependencias externas** (solo Node.js/JavaScript estándar). No añadir librerías.
- `SPEC.md` es la fuente de verdad; la sección 5 contiene los casos de aceptación oficiales que sirven de oráculo de pruebas.

## API pública a implementar (según SPEC.md §4)

`crearGrupo(nombre, participantes)`, `agregarGasto(grupo, gasto)`, `totalPorPersona(grupo)`, `balances(grupo)`, `liquidacion(grupo)`, `resumen(grupo)`.

## Gotchas que se suelen pasar por alto

- **Redondeo:** todos los cálculos intermedios (cuotas, sumatorios, iteraciones) deben usar `Number` con precisión completa (sin redondear). **Solo** se redondean los resultados finales devueltos con `Math.round(n * 100) / 100`. Redondear valores intermedios rompe el algoritmo de `liquidacion`.
- **`liquidacion`:** el algoritmo usa los saldos **sin redondear** como entrada. Ignora transferencias con `M <= 0.01` (diferencias de 1 céntimo). Ordena la salida por `importe` descendente y, en caso de empate, alfabéticamente por `de`.
- **Atomicidad:** si `agregarGasto` falla la validación, lanza `Error` y **no debe mutar** el objeto `grupo` (ni asignar `id`). El `id` se asigna como `grupo.gastos.length + 1`.
- **Coincidencia de nombres sensible a mayúsculas/minúsculas:** `"Ana"` y `"ana"` son personas distintas. `pagadoPor` debe coincidir exactamente con un participante.
- **Validaciones `crearGrupo`:** nombre no vacío tras `.trim()`, mínimo 2 participantes, cada nombre no vacío, sin duplicados.
- **Validaciones `agregarGasto`:** `concepto` no vacío tras `.trim()`, `importe` finito y estrictamente `> 0`, `pagadoPor` debe ser un participante exacto.
- **`totalPorPersona` y `balances`:** deben listar a **todos** los participantes (con `0` si no pagaron nada), redondeados a 2 decimales.
- Convención del repositorio: comentarios y mensajes en español; nombres de funciones ya fijados por la spec (no renombrar).

## Verificación

No hay framework de tests ni `package.json` (solo Node estándar). Suite de pruebas en `tests/`:

- `tests/ejemplos.test.js`: casos de aceptación oficiales de SPEC.md §5 (oráculo).
- `tests/validaciones.test.js`: validaciones de `crearGrupo`/`agregarGasto`, atomicidad, ids, sensibilidad a mayúsculas.
- `tests/calculos.test.js`: `totalPorPersona`, `balances`, `resumen` (redondeo, ceros).
- `tests/liquidacion.test.js`: algoritmo greedy (empates, saldos 0, umbral `M <= 0.01`, ordenación).

Comando para ejecutar toda la suite: `node tests/run-all.js`. También pueden ejecutarse archivos sueltos con `node tests/<archivo>.test.js`. Salida 0 y exit code 0 = todo correcto.
