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
  const valoresUsuario = [];
  respuestasCorrectas[id].forEach((_, i) => {
    const val = parsearNumero(document.getElementById(`entrada-${id}-${i}`).value);
    valoresUsuario.push(val);
  });

  const correctas = respuestasCorrectas[id];
  let errores = [];

  for (let i = 0; i < correctas.length; i++) {
    if (isNaN(valoresUsuario[i])) {
      document.getElementById(`resultado-${id}`).innerHTML =
        "<strong>Error:</strong> ingrese todos los valores correctamente.";
      return;
    }
    let errorRelativo = Math.abs((valoresUsuario[i] - correctas[i]) / correctas[i]) * 100;
    errores.push(errorRelativo);
  }

  let errorFinal = Math.max(...errores);
  const color = colorErrorRelativo(errorFinal);

  document.getElementById(`resultado-${id}`).className = `resultado-panel estado-${color}`;
  document.getElementById(`resultado-${id}`).innerHTML = `
  <div class="semaforo semaforo-${color}">
      <span class="semaforo-circulo"></span>
      <span class="semaforo-texto">${color.toUpperCase()}</span>
  </div>
`;


  actualizarEstadisticas(id, color);
  guardarRegistro(id, valoresUsuario.join(" , "), errorFinal, color);
  mostrarEstadisticas(id);
  mostrarRegistro(id);

  // --- LIMPIAR LOS INPUTS DESPUÉS DE VALIDAR ---
respuestasCorrectas[id].forEach((_, i) => {
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

    mostrarEstadisticas(id);
}

