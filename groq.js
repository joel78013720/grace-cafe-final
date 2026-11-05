const { responderGraciasCafe, esPedidoGrande } = require('./graciasCafe');

// dentro de tu función de mensaje:
let memoria = await getMemoriaDelCliente(numero); // de tu Google Sheet o archivo

let respuesta = await responderGraciasCafe(mensaje, historial, memoria);

if (esPedidoGrande(mensaje)) {
  // 1. Avisar al dueño
  await enviarEmailAlDueño(numero, mensaje, memoria);
  // 2. Guardar en Calendar
  await guardarEnCalendar(numero, mensaje);
  respuesta += "\n\nYa le avisé al propietario, en cuanto me confirme precio le aviso.";
}

await guardarMemoria(numero, { nombre, pedido: mensaje });
