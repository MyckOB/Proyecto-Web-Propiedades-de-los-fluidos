/* ---------- RESPUESTAS CORRECTAS ---------- */
const respuestasCorrectas = {
  ej1: [100, 100, 0.5],        // a,b,c
  viscosidad: [3.27],         // Ej 2
  ej3: [6.136e-6],              // Ej 3
  tension: [2.94],            // Ej 4
  ej5: [0.05190, 0.03670],    // a,b
  ej6: [0.734],               // Ej 6
  presion: [199400],          // Ej 7
  ej8: [40024.8],             // Ej 8
  ej9: [12],                  // Ej 9
  ej10: [49050, 49050, 3.333] // a,b,c
};

/* ---------- UMBRALES ERROR RELATIVO ---------- */
function colorErrorRelativo(error) {
  if (error <= 5) return "verde";
  if (error <= 10) return "amarillo";
  return "rojo";
}

/* ---------- UTILIDADES ---------- */
function parsearNumero(texto) {
  texto = String(texto || "").trim().replace(",", ".");
  return Number(texto);
}
function fechaHoraLocal() {
  return new Date().toLocaleString("es-CO");
}

/* ---------- STORAGE ---------- */
function inicializarAlmacenamiento() {
  Object.keys(respuestasCorrectas).forEach(id => {
    if (!localStorage.getItem(`stats_${id}`)) {
      localStorage.setItem(`stats_${id}`, JSON.stringify({
        participantes: 0,
        conteo: { verde: 0, amarillo: 0, rojo: 0 }
      }));
    }
    if (!localStorage.getItem(`registro_${id}`)) {
      localStorage.setItem(`registro_${id}`, JSON.stringify([]));
    }
  });
}

/* ---------- VALIDACIÓN GENERAL ---------- */

function validarEjercicio(id) {

    const correctas = respuestasCorrectas[id];
    const valoresUsuario = [];
    const errores = [];
    const coloresCampo = [];

    // Crear mensajes debajo de cada input si no existen
    correctas.forEach((_, i) => {
        let msgId = `msg-${id}-${i}`;
        if (!document.getElementById(msgId)) {
            const campo = document.getElementById(`entrada-${id}-${i}`);
            const div = document.createElement("div");
            div.id = msgId;
            div.className = "mensaje-campo";
            campo.insertAdjacentElement("afterend", div);
        }
    });

    // Validación individual por campo
    correctas.forEach((valorCorrecto, i) => {
        const campo = document.getElementById(`entrada-${id}-${i}`);
        const valor = parsearNumero(campo.value);

        valoresUsuario.push(valor);

        const msg = document.getElementById(`msg-${id}-${i}`);

        if (isNaN(valor)) {
            msg.innerHTML = `<span class="msg-rojo">❌ Valor no válido</span>`;
            errores.push(999);
            coloresCampo.push("rojo");
            return;
        }

        let errorRel = Math.abs((valor - valorCorrecto) / valorCorrecto) * 100;
        errores.push(errorRel);

        const color = colorErrorRelativo(errorRel);
        coloresCampo.push(color);

        if (color === "verde") {
            msg.innerHTML = `<span class="msg-verde">✔ Correcto</span>`;
        } else if (color === "amarillo") {
            msg.innerHTML = `<span class="msg-amarillo">⚠ Cerca. Revisa decimales.</span>`;
        } else {
            msg.innerHTML = `<span class="msg-rojo">❌ Incorrecto</span>`;
        }
    });

    /* ================================
       BORRAR MENSAJES AUTOMÁTICAMENTE
       ================================ */
    setTimeout(() => {
        correctas.forEach((_, j) => {
            const msg = document.getElementById(`msg-${id}-${j}`);
            if (msg) msg.innerHTML = "";
        });
    }, 15000); // 15 segundos

    // ---------------- SEMÁFORO GLOBAL ----------------
    const errorFinal = Math.max(...errores);
    const colorFinal = colorErrorRelativo(errorFinal);

    document.getElementById(`resultado-${id}`).className = `resultado-panel estado-${colorFinal}`;
    document.getElementById(`resultado-${id}`).innerHTML = `
      <div class="semaforo semaforo-${colorFinal}">
          <span class="semaforo-circulo"></span>
          <span class="semaforo-texto">${colorFinal.toUpperCase()}</span>
      </div>
    `;


    // ---------------- REGISTROS & ESTADÍSTICAS ----------------
    actualizarEstadisticas(id, colorFinal);
    guardarRegistro(id, valoresUsuario.join(" , "), errorFinal, colorFinal);
    mostrarEstadisticas(id);
    mostrarRegistro(id);

    // ---------------- LIMPIAR INPUTS ----------------
    correctas.forEach((_, i) => {
        const campo = document.getElementById(`entrada-${id}-${i}`);
        if (campo) campo.value = "";
    });
}

/* ---------- ESTADÍSTICAS ---------- */
function actualizarEstadisticas(id, color) {
  const stats = JSON.parse(localStorage.getItem(`stats_${id}`));
  stats.participantes++;
  stats.conteo[color]++;
  localStorage.setItem(`stats_${id}`, JSON.stringify(stats));
}

function guardarRegistro(id, valor, diferencia, color) {
  const registro = JSON.parse(localStorage.getItem(`registro_${id}`));
  registro.unshift({ fecha: fechaHoraLocal(), valor, diferencia, color });
  localStorage.setItem(`registro_${id}`, JSON.stringify(registro));
}

function mostrarEstadisticas(id) {
  const stats = JSON.parse(localStorage.getItem(`stats_${id}`));
  document.getElementById(`estadisticas-${id}`).innerHTML = `
    <p>Participantes: ${stats.participantes}</p>
    <p>Verde: ${stats.conteo.verde} | Amarillo: ${stats.conteo.amarillo} | Rojo: ${stats.conteo.rojo}</p>
  `;
}

function mostrarRegistro(id) {
  const registros = JSON.parse(localStorage.getItem(`registro_${id}`));
  const tabla = document.getElementById(`registro-${id}`);

  tabla.innerHTML = `
    <thead>
      <tr>
        <th>Fecha y Hora</th>
        <th>Respuesta</th>
        <th>Error (%)</th>
        <th>Semáforo</th>
      </tr>
    </thead>
    <tbody>
      ${registros.slice(0, 10).map(r => `
        <tr>
          <td>${r.fecha}</td>
          <td>${r.valor}</td>
          <td>${r.diferencia.toFixed(2)}</td>
          <td><span class="badge-${r.color}">${r.color}</span></td>
        </tr>
      `).join("")}
    </tbody>
  `;
}


/* ---------- NAVEGACIÓN ---------- */
function mostrarSeccion(id) {
  document.querySelectorAll(".seccion-ejercicio").forEach(s => s.classList.add("oculto"));
  document.getElementById(id).classList.remove("oculto");

  mostrarEstadisticas(id);
  mostrarRegistro(id);

  activarBrillo(id);   // ⬅️ ACTIVAMOS EL BRILLO SOLO AL ABRIR EL EJERCICIO
}

function activarBrillo(id) {
    const tarjeta = document.querySelector(`#${id} .tarjeta`);
    if (!tarjeta) return;

    // Activa brillo
    tarjeta.classList.add("brillo-activo");

    // Lo desactiva después de 15 segundos
    setTimeout(() => {
        tarjeta.classList.remove("brillo-activo");
    }, 10000);
}


/* ---------- EVENTOS ---------- */
document.addEventListener("DOMContentLoaded", () => {
  inicializarAlmacenamiento();

  document.querySelectorAll(".btn-menu").forEach(btn => {
    btn.addEventListener("click", () => mostrarSeccion(btn.dataset.ejercicio));
  });

  document.querySelectorAll(".btn-volver").forEach(btn => {
    btn.addEventListener("click", () => location.reload());
  });

  Object.keys(respuestasCorrectas).forEach(id => {
    const btn = document.getElementById(`validar-${id}`);
    if (btn) btn.addEventListener("click", () => validarEjercicio(id));
  });
});

// ================= MENÚ DESPLEGABLE POR CATEGORÍAS =================
document.querySelectorAll(".titulo-categoria").forEach(titulo => {
  titulo.addEventListener("click", () => {
    const categoria = titulo.parentElement;

    // Cerrar todas las demás
    document.querySelectorAll(".categoria").forEach(cat => {
      if (cat !== categoria) cat.classList.remove("activa");
    });

    // Alternar la clickeada
    categoria.classList.toggle("activa");
  });
});

function borrarRegistro(id) {
    localStorage.removeItem(`registro_${id}`);
    localStorage.removeItem(`stats_${id}`);

    // Reiniciar estadísticas vacías
    localStorage.setItem(`stats_${id}`, JSON.stringify({
        participantes: 0,
        conteo: { verde: 0, amarillo: 0, rojo: 0 }
    }));

    // limpiar la tabla
    const tabla = document.getElementById(`registro-${id}`);
    if (tabla) tabla.innerHTML = `
        <thead>
          <tr>
            <th>Fecha y Hora</th>
            <th>Respuesta</th>
            <th>Error (%)</th>
            <th>Semáforo</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td colspan="4" style="text-align:center; opacity:0.7; padding:12px;">
              No hay registros.
            </td>
          </tr>
        </tbody>
    `;

    // limpiar el semáforo visual completamente
    const resultado = document.getElementById(`resultado-${id}`);
    if (resultado) {
        resultado.innerHTML = "";
        resultado.className = "";   // ⬅️ BORRA el borde de color
    }

    // 🔥 borrar también los mensajes individuales debajo de los inputs
respuestasCorrectas[id].forEach((_, i) => {
    const msg = document.getElementById(`msg-${id}-${i}`);
    if (msg) msg.innerHTML = "";
});

    mostrarEstadisticas(id);
}

// =============================
//  ATAJO SECRETO: Ctrl + Alt + R
//  Muestra/Oculta la columna de Respuestas
// =============================
let respuestasVisibles = false;

document.addEventListener("keydown", (e) => {
    // Activar solo si se presiona Ctrl + Alt + R
    if (e.ctrlKey && e.altKey && e.key.toLowerCase() === "r") {

        respuestasVisibles = !respuestasVisibles;

        const estiloOculto = `
            .tabla-registro td:nth-child(2),
            .tabla-registro th:nth-child(2) {
                display: none !important;
            }
        `;

        const estiloVisible = `
            .tabla-registro td:nth-child(2),
            .tabla-registro th:nth-child(2) {
                display: table-cell !important;
            }
        `;

        // Crear o actualizar etiqueta de estilo
        let tag = document.getElementById("toggle-respuestas-css");
        if (!tag) {
            tag = document.createElement("style");
            tag.id = "toggle-respuestas-css";
            document.head.appendChild(tag);
        }

        tag.innerHTML = respuestasVisibles ? estiloVisible : estiloOculto;

        // Mensaje solo visible en la consola
        console.log(respuestasVisibles ? "🔓 Respuestas visibles" : "🔒 Respuestas ocultas");
    }
});

// =============================
//  ANIMACIÓN Y CENTRADO DE TARJETAS
// =============================
document.querySelectorAll(".btn-cat").forEach(btn => {
  btn.addEventListener("click", () => {

    const tarjetaSeleccionada = btn.closest(".tarjeta-categoria");
    const menu = tarjetaSeleccionada.querySelector(".ejercicios-cat");
    const todasLasTarjetas = document.querySelectorAll(".tarjeta-categoria");

    // Ocultar las otras tarjetas
    todasLasTarjetas.forEach(t => {
      if (t !== tarjetaSeleccionada) {
        t.classList.add("tarjeta-oculta");
      }
    });

    // Pasar tarjeta al centro
    tarjetaSeleccionada.classList.add("tarjeta-activa");

    // Mostrar menú interno
    menu.style.display = "flex";

  });
});


// =============================
//  ANIMACIÓN Y CENTRADO DE TARJETAS (con cálculo para no tapar header)
// =============================
let resizeHandlerForActive = null;

document.querySelectorAll(".btn-cat").forEach(btn => {
  btn.addEventListener("click", () => {
    const tarjetaSeleccionada = btn.closest(".tarjeta-categoria");
    const menu = tarjetaSeleccionada.querySelector(".ejercicios-cat");
    const todasLasTarjetas = document.querySelectorAll(".tarjeta-categoria");

    // Ocultar las otras tarjetas
    todasLasTarjetas.forEach(t => {
      if (t !== tarjetaSeleccionada) {
        t.classList.add("tarjeta-oculta");
      }
    });

    // Activar clase (posicionamiento fixed se gestiona en CSS)
    tarjetaSeleccionada.classList.add("tarjeta-activa");

    // Asegurarnos que quede centrada entre el header y la parte baja de la ventana.
    function posicionarTarjetaCentrada() {
      const header = document.querySelector(".cabecera");
      const headerBottom = header ? header.getBoundingClientRect().bottom : 0;
      const viewportHeight = window.innerHeight;
      // centro vertical entre headerBottom y la parte inferior de la ventana
      const centroEntreHeaderY = headerBottom + (viewportHeight - headerBottom) / 2;
      // asignar posición en px (CSS usa transform: translate(-50%,-50%))
      tarjetaSeleccionada.style.top = `${centroEntreHeaderY}px`;
      tarjetaSeleccionada.style.left = `50%`;
    }

    // ejecutar una vez y también en resize para que se mantenga correctamente
    posicionarTarjetaCentrada();
    if (resizeHandlerForActive) window.removeEventListener("resize", resizeHandlerForActive);
    resizeHandlerForActive = posicionarTarjetaCentrada;
    window.addEventListener("resize", resizeHandlerForActive);

    // Mostrar menú interno (lo expandimos)
    menu.style.display = "flex";
    menu.classList.add("menu-expandido");
  });
});

// =============================
//  BOTÓN VOLVER SIN RECARGAR (limpieza de estilos y listeners)
// =============================
const btnVolver = document.getElementById("btnVolver");
if (btnVolver) {
  btnVolver.addEventListener("click", () => {
    // Ocultar todas las secciones de ejercicios
    document.querySelectorAll(".seccion-ejercicio").forEach(sec => {
      sec.style.display = "none";
      sec.classList.remove("activo");
    });

    // Restaurar menú de categorías
    const menuRoot = document.querySelector(".menu-categorias");
    if (menuRoot) menuRoot.classList.remove("oculta");

    // Restaurar todas las tarjetas de categorías
    document.querySelectorAll(".tarjeta-categoria").forEach(t => {
      t.classList.remove("tarjeta-activa", "tarjeta-oculta");
      const menu = t.querySelector(".ejercicios-cat");
      if (menu) menu.style.display = "none";
      t.style.top = "";
      t.style.left = "";
    });

    // Ocultar botón volver
    btnVolver.style.display = "none";

    // Quitar listener de resize si existía
    if (resizeHandlerForActive) {
      window.removeEventListener("resize", resizeHandlerForActive);
      resizeHandlerForActive = null;
    }
  });
}


document.querySelectorAll(".ejercicios-cat button").forEach(btnEj => {
  btnEj.addEventListener("click", () => {
    const idSeccion = btnEj.getAttribute("data-ejercicio");
    const seccion = document.getElementById(idSeccion);

    // Ocultar todas las secciones primero
    document.querySelectorAll(".seccion-ejercicio").forEach(sec => {
      sec.style.display = "none";
      sec.classList.remove("activo");
    });

    // Mostrar la sección elegida justo debajo del header
    seccion.style.display = "flex";
    seccion.classList.add("activo");

    // Mostrar registro y estadísticas
    mostrarRegistro(idSeccion);
    mostrarEstadisticas(idSeccion);

    // Ocultar la tarjeta centrada
    const tarjetaActiva = document.querySelector(".tarjeta-activa");
    if (tarjetaActiva) {
      tarjetaActiva.style.display = "none"; 
    }

    // Mostrar botón volver
    const btnVolver = document.getElementById("btnVolver");
    btnVolver.style.display = "inline-block";

    // Scroll al header
    const header = document.querySelector(".cabecera");
    const y = header.offsetHeight;
    window.scrollTo({ top: y, behavior: "smooth" });
  });
});

// Mostrar el recuadro al cargar la página
document.addEventListener("DOMContentLoaded", () => {
  const infoOverlay = document.getElementById("info-semaforo");
  const cerrarBtn = document.getElementById("cerrar-info");

  if (infoOverlay && cerrarBtn) {
    // Mostrar automáticamente al entrar
    infoOverlay.classList.remove("oculto");

    // Cerrar al hacer clic en el botón
    cerrarBtn.addEventListener("click", () => {
      infoOverlay.classList.add("oculto");
    });
  }
});

document.querySelectorAll(".ejercicios-cat button").forEach(btnEj => {
  btnEj.addEventListener("click", () => {
    const idSeccion = btnEj.getAttribute("data-ejercicio");
    const seccion = document.getElementById(idSeccion);

    // Ocultar todas las secciones de ejercicios
    document.querySelectorAll(".seccion-ejercicio").forEach(sec => {
      sec.style.display = "none";
      sec.classList.remove("activo");
    });

    // Mostrar la sección elegida
    seccion.style.display = "flex";
    seccion.classList.add("activo");

    // Mostrar la tarjeta de información
    const tarjetaInfo = document.getElementById("tarjeta-info");
    tarjetaInfo.classList.remove("oculto");

    // Ocultar la tarjeta de la categoría
    const tarjetaActiva = document.querySelector(".tarjeta-activa");
    if (tarjetaActiva) tarjetaActiva.style.display = "none";

    // Mostrar botón volver
    const btnVolver = document.getElementById("btnVolver");
    btnVolver.style.display = "inline-block";

    // Scroll al header para que la tarjeta-info quede visible
    const header = document.querySelector(".cabecera");
    const y = header.offsetHeight;
    window.scrollTo({ top: y, behavior: "smooth" });
  });
});




document.querySelectorAll(".ejercicios-cat button").forEach(btnEj => {
  btnEj.addEventListener("click", () => {
    const idSeccion = btnEj.getAttribute("data-ejercicio");
    const seccion = document.getElementById(idSeccion);

    // Ocultar todas las secciones
    document.querySelectorAll(".seccion-ejercicio").forEach(sec => {
      sec.style.display = "none";
      sec.classList.remove("activo");
    });

    // Mostrar la sección seleccionada
    seccion.style.display = "block";
    seccion.classList.add("activo");

    // Calcular top dinámico: header + aviso + margen
    const header = document.querySelector(".cabecera");
    const aviso = document.getElementById("tarjeta-info");
    const offsetTop = (header?.offsetHeight || 0) + (aviso?.offsetHeight || 0) + 20;

    seccion.style.top = offsetTop + "px";

    // Centrado horizontal exacto
    seccion.style.left = "58%";
    seccion.style.transform = "translateX(-50%)";

    // Scroll hasta la tarjeta
    window.scrollTo({ top: offsetTop, behavior: "smooth" });
  });
});





document.querySelectorAll(".ejercicios-cat button").forEach(btnEj => {
  btnEj.addEventListener("click", () => {
    const idSeccion = btnEj.getAttribute("data-ejercicio");
    const seccion = document.getElementById(idSeccion);

    // Ocultar otras secciones
    document.querySelectorAll(".seccion-ejercicio").forEach(sec => {
      sec.style.display = "none";
    });

    // Mostrar tarjeta seleccionada
    seccion.style.display = "block";

    // Scroll hasta la tarjeta (opcional)
    seccion.scrollIntoView({ behavior: "smooth", block: "start" });
  });
});
