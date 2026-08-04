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
