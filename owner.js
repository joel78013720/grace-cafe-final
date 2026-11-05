/**
 * Módulo owner.js - Control operativo para la dueña de Gracias Café desde su WhatsApp personal.
 * Exporta handler y prompt del asistente de gerencia.
 */

const OWNER_NUMBER = '50583872855';

// Almacenamiento temporal para promos globales o estado de difusión
let promoActual = '';

/**
 * Genera el prompt de sistema para el asistente virtual de la dueña.
 */
function getOwnerPrompt() {
  return `
[ROL Y PERSONALIDAD]
Eres el asistente ejecutivo del sistema de gerencia de Gracias Café (Nicaragua).
- Te comunicas directamente con la dueña del local.
- Tu tono debe ser sumamente conciso, profesional, directo y ejecutivo. Sin rodeos.

[COMANDOS DISPONIBLES PARA LA DUEÑA]
1. ESTADO: [texto] -> Guarda o actualiza el texto de promoción/anuncio activo.
2. ENVIAR PROMO -> Difunde la promo actual a los clientes suscritos dentro de la ventana de 24h.
3. CALENDARIO -> Muestra el listado resumido de los próximos pedidos y fechas de recojo.
4. DASHBOARD -> Proporciona el enlace directo para visualizar el panel de control web.
`.trim();
}

/**
 * Maneja los mensajes entrantes de la dueña (OWNER_NUMBER).
 * 
 * @param {string} fromNumber - Número de teléfono del remitente.
 * @param {string} textBody - Cuerpo del mensaje recibido.
 * @param {object} context - Objeto con herramientas auxiliares { enviarWhatsApp, sesiones, pedidosCalendario, suscritosPromos }.
 * @returns {boolean} - Retorna true si el mensaje fue manejado como comando de dueña, false de lo contrario.
 */
async function handleOwnerMessage(fromNumber, textBody, context) {
  // Validar si el mensaje proviene exactamente del número de la dueña
  if (fromNumber !== OWNER_NUMBER) {
    return false;
  }

  const { enviarWhatsApp, pedidosCalendario, suscritosPromos } = context;
  const textoUpper = textBody.toUpperCase();

  try {
    // 1. Comando ESTADO: [texto]
    if (textoUpper.startsWith('ESTADO:')) {
      promoActual = textBody.substring(7).trim();
      await enviarWhatsApp(OWNER_NUMBER, `✅ Promo actualizada correctamente:\n"${promoActual}"`);
      return true;
    }

    // 2. Comando ENVIAR PROMO
    if (textoUpper === 'ENVIAR PROMO') {
      if (!promoActual) {
        await enviarWhatsApp(OWNER_NUMBER, '⚠️ No hay ninguna promo guardada. Escriba primero ESTADO: [su texto]');
        return true;
      }

      if (!suscritosPromos || suscritosPromos.size === 0) {
        await enviarWhatsApp(OWNER_NUMBER, 'ℹ️ No hay clientes suscritos en este momento para recibir la promoción.');
        return true;
      }

      let enviosExitosos = 0;
      for (const clienteNum of suscritosPromos) {
        try {
          await enviarWhatsApp(clienteNum, `✨ ¡Promoción especial de Gracias Café! ✨\n\n${promoActual}\n\n(Responda STOP para dejar de recibir ofertas).`);
          enviosExistososs++;
        } catch (err) {
          console.error(`[Error enviando promo a ${clienteNum}]:`, err.message);
        }
      }

      await enviarWhatsApp(OWNER_NUMBER, `🚀 Promo enviada con éxito a ${enviosExitosos} cliente(s).`);
      return true;
    }

    // 3. Comando CALENDARIO
    if (textoUpper === 'CALENDARIO') {
      if (!pedidosCalendario || pedidosCalendario.length === 0) {
        await enviarWhatsApp(OWNER_NUMBER, '📅 No hay pedidos programados actualmente en el calendario.');
        return true;
      }

      let resumen = '📋 *Próximos Pedidos y Recojos*:\n\n';
      pedidosCalendario.forEach((p, idx) => {
        resumen += `${idx + 1}. *${p.nombre}* (${p.fechaRecojo})\n   - Pedido: ${p.pedido}\n   - Total: ${p.total}\n   - Estado: ${p.estado}\n\n`;
      });

      await enviarWhatsApp(OWNER_NUMBER, resumen.trim());
      return true;
    }

    // 4. Comando DASHBOARD
    if (textoUpper === 'DASHBOARD') {
      await enviarWhatsApp(OWNER_NUMBER, '📊 Acceda al panel completo de pedidos aquí:\nhttp://localhost:3000/dashboard');
      return true;
    }

  } catch (error) {
    console.error('[Error en handleOwnerMessage]:', error);
    await enviarWhatsApp(OWNER_NUMBER, '❌ Ocurrió un error al procesar el comando de gerencia.');
    return true;
  }

  return false;
}

module.exports = {
  getOwnerPrompt,
  handleOwnerMessage
};
            
