"use strict";

function redondear(n) {
  return Math.round(n * 100) / 100;
}

function esCadenaNoVacia(valor) {
  return typeof valor === "string" && valor.trim() !== "";
}

function validarNombre(nombre) {
  if (!esCadenaNoVacia(nombre)) {
    throw new Error("El nombre del grupo no puede estar vacío.");
  }
}

function validarParticipantes(participantes) {
  if (!Array.isArray(participantes) || participantes.length < 2) {
    throw new Error("El grupo debe tener al menos 2 participantes.");
  }
  const vistos = new Set();
  for (const p of participantes) {
    if (!esCadenaNoVacia(p)) {
      throw new Error("Los nombres de los participantes no pueden estar vacíos.");
    }
    if (vistos.has(p)) {
      throw new Error("No se permiten participantes duplicados.");
    }
    vistos.add(p);
  }
}

function validarGasto(gasto) {
  if (typeof gasto !== "object" || gasto === null) {
    throw new Error("El gasto no es válido.");
  }
  if (!esCadenaNoVacia(gasto.concepto)) {
    throw new Error("El concepto del gasto no puede estar vacío.");
  }
  if (typeof gasto.importe !== "number" || !Number.isFinite(gasto.importe) || gasto.importe <= 0) {
    throw new Error("El importe del gasto debe ser un número finito mayor que 0.");
  }
  if (!esCadenaNoVacia(gasto.pagadoPor)) {
    throw new Error("El campo pagadoPor es obligatorio.");
  }
}

function crearGrupo(nombre, participantes) {
  validarNombre(nombre);
  validarParticipantes(participantes);
  return {
    nombre,
    participantes: [...participantes],
    gastos: []
  };
}

function agregarGasto(grupo, gasto) {
  validarGasto(gasto);
  if (!Array.isArray(grupo.participantes) || !grupo.participantes.includes(gasto.pagadoPor)) {
    throw new Error("El gasto debe ser pagado por un participante del grupo.");
  }
  grupo.gastos.push({
    id: grupo.gastos.length + 1,
    concepto: gasto.concepto,
    importe: gasto.importe,
    pagadoPor: gasto.pagadoPor
  });
  return grupo;
}

function totalPorPersona(grupo) {
  const totales = {};
  for (const p of grupo.participantes) {
    totales[p] = 0;
  }
  for (const g of grupo.gastos) {
    totales[g.pagadoPor] += g.importe;
  }
  for (const p of Object.keys(totales)) {
    totales[p] = redondear(totales[p]);
  }
  return totales;
}

function balances(grupo) {
  const totales = {};
  for (const p of grupo.participantes) {
    totales[p] = 0;
  }
  let suma = 0;
  for (const g of grupo.gastos) {
    totales[g.pagadoPor] += g.importe;
    suma += g.importe;
  }
  const cuota = suma / grupo.participantes.length;
  const saldos = {};
  for (const p of grupo.participantes) {
    saldos[p] = redondear(totales[p] - cuota);
  }
  return saldos;
}

function liquidacion(grupo) {
  const totales = {};
  for (const p of grupo.participantes) {
    totales[p] = 0;
  }
  let suma = 0;
  for (const g of grupo.gastos) {
    totales[g.pagadoPor] += g.importe;
    suma += g.importe;
  }
  const cuota = suma / grupo.participantes.length;

  const deudores = [];
  const acreedores = [];
  for (const p of grupo.participantes) {
    const saldo = totales[p] - cuota;
    if (saldo < 0) {
      deudores.push({ nombre: p, saldo });
    } else if (saldo > 0) {
      acreedores.push({ nombre: p, saldo });
    }
  }

  const transacciones = [];
  while (deudores.length > 0 && acreedores.length > 0) {
    let iMaxDeudor = 0;
    for (let i = 1; i < deudores.length; i++) {
      if (Math.abs(deudores[i].saldo) > Math.abs(deudores[iMaxDeudor].saldo)) {
        iMaxDeudor = i;
      }
    }
    let iMaxAcreedor = 0;
    for (let i = 1; i < acreedores.length; i++) {
      if (acreedores[i].saldo > acreedores[iMaxAcreedor].saldo) {
        iMaxAcreedor = i;
      }
    }
    const deudor = deudores[iMaxDeudor];
    const acreedor = acreedores[iMaxAcreedor];
    const M = Math.min(Math.abs(deudor.saldo), acreedor.saldo);
    if (M > 0.01) {
      transacciones.push({ de: deudor.nombre, a: acreedor.nombre, importe: redondear(M) });
    }
    deudor.saldo += M;
    acreedor.saldo -= M;
    if (Math.abs(deudor.saldo) <= 0.01) {
      deudores.splice(iMaxDeudor, 1);
    }
    if (Math.abs(acreedor.saldo) <= 0.01) {
      acreedores.splice(iMaxAcreedor, 1);
    }
  }

  transacciones.sort((a, b) => b.importe - a.importe || a.de.localeCompare(b.de));
  return transacciones;
}

function resumen(grupo) {
  let total = 0;
  for (const g of grupo.gastos) {
    total += g.importe;
  }
  return {
    total: redondear(total),
    cuota: redondear(total / grupo.participantes.length),
    numGastos: grupo.gastos.length,
    participantes: grupo.participantes.length
  };
}

module.exports = {
  crearGrupo,
  agregarGasto,
  totalPorPersona,
  balances,
  liquidacion,
  resumen
};
