// Configuración de la dueña - PONÉ SU NÚMERO AQUÍ
const OWNER_NUMBERS = ['5058521 9636']; // <-- CAMBIA ESTO por el número personal de ella con 505

// Función para saber si quien habla es la dueña
function esDueña(from) {
  return OWNER_NUMBERS.some(n => from.includes(n));
}

// Función para avisar a la dueña del pedido
async function avisarDueña(pedido, clientName) {
  const texto = `🔔 NUEVO PEDIDO Gracias Café 👑
  
Cliente: ${clientName}
Pedido:
${pedido.detalle}
Total: C$${pedido.total}
Hora: ${pedido.hora || '7 p.m.'}
Nota: ${pedido.nota || 'Entregar a clienta que ya pasó'}

--- Responde OK para confirmar ---`;

  // Aquí va tu envío a WhatsApp
  // Si usas WATI / WhatsApp Cloud API, llamalo aquí
  console.log('📲 ENVIANDO A DUEÑA:', texto);
  
  // Ejemplo para WhatsApp Cloud API (lo conectamos en index.js)
  return texto;
}

// Detecta si la dueña manda comando
function esComandoDueña(text) {
  const t = text.toLowerCase();
  return t.startsWith('subir estado') || t.startsWith('estado:') || t.includes('sube esta imagen') || t.startsWith('ok') || t.includes('agendalo');
}

module.exports = { OWNER_NUMBERS, esDueña, avisarDueña, esComandoDueña };
