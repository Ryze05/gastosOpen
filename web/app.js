(function () {
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
    if (gasto.entre !== undefined && gasto.entre !== null) {
      if (!Array.isArray(gasto.entre) || gasto.entre.length === 0) {
        throw new Error("El campo 'entre' debe ser un array con al menos un participante.");
      }
      const vistos = new Set();
      for (const p of gasto.entre) {
        if (!esCadenaNoVacia(p)) {
          throw new Error("Los nombres en 'entre' no pueden estar vacíos.");
        }
        if (vistos.has(p)) {
          throw new Error("No se permiten duplicados en 'entre'.");
        }
        vistos.add(p);
      }
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
    if (gasto.entre !== undefined && gasto.entre !== null) {
      for (const p of gasto.entre) {
        if (!grupo.participantes.includes(p)) {
          throw new Error("Todos los nombres en 'entre' deben ser participantes del grupo.");
        }
      }
    }
    const gastoGuardado = {
      id: grupo.gastos.length + 1,
      concepto: gasto.concepto,
      importe: gasto.importe,
      pagadoPor: gasto.pagadoPor
    };
    if (gasto.entre !== undefined && gasto.entre !== null) {
      gastoGuardado.entre = [...gasto.entre];
    }
    grupo.gastos.push(gastoGuardado);
    return grupo;
  }

  function eliminarGasto(grupo, id) {
    const indice = grupo.gastos.findIndex(function (g) {
      return g.id === id;
    });
    if (indice === -1) return grupo;
    grupo.gastos.splice(indice, 1);
    for (let i = 0; i < grupo.gastos.length; i++) {
      grupo.gastos[i].id = i + 1;
    }
    return grupo;
  }

  function modificarGasto(grupo, id, gasto) {
    const indice = grupo.gastos.findIndex(function (g) {
      return g.id === id;
    });
    if (indice === -1) return grupo;
    const idOriginal = grupo.gastos[indice].id;
    const gastoGuardado = {
      id: idOriginal,
      concepto: gasto.concepto,
      importe: gasto.importe,
      pagadoPor: gasto.pagadoPor
    };
    if (gasto.entre !== undefined && gasto.entre !== null) {
      gastoGuardado.entre = [...gasto.entre];
    } else {
      delete gastoGuardado.entre;
    }
    grupo.gastos[indice] = gastoGuardado;
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
    const justas = {};
    for (const p of grupo.participantes) {
      totales[p] = 0;
      justas[p] = 0;
    }
    for (const g of grupo.gastos) {
      totales[g.pagadoPor] += g.importe;
      const sharing = (g.entre && g.entre.length > 0) ? g.entre : grupo.participantes;
      const share = g.importe / sharing.length;
      for (const p of sharing) {
        justas[p] += share;
      }
    }
    const saldos = {};
    for (const p of grupo.participantes) {
      saldos[p] = redondear(totales[p] - justas[p]);
    }
    return saldos;
  }

  function liquidacion(grupo) {
    const totales = {};
    const justas = {};
    for (const p of grupo.participantes) {
      totales[p] = 0;
      justas[p] = 0;
    }
    for (const g of grupo.gastos) {
      totales[g.pagadoPor] += g.importe;
      const sharing = (g.entre && g.entre.length > 0) ? g.entre : grupo.participantes;
      const share = g.importe / sharing.length;
      for (const p of sharing) {
        justas[p] += share;
      }
    }

    const deudores = [];
    const acreedores = [];
    for (const p of grupo.participantes) {
      const saldo = redondear(totales[p] - justas[p]);
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

  const $ = (sel) => document.querySelector(sel);
  const money = (n) => new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(n);

  function escapeHtml(texto) {
    const div = document.createElement("div");
    div.textContent = texto;
    return div.innerHTML;
  }

  function mostrarError(el, mensaje) {
    el.textContent = mensaje;
    el.hidden = false;
  }

  function ocultarError(el) {
    el.hidden = true;
  }

  function crearVacio(texto) {
    const div = document.createElement("div");
    div.className = "vacio";
    div.textContent = texto;
    return div;
  }

  const STORAGE_KEY = "gastos-ui-grupo";

  let grupo = null;
  let participantesPendientes = [];
  let gastoEditandoId = null;

  const THEME_KEY = "gastos-ui-tema";

  function aplicarTema(tema) {
    document.documentElement.setAttribute("data-theme", tema);
    const icono = $("#theme-icon");
    if (icono) {
      icono.textContent = tema === "dark" ? "☀️" : "🌙";
    }
  }

  function alternarTema() {
    const temaActual = document.documentElement.getAttribute("data-theme") || "light";
    const nuevoTema = temaActual === "dark" ? "light" : "dark";
    aplicarTema(nuevoTema);
    try {
      localStorage.setItem(THEME_KEY, nuevoTema);
    } catch (e) {
    }
  }

  function iniciarTema() {
    let tema = "light";
    try {
      const guardado = localStorage.getItem(THEME_KEY);
      if (guardado === "light" || guardado === "dark") {
        tema = guardado;
      } else if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
        tema = "dark";
      }
    } catch (e) {
    }
    aplicarTema(tema);
  }

  $("#theme-toggle").addEventListener("click", alternarTema);

  function guardar() {
    if (grupo) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(grupo));
      } catch (e) {
      }
    }
  }

  function restaurar() {
    try {
      const crudo = localStorage.getItem(STORAGE_KEY);
      if (!crudo) return;
      const dato = JSON.parse(crudo);
      if (dato && Array.isArray(dato.participantes) && Array.isArray(dato.gastos) && esCadenaNoVacia(dato.nombre)) {
        grupo = dato;
      }
    } catch (e) {
    }
  }

  function render() {
    if (grupo) {
      renderPanelApp();
    }
  }

  function renderPanelApp() {
    const r = resumen(grupo);
    const totales = totalPorPersona(grupo);
    const saldos = balances(grupo);
    const trans = liquidacion(grupo);

    $("#titulo-grupo").textContent = grupo.nombre;
    $("#subtitulo-grupo").textContent = grupo.participantes.length + " participantes · " + grupo.gastos.length + " gastos";

    $("#stats").innerHTML = [
      { valor: money(r.total), etiqueta: "Total gastado" },
      { valor: money(r.cuota), etiqueta: "Cuota por persona" },
      { valor: String(r.numGastos), etiqueta: "Gastos" },
      { valor: String(r.participantes), etiqueta: "Participantes" }
    ]
      .map(function (s) {
        return '<div class="stat"><div class="stat-value">' + escapeHtml(s.valor) + '</div><div class="stat-label">' + s.etiqueta + "</div></div>";
      })
      .join("");

    const select = $("#gasto-pagado");
    select.innerHTML = grupo.participantes
      .map(function (p) {
        return '<option value="' + escapeHtml(p) + '">' + escapeHtml(p) + "</option>";
      })
      .join("");

    renderEntreChecks();
    renderGastos();
    renderTotales(totales);
    renderBalances(saldos);
    renderLiquidacion(trans);
  }

  function renderEntreChecks() {
    const cont = $("#entre-checks");
    cont.innerHTML = "";
    if (!grupo) return;
    for (const p of grupo.participantes) {
      const label = document.createElement("label");
      label.className = "entre-check checked";

      const input = document.createElement("input");
      input.type = "checkbox";
      input.checked = true;
      input.value = p;
      input.addEventListener("change", function () {
        label.classList.toggle("checked", input.checked);
      });

      label.appendChild(input);
      label.appendChild(document.createTextNode(p));
      cont.appendChild(label);
    }
  }

  function getEntreSeleccionados() {
    const checks = $("#entre-checks").querySelectorAll("input[type=checkbox]");
    const seleccionados = [];
    checks.forEach(function (cb) {
      if (cb.checked) {
        seleccionados.push(cb.value);
      }
    });
    return seleccionados;
  }

  function cargarGastoParaEditar(g) {
    gastoEditandoId = g.id;
    $("#gasto-concepto").value = g.concepto || "";
    $("#gasto-importe").value = g.importe != null ? String(g.importe) : "";
    $("#gasto-pagado").value = g.pagadoPor || "";
    actualizarEntreChecks(g.entre || null);
    $("#err-gasto").hidden = true;
    $("#err-entre").hidden = true;
    renderBotonCancelar();
  }

  function limpiarFormularioGasto() {
    gastoEditandoId = null;
    $("#gasto-concepto").value = "";
    $("#gasto-importe").value = "";
    $("#gasto-pagado").value = "";
    renderEntreChecks();
    $("#err-gasto").hidden = true;
    $("#err-entre").hidden = true;
    quitarbotonCancelar();
  }

  function actualizarEntreChecks(entre) {
    const checks = $("#entre-checks").querySelectorAll("input[type=checkbox]");
    checks.forEach(function (cb) {
      if (!entre) {
        cb.checked = true;
      } else {
        cb.checked = entre.includes(cb.value);
      }
      const label = cb.closest(".entre-check");
      if (label) {
        label.classList.toggle("checked", cb.checked);
      }
    });
  }

  function renderBotonCancelar() {
    if (!$("#gasto-cancelar")) {
      const cont = document.createElement("div");
      cont.className = "gasto-cancelar-cont";
      const btn = document.createElement("button");
      btn.type = "button";
      btn.id = "gasto-cancelar";
      btn.className = "btn ghost";
      btn.textContent = "Cancelar edición";
      btn.addEventListener("click", function () {
        limpiarFormularioGasto();
      });
      cont.appendChild(btn);
      $("#form-gasto").appendChild(cont);
    }
  }

  function quitarbotonCancelar() {
    const cont = $(".gasto-cancelar-cont");
    if (cont) {
      cont.remove();
    }
  }

  function renderGastos() {
    const cont = $("#lista-gastos");
    cont.innerHTML = "";
    if (grupo.gastos.length === 0) {
      cont.appendChild(crearVacio("Todavía no hay gastos. ¡Añade el primero!"));
      return;
    }
    for (const g of grupo.gastos) {
      const item = document.createElement("div");
      item.className = "gasto-item";

      const id = document.createElement("span");
      id.className = "gasto-id";
      id.textContent = g.id;

      const info = document.createElement("div");
      info.className = "gasto-info";
      const concepto = document.createElement("div");
      concepto.className = "gasto-concepto";
      concepto.textContent = g.concepto;
      const quien = document.createElement("div");
      quien.className = "gasto-quien";
      quien.textContent = "Pagado por " + g.pagadoPor;
      info.appendChild(concepto);
      info.appendChild(quien);

      if (g.entre && g.entre.length > 0) {
        const entre = document.createElement("div");
        entre.className = "gasto-entre";
        entre.textContent = "Entre: " + g.entre.join(", ");
        info.appendChild(entre);
      }

      const importe = document.createElement("span");
      importe.className = "gasto-importe";
      importe.textContent = money(g.importe);

      const btnEliminar = document.createElement("button");
      btnEliminar.type = "button";
      btnEliminar.className = "gasto-borrar";
      btnEliminar.setAttribute("aria-label", "Borrar gasto " + g.id);
      btnEliminar.innerHTML = "×";
      btnEliminar.title = "Borrar gasto";
      btnEliminar.addEventListener("click", function () {
        if (confirm("¿Estás seguro de que quieres borrar el gasto \"" + g.concepto + "\" (" + money(g.importe) + ")?")) {
          eliminarGasto(grupo, g.id);
          guardar();
          render();
        }
      });

      const btnEditar = document.createElement("button");
      btnEditar.type = "button";
      btnEditar.className = "gasto-editar";
      btnEditar.setAttribute("aria-label", "Editar gasto " + g.id);
      btnEditar.innerHTML = "✎";
      btnEditar.title = "Editar gasto";
      btnEditar.addEventListener("click", function () {
        cargarGastoParaEditar(g);
      });

      item.appendChild(id);
      item.appendChild(info);
      item.appendChild(importe);
      item.appendChild(btnEditar);
      item.appendChild(btnEliminar);
      cont.appendChild(item);
    }
  }

  function renderTotales(totales) {
    const cont = $("#totales");
    cont.innerHTML = "";
    if (grupo.gastos.length === 0) {
      cont.appendChild(crearVacio("Sin datos todavía."));
      return;
    }
    const maximo = Math.max.apply(null, Object.values(totales).map(Math.abs)) || 1;
    for (const p of grupo.participantes) {
      const valor = totales[p];
      const row = document.createElement("div");
      row.className = "row";

      const nombre = document.createElement("span");
      nombre.className = "row-name";
      nombre.textContent = p;

      const der = document.createElement("div");
      der.style.width = "55%";
      const barra = document.createElement("div");
      barra.className = "barra";
      const relleno = document.createElement("span");
      relleno.style.width = Math.max(4, (valor / maximo) * 100) + "%";
      barra.appendChild(relleno);
      der.appendChild(barra);

      const valorEl = document.createElement("span");
      valorEl.className = "row-value";
      valorEl.textContent = money(valor);

      row.appendChild(nombre);
      row.appendChild(der);
      row.appendChild(valorEl);
      cont.appendChild(row);
    }
  }

  function renderBalances(saldos) {
    const cont = $("#balances");
    cont.innerHTML = "";
    if (grupo.gastos.length === 0) {
      cont.appendChild(crearVacio("Sin datos todavía."));
      return;
    }
    for (const p of grupo.participantes) {
      const v = saldos[p];
      const row = document.createElement("div");
      row.className = "row";

      const nombre = document.createElement("span");
      nombre.className = "row-name";
      nombre.textContent = p;

      const valor = document.createElement("span");
      valor.className = "row-value " + (v > 0.005 ? "pos" : v < -0.005 ? "neg" : "zero");
      valor.textContent = (v >= 0 ? "+" : "") + money(v);

      row.appendChild(nombre);
      row.appendChild(valor);
      cont.appendChild(row);
    }
  }

  function renderLiquidacion(trans) {
    const cont = $("#liquidacion");
    cont.innerHTML = "";
    if (trans.length === 0) {
      cont.appendChild(crearVacio("Nadie debe nada. Estáis en paz."));
      return;
    }
    for (const t of trans) {
      const item = document.createElement("div");
      item.className = "transferencia";

      const quien = document.createElement("span");
      quien.className = "quien";
      quien.innerHTML = escapeHtml(t.de) + ' <span class="flecha">&rarr;</span> ' + escapeHtml(t.a);

      const importe = document.createElement("span");
      importe.className = "importe";
      importe.textContent = money(t.importe);

      item.appendChild(quien);
      item.appendChild(importe);
      cont.appendChild(item);
    }
  }

  function renderChips() {
    const cont = $("#chips");
    cont.innerHTML = "";
    for (const p of participantesPendientes) {
      const chip = document.createElement("span");
      chip.className = "chip";
      chip.textContent = p;

      const btn = document.createElement("button");
      btn.type = "button";
      btn.setAttribute("aria-label", "Quitar a " + p);
      btn.textContent = "\u00d7";
      btn.addEventListener("click", function () {
        participantesPendientes = participantesPendientes.filter(function (x) {
          return x !== p;
        });
        renderChips();
      });

      chip.appendChild(btn);
      cont.appendChild(chip);
    }
  }

  function activarApp() {
    $("#panel-crear").hidden = true;
    $("#panel-app").hidden = false;
    $("#btn-nuevo").hidden = false;
    render();
  }

  function reiniciar() {
    grupo = null;
    participantesPendientes = [];
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
    }
    $("#form-crear").reset();
    $("#form-gasto").reset();
    $("#panel-crear").hidden = false;
    $("#panel-app").hidden = true;
    $("#btn-nuevo").hidden = true;
    renderChips();
    ocultarError($("#err-participantes"));
  }

  $("#input-participante").addEventListener("keydown", function (e) {
    if (e.key === "Enter") {
      e.preventDefault();
      const valor = this.value.trim();
      if (valor === "") return;
      if (participantesPendientes.includes(valor)) {
        mostrarError($("#err-participantes"), "Ese participante ya está en la lista.");
        return;
      }
      ocultarError($("#err-participantes"));
      participantesPendientes.push(valor);
      this.value = "";
      renderChips();
    }
  });

  $("#form-crear").addEventListener("submit", function (e) {
    e.preventDefault();
    const nombre = $("#nombre-grupo").value.trim();
    try {
      grupo = crearGrupo(nombre, participantesPendientes);
    } catch (err) {
      mostrarError($("#err-participantes"), err.message);
      return;
    }
    guardar();
    activarApp();
  });

  $("#btn-demo").addEventListener("click", function () {
    grupo = crearGrupo("Casa Rural", ["Ana", "Luis", "Marta"]);
    agregarGasto(grupo, { concepto: "Alquiler", importe: 90, pagadoPor: "Ana" });
    agregarGasto(grupo, { concepto: "Cena", importe: 45, pagadoPor: "Luis" });
    agregarGasto(grupo, { concepto: "Gasolina", importe: 30, pagadoPor: "Marta" });
    guardar();
    activarApp();
  });

  $("#form-gasto").addEventListener("submit", function (e) {
    e.preventDefault();
    const concepto = $("#gasto-concepto").value.trim();
    const importe = parseFloat($("#gasto-importe").value);
    const pagadoPor = $("#gasto-pagado").value;
    const entre = getEntreSeleccionados();

    try {
      if (gastoEditandoId !== null) {
        modificarGasto(grupo, gastoEditandoId, { concepto: concepto, importe: importe, pagadoPor: pagadoPor, entre: entre });
      } else {
        agregarGasto(grupo, { concepto: concepto, importe: importe, pagadoPor: pagadoPor, entre: entre });
      }
    } catch (err) {
      mostrarError($("#err-gasto"), err.message);
      return;
    }
    ocultarError($("#err-gasto"));
    ocultarError($("#err-entre"));
    limpiarFormularioGasto();
    guardar();
    render();
  });

  $("#btn-nuevo").addEventListener("click", reiniciar);

  restaurar();
  renderChips();
  iniciarTema();
  if (grupo) {
    activarApp();
  }
})();