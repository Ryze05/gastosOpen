#!/usr/bin/env node
/**
 * bucle-goal.mjs — Bucle de objetivo (goal loop)
 * Curso de IA y VibeCoding · Sesión 5 · Xavi García · Adaptado a reparto de gastos
 *
 * QUÉ HACE
 *   1. Ejecuta el COMANDO DE VERIFICACIÓN.
 *   2. Si devuelve 0 → el objetivo está cumplido → para.
 *   3. Si no → le pasa el objetivo + el error al agente y le pide que lo arregle.
 *   4. Vuelve al paso 1, hasta un máximo de intentos.
 *
 * LA IDEA
 *   El que decide si el objetivo está cumplido NO es la IA: es un comando
 *   que devuelve 0 o distinto de 0. Hechos, no opiniones.
 *
 * USO
 *   node bucle-goal.mjs              → ejecuta el bucle de verdad
 *   node bucle-goal.mjs --seco       → ensayo: enseña qué haría, sin llamar al agente
 *   node bucle-goal.mjs --intentos=3 → cambia el límite de intentos
 *
 * NOTA: la extensión .mjs hace que este fichero funcione dentro de cualquier
 * proyecto, use `require` o `import`. Un problema menos.
 */

import { spawnSync } from "node:child_process";
import { readFileSync, writeFileSync, appendFileSync, existsSync } from "node:fs";

// ─────────────────────────────────────────────────────────────
// 1. CONFIGURACIÓN — lo único que tocas normalmente
// ─────────────────────────────────────────────────────────────

const CONFIG = {
  // Fichero donde está escrito el objetivo (se le manda entero al agente).
  ficheroGoal: "goal.md",

  // EL CRITERIO DE PARADA. Un comando. Devuelve 0 = objetivo cumplido.
  comandoVerificacion: "node tests/run-all.js",

  // Freno de mano: nunca más de N vueltas.
  maxIntentos: 6,

  // Agente de OpenCode que hace el trabajo en cada vuelta.
  agente: "goal",

  // Modelo. null = usa el que tengas configurado en OpenCode (Qwen3 Coder free).
  // Para forzar uno: "openrouter/qwen/qwen3-coder:free" (mira `opencode models openrouter`).
  modelo: null,

  // Registro de lo que pasa en cada vuelta.
  bitacora: "bitacora-bucle.md",

  // Aquí se escribe, en cada vuelta, el encargo exacto que recibe el agente.
  // Ábrelo si quieres ver qué se le está pidiendo de verdad.
  ficheroEncargo: "encargo-vuelta.md",

  // Cuánta salida de error se le manda al agente (caracteres).
  // Los modelos free tienen poco contexto: no le eches el log entero.
  maxCaracteresError: 3000,
};

// ─────────────────────────────────────────────────────────────
// 2. HERRAMIENTAS
// ─────────────────────────────────────────────────────────────

const ES_WINDOWS = process.platform === "win32";

const argumentos = process.argv.slice(2);
const ENSAYO = argumentos.includes("--seco");
const intentosPedidos = argumentos.find((a) => a.startsWith("--intentos="));
const MAX_INTENTOS = intentosPedidos
  ? Number(intentosPedidos.split("=")[1])
  : CONFIG.maxIntentos;

/** Ejecuta un comando de shell y devuelve si fue bien y qué escribió. */
function ejecutar(comando) {
  const resultado = spawnSync(comando, { shell: true, encoding: "utf8" });
  const salida = `${resultado.stdout ?? ""}${resultado.stderr ?? ""}`.trim();
  return { ok: resultado.status === 0, salida };
}

/**
 * Llama a OpenCode.
 *
 * ⚠️ En Windows, `opencode` no es un programa suelto: es un pequeño lanzador
 * (`opencode.cmd`). Node se niega a ejecutar esos ficheros directamente por
 * seguridad, y por eso salía "spawnSync opencode ENOENT" aunque `opencode
 * --version` funcionase perfectamente en la terminal. La solución es pasar
 * por el shell — y entonces los argumentos con espacios hay que entrecomillarlos
 * a mano, porque el shell no lo hace por ti.
 *
 * Por eso el encargo va SIEMPRE en un fichero aparte: un texto de varias líneas
 * no cabe en una línea de comandos de Windows, se escape como se escape.
 */
function llamarAgente(mensajeCorto) {
  const args = ["run", "--agent", CONFIG.agente, "--auto"];
  if (CONFIG.modelo) args.push("--model", CONFIG.modelo);
  args.push(mensajeCorto);

  if (!ES_WINDOWS) {
    return spawnSync("opencode", args, { stdio: "inherit" });
  }

  const linea = args
    .map((a) => (/[\s"]/.test(a) ? `"${a.replace(/"/g, '\\"')}"` : a))
    .join(" ");
  return spawnSync(`opencode ${linea}`, { stdio: "inherit", shell: true });
}

/** Comprueba que OpenCode se puede ejecutar ANTES de empezar. */
function openCodeDisponible() {
  const r = ES_WINDOWS
    ? spawnSync("opencode --version", { shell: true, encoding: "utf8" })
    : spawnSync("opencode", ["--version"], { encoding: "utf8" });
  return r.status === 0;
}

/** Escribe en pantalla y en la bitácora. */
function anotar(texto) {
  console.log(texto);
  appendFileSync(CONFIG.bitacora, `${texto}\n`);
}

/** Recorta un texto largo para no reventar el contexto del modelo. */
function recortar(texto, maximo) {
  if (texto.length <= maximo) return texto;
  return `${texto.slice(0, maximo)}\n\n[...salida recortada, ${texto.length - maximo} caracteres más]`;
}

/** Construye el encargo que recibe el agente en cada vuelta. */
function construirEncargo({ goal, intento, comando, error }) {
  return `# Encargo — vuelta ${intento} de ${MAX_INTENTOS}

Estás dentro de un bucle automático de objetivo.

## OBJETIVO

${goal}

## ESTADO ACTUAL

El criterio de éxito NO se cumple. Este comando ha fallado:

    ${comando}

Su salida ha sido:

\`\`\`
${error}
\`\`\`

## LO QUE TIENES QUE HACER

1. Lee el error y di en UNA frase cuál crees que es la causa.
2. Haz el cambio MÍNIMO en el código que la corrija.
3. Nada más. No refactorices de propina, no toques ficheros que no hagan falta.

## PROHIBIDO

- Modificar, borrar o desactivar los tests. Son el criterio, no el problema.
- Cambiar el comando de verificación.
- Dar por bueno el trabajo sin ejecutar el comando de verificación.
`;
}

// ─────────────────────────────────────────────────────────────
// 3. COMPROBACIONES PREVIAS
// ─────────────────────────────────────────────────────────────

if (!existsSync(CONFIG.ficheroGoal)) {
  console.error(`No encuentro ${CONFIG.ficheroGoal}. Escribe el objetivo antes de lanzar el bucle.`);
  console.error(`¿Estás en la carpeta correcta? Ahora mismo estás en: ${process.cwd()}`);
  process.exit(1);
}

if (!ENSAYO && !openCodeDisponible()) {
  console.error(`\n🛑 No consigo ejecutar OpenCode desde este script.\n`);
  console.error(`Comprueba en esta misma terminal:  opencode --version`);
  console.error(`- Si NO responde: OpenCode no está en el PATH. Abre una terminal nueva o reinstálalo.`);
  console.error(`- Si SÍ responde y aun así ves esto, avísame: es un caso raro y quiero verlo.`);
  process.exit(1);
}

const goal = readFileSync(CONFIG.ficheroGoal, "utf8").trim();

// ─────────────────────────────────────────────────────────────
// 4. EL BUCLE
// ─────────────────────────────────────────────────────────────

anotar(`\n## Bucle lanzado — ${new Date().toLocaleString("es-ES")}`);
anotar(`- Criterio de éxito: \`${CONFIG.comandoVerificacion}\``);
anotar(`- Máximo de intentos: ${MAX_INTENTOS}`);
anotar(`- Sistema: ${ES_WINDOWS ? "Windows (llamo a OpenCode a través del shell)" : process.platform}`);
if (ENSAYO) anotar(`- MODO ENSAYO: no se llamará al agente`);

for (let intento = 1; intento <= MAX_INTENTOS; intento++) {
  // --- Paso 1: MEDIR. El bucle empieza midiendo, no actuando.
  anotar(`\n### Vuelta ${intento} — verificando`);
  const verificacion = ejecutar(CONFIG.comandoVerificacion);

  if (verificacion.ok) {
    anotar(`\n✅ OBJETIVO CUMPLIDO en la vuelta ${intento}.`);
    anotar(`Ahora te toca a ti: \`git diff\` y decidir si esto se queda.`);
    process.exit(0);
  }

  anotar(`❌ Todavía no. Preparando el encargo para el agente @${CONFIG.agente}.`);

  // --- Paso 2: ENCARGAR. El agente recibe objetivo + error real, en un fichero.
  const encargo = construirEncargo({
    goal,
    intento,
    comando: CONFIG.comandoVerificacion,
    error: recortar(verificacion.salida, CONFIG.maxCaracteresError),
  });
  writeFileSync(CONFIG.ficheroEncargo, encargo);

  const mensaje =
    `Vuelta ${intento} de ${MAX_INTENTOS} del bucle de objetivo. ` +
    `Lee el fichero ${CONFIG.ficheroEncargo} y haz exactamente lo que dice.`;

  if (ENSAYO) {
    anotar(`\n[ensayo] Encargo escrito en ${CONFIG.ficheroEncargo} — ábrelo y léelo.`);
    anotar(`[ensayo] Ejecutaría: opencode run --agent ${CONFIG.agente} --auto "${mensaje}"`);
    anotar(`\n[ensayo] Bucle detenido: en ensayo no se modifica nada.`);
    process.exit(0);
  }

  // --- Paso 3: ACTUAR.
  const agente = llamarAgente(mensaje);

  if (agente.error || agente.status === null) {
    anotar(`\n⚠️  No he podido ejecutar OpenCode: ${agente.error?.message ?? "error desconocido"}`);
    anotar(`Prueba en esta terminal: opencode --version`);
    process.exit(1);
  }
}

// --- Se acabaron los intentos: el bucle se rinde, no insiste.
anotar(`\n🛑 ${MAX_INTENTOS} intentos y el criterio sigue sin cumplirse.`);
anotar(`El bucle para aquí a propósito. Un bucle que no sabe rendirse quema tu cuota.`);
anotar(`Siguiente paso: míralo tú. O el objetivo estaba mal escrito, o el problema es más gordo de lo que parecía.`);
process.exit(1);
