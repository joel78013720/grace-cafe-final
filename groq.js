const axios = require('axios');
const { buildPrompt } = require('./prompt');
const inventory = require('./inventory');

const chats = new Map();
const ultimoPedido = new Map();

// --- CEREBRO DE CLIENTE (ANTES clientes.js) ---
function detectarCliente(text) {
  const t = text.toLowerCase();
  if (t.includes('jaña') || t.includes('novia') || t.includes('ella') || t.includes('friolenta')) {
    return { tipo: 'DETALLISTA', extra: 'ESTE CLIENTE QUIERE QUEDAR BIEN CON SU JAÑA. Sos su wingman. Vende apapacho, no café. Recomienda calientito + brownie y explica el por qué del frío.' };
  }
  if (t.includes('trabajo') || t.includes('estudio') || t.includes('desvelado')) {
    return { tipo: 'PRODUCTIVO', extra: 'CLIENTE CON SUEÑO. Recomendale lo más cargado: Latte helado doble shot Toro Matagalpa.' };
  }
  return { tipo: 'NORMAL', extra: 'Cliente normal, sé nica y viva.' };
}

// --- CEREBRO DE VENTAS (ANTES vendedora.js) ---
function potenciarVenta(reply, userText) {
  const t = userText.toLowerCase();
  if (t.includes('cafe') || t.includes('latte') || t.includes('capuccino')) {
    if (!reply.toLowerCase().includes('brownie')) {
      reply += "\n\n¿Le agregamos un Brownie C$90 rey? Con café queda 10/10 👑";
    }
  }
  if (t.includes('jaña') || t.includes('friolenta')) {
    reply += "\nTe lo empaqueto bonito con notita? Sin costo, para que quedes como rey.";
  }
  return reply;
}

// --- CEREBRO LOCAL DE EMERGENCIA ---
function cerebroLocal(t, from) {
  t = t.toLowerCase();
  const hora = new Date().getHours();
  let saludo = hora < 12 ? 'Buenos días' : hora > 18 ? 'Buenas noches' : 'Buenas tardes';
  const cafes = inventory.getDisponibles().filter(i => 
    i.nombre.toLowerCase().includes('café') || i.nombre.toLowerCase().includes('cafe') || i.nombre.toLowerCase().includes('latte') || i.nombre.toLowerCase().includes('capuccino')
  ).map(i => `• ${i.nombre} - C$${i.precio}`).join('\n');

  if (t.match(/^(oe|hola|buenas|hey)\b/) || t.trim().length < 5) return `${saludo} rey! 😁 Soy Gracias. ¿Cómo te ayudo hoy?`;

  if (t.includes('cuanto')
