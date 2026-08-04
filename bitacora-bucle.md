## Bucle lanzado — 4/8/2026, 12:00:00
- Criterio de éxito: `node tests/run-all.js`
- Máximo de intentos: 6
- MODO ENSAYO: no se llamará al agente

### Vuelta 1 — verificando
❌ Todavía no. Mandando el error al agente @goal.

[ensayo] Ejecutaría: opencode run --agent goal --auto "<prompt>"
[ensayo] El prompt empezaría así:
Estás dentro de un bucle automático de objetivo. Vuelta 1 de 6.

## OBJETIVO
# Objetivo del bucle — Módulo de reparto de gastos

## Meta

Construir desde cero el módulo de lógica de una aplicación de **reparto de gastos**
grupales: registrar participantes y gastos, calcular el total pagado por cada persona,
obtener los saldos netos y generar un plan optimizado de transferencias mínimas para
liquidar todas las deudas del grupo.

## Criterio de éxito

```
node tests/run-all.js
```

devuelve 0. Los 34 tests de `tests/` en verde (`ejemplos`, `validaciones`, `calculos`
y `liquidacion`).

## Contexto

- **El fichero `lib/gastos.js` no existe todavía.** Hay que crearlo.
- Los tests dicen exactamente qué funciones tiene que exportar y cómo se comportan.
  **Léelos: son la especificación.** No hay ninguna otra fuente de verdad.
- Proyecto sin dependencias: solo Node estándar. No hay servidor ni base de datos.
- Los datos son un objeto `Grupo` (`{ nombre, participantes, gastos }`) que se pasa
  a cada función.
- Los importes se redondean solo en los resultados finales con `Math.round(n * 100) / 100`.

## Restricciones

- **No se tocan los tests.** Ni una línea. Son el criterio de éxito.
- No añadas dependencias: `npm install` está prohibido.
- **Funciones puras:** ninguna función modifica el array que recibe (salvo
  `agregarGasto`, que muta el grupo por diseño). El resto devuelve objetos/arrays nuevos.
- Nada de clases ni de TypeScript: funciones y `module.exports`, como en clase.
- Los errores se lanzan con `throw new Error("mensaje")`, y el mensaje tiene que contener
  la palabra que el test espera (míralo en los `assert.throws`).

## Límite

6 intentos. Si a la sexta sigue en rojo, el bucle para y lo miro yo.

## Si el bucle no lo consigue

1. Abre `bitacora-bucle.md` y mira si el agente estaba repitiendo la misma hipótesis.
2. Mira qué tests fallan: si son siempre los mismos dos, el problema está acotado.
3. Puedes relanzarlo — pero solo después de haber mejorado el objetivo, no "a ver si suena".

[ensayo] Bucle detenido: en ensayo no se modifica nada.
## Bucle lanzado — 4/8/2026, 10:32:20
- Criterio de éxito: `node tests/run-all.js`
- Máximo de intentos: 6
- Sistema: Windows (llamo a OpenCode a través del shell)
- MODO ENSAYO: no se llamará al agente

### Vuelta 1 — verificando

✅ OBJETIVO CUMPLIDO en la vuelta 1.
Ahora te toca a ti: `git diff` y decidir si esto se queda.

## Bucle lanzado — 4/8/2026, 10:34:06
- Criterio de éxito: `node tests/run-all.js`
- Máximo de intentos: 6
- Sistema: Windows (llamo a OpenCode a través del shell)

### Vuelta 1 — verificando

✅ OBJETIVO CUMPLIDO en la vuelta 1.
Ahora te toca a ti: `git diff` y decidir si esto se queda.

## Bucle lanzado — 4/8/2026, 10:54:04
- Criterio de éxito: `node tests/run-all.js`
- Máximo de intentos: 6
- Sistema: Windows (llamo a OpenCode a través del shell)

### Vuelta 1 — verificando

✅ OBJETIVO CUMPLIDO en la vuelta 1.
Ahora te toca a ti: `git diff` y decidir si esto se queda.

## Bucle lanzado — 4/8/2026, 10:54:34
- Criterio de éxito: `node tests/run-all.js`
- Máximo de intentos: 6
- Sistema: Windows (llamo a OpenCode a través del shell)

### Vuelta 1 — verificando

✅ OBJETIVO CUMPLIDO en la vuelta 1.
Ahora te toca a ti: `git diff` y decidir si esto se queda.
