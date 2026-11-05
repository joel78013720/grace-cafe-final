const express = require('express');
const axios = require('axios');
const path = require('path');
const { getVendedoraPrompt } = require('./vendedora.js');

// Cargar opcionalmente owner.js si existe
let ownerHandler = null;
try {
  ownerHandler = require('./owner.js');
} catch (e) {
  console.log('Modulo owner.js no disponible o no encontrado. Continuando sin interrupciones.');
}

const app = express();
app.use(express.json());

// Variables de Entorno y Configuración
const PORT = process.env.PORT || 3000;
const VERIFY_TOKEN = process.env.VERIFY_TOKEN || 'GRACIAS_CAFE_TOKEN';
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN || '';
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID || '';
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || '';
const OWNER_NUMBER = '50583872855';

// Almacenamiento en Memoria
const sesiones = new Map(); // key: phone, value: { historial: [], nombre: '' }
const mensajesVistos = new Set(); // Anti-duplicados por message_id
const suscritosPromos = new Set(); // Usuarios suscritos a promociones
const pedidosCalendario = []; // Guardar pedidos para el dashboard

/**
 * Enviar mensaje de WhatsApp usando la API Oficial de Meta
 */
async function enviarWhatsApp(to, text) {
  if (!PHONE_NUMBER_ID || !WHATSAPP_TOKEN) {
    console.warn('[Meta API] Faltan credenciales PHONE_NUMBER_ID o WHATSAPP_TOKEN');
    return;
  }
  try {
    await axios.post(
      `https://graph.facebook.com/v18.0/${PHONE_NUMBER_ID}/messages`,
      {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: to,
        type: 'text',
        text: { body: text }
      },
      {
        headers: {
          'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );
  } catch (error) {
    console.error('[Error Enviar WhatsApp]:', error.response ? error.response.data : error.message);
  }
}

/**
 * Llamada a la IA (Anthropic Claude API) pasando el prompt generado por vendedora.js
 */
async function obtenerRespuestaIA(userMessage, historial, nombreActual) {
  const promptSistema = getVendedoraPrompt(userMessage, historial, nombreActual);
  
  if (!ANTHROPIC_API_KEY) {
    return "¡Hola! Gracias por escribirnos a Gracias Café. En un momento le atendemos con mucho gusto.";
  }

  try {
    const response = await axios.post(
      'https://api.anthropic.com/v1/messages',
      {
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 150,
        system: promptSistema,
        messages: [{ role: 'user', content: userMessage }]
      },
      {
        headers: {
          'x-api-key': ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json'
        }
      }
    );

    if (response.data && response.data.content && response.data.content.length > 0) {
      return response.data.content[0].text;
    }
    return "¡Gracias por visitar Gracias Café! ¿En qué le podemos servir hoy?";
  } catch (err) {
    console.error('[Error IA]:', err.response ? err.response.data : err.message);
    return "¡
      
