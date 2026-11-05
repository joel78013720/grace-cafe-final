// Entiende tipos de clientes nicas

function detectarCliente(text) {
  const t = text.toLowerCase();
  
  if (t.includes('jaña') || t.includes('novia') || t.includes('ella') || t.includes('friolenta')) {
    return {
      tipo: 'DETALLISTA',
      promptExtra: `ESTE CLIENTE ES UN REY QUE QUIERE QUEDAR BIEN CON SU JAÑA. Sos su wingman. Recomendale lo más apapachador, calientito, dulce. Explicale el POR QUÉ. No vendas café, vende que va a quedar como rey detallista.`
    };
  }
  if (t.includes('trabajo') || t.includes('estudio') || t.includes('desvelado')) {
    return {
      tipo: 'PRODUCTIVO',
      promptExtra: `CLIENTE QUE NECESITA ENERGIA. Recomendale lo más cargado: Latte helado doble shot o Café negro. Explicale que Toro de Matagalpa le da power.`
    };
  }
  if (t.includes('calor') || t.includes('soleado')) {
    return {
      tipo: 'CALOR',
      promptExtra: `HACE CALOR. Recomendale heladito: Latte helado, Frappé. Decile que lo refresca.`
    };
  }
  return {
    tipo: 'NORMAL',
    promptExtra: `Cliente normal, sé amable y vendé con vida nica.`
  };
}

module.exports = { detectarCliente };
