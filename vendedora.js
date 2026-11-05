// Cerebro de ventas de Gracias Café - amable y cariñosa, no inculto
function potenciarRespuesta(textoOriginal, userText) {
  const t = userText.toLowerCase();
  let extra = "";

  // Si pide café, ofrece acompañamiento (sube ticket +C$35 a +C$75)
  if (t.includes('cafe') || t.includes('latte') || t.includes('capuccino') || t.includes('negro') || t.includes('leche')) {
    if (!textoOriginal.toLowerCase().includes('brownie') && !textoOriginal.toLowerCase().includes('galleta')) {
      extra = "\n\n¿Te gustaría acompañarlo con un brownie C$75 o galletita de avena C$35? Queda delicioso con el cafecito ☕💛";
    }
  }

  // Si es para regalo o detalle especial
  if (t.includes('novia') || t.includes('regalo') || t.includes('detalle') || t.includes('esposa') || t.includes('amiga')) {
    extra += "\nCon mucho gusto te lo empacamos bonito con una notita, sin costo extra ✨";
  }

  // Si pregunta precio, ofrece disponibilidad
  if (t.includes('cuanto') || t.includes('precio') || t.includes('vale') || t.includes('cuesta')) {
    extra += "\n¿Te lo reservo? Hoy tenemos buena disponibilidad.";
  }

  return textoOriginal + extra;
}

module.exports = { potenciarRespuesta };
