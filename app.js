const { responderGraciasCafe, esPedidoGrande } = require('./graciasCafe');

// Cuando entra mensaje de WhatsApp:
async function handleMensaje(numero, mensajeTexto, historial) {
  let memoria = await getMemoria(numero); // leelo de tu sheet o json
  
  let respuesta = await responderGraciasCafe(mensajeTexto, historial, memoria);

  // Si es torta grande, avisá al dueño
  if (esPedidoGrande(mensajeTexto)) {
    await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT}/sendMessage`, {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({
        chat_id: process.env.TELEGRAM_ID_DUEÑO,
        text: `🔔 NUEVO ENCARGO GRACIAS CAFÉ\nDe: ${numero}\nNombre: ${memoria.nombre || 'sin nombre'}\nPide: ${mensajeTexto}\n\nResponder en Calendar: 3 días mínimo, 50% anticipo.`
      })
    });
    respuesta += "\n\nYa le avisé al propietario, en cuanto me confirme el precio final yo le escribo.";
  }

  // Guarda memoria para que no pregunte de nuevo
  await saveMemoria(numero, { nombre: memoria.nombre, ultimo_pedido: mensajeTexto });
  
  return respuesta;
}
