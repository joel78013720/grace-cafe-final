// Cerebro de ventas de Gracias Café

function potenciarRespuesta(textoOriginal, userText) {
  const t = userText.toLowerCase();
  let extra = "";

  // Si pide café, siempre ofrece brownie o galleta (ticket promedio +90)
  if (t.includes('cafe') || t.includes('latte') || t.includes('capuccino')) {
    if (!textoOriginal.toLowerCase().includes('brownie')) {
      extra = "\n\nMirá rey, ¿le agregamos un Brownie C$90? Con el café queda uff, 10/10 y quedas como rey detallista 👑";
    }
  }

  // Si es para jaña/novia, ofrece extra detallista
  if (t.includes('jaña') || t.includes('novia') || t.includes('ella') || t.includes('friolenta')) {
    extra += "\nTe lo empaqueto bonito con notita? Sin costo extra, para que quedes como rey.";
  }

  // Si pregunta precio, crea urgencia
  if (t.includes('cuanto') || t.includes('vale')) {
    extra += "\nTe lo aparto de una? Se nos acaban rápido los brownies hoy.";
  }

  return textoOriginal + extra;
}

module.exports = { potenciarRespuesta };
