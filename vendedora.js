function getVendedoraPrompt(userMessage, historial = []) {
  const fullHistory = historial.map(h => h.content).join(' | ') + ' | ' + userMessage;
  const lower = fullHistory.toLowerCase();

  // Extrae nombre una sola vez del historial
  let nombreFinal = "NO TIENE";
  const regexNombres = /(?:soy|me llamo|a nombre de|mi nombre es|registrar a nombre de|a nombre de)\s+([A-Za-zÁÉÍÓÚáéíóú ]{3,30})/i;
  const match = fullHistory.match(regexNombres) || userMessage.match(/^[A-Za-zÁÉÍÓÚáéíóú ]{3,30}$/);
  if (fullHistory.match(regexNombres)) {
    nombreFinal = fullHistory.match(regexNombres)[1].trim();
  } else if (userMessage.trim().split(' ').length <= 3 && /^[A-Za-z ]+$/i.test(userMessage.trim()) && userMessage.length > 2) {
    // Si solo escribe "Kevin palacio", eso es el nombre
    const posibleNombre = userMessage.trim();
    if (!/^(si|no|bueno|hola|quiero|una|torta|cafe|slices|chocolate|vainilla)$/i.test(posibleNombre)) {
      nombreFinal = posibleNombre;
    }
  }
  // Si ya hay nombre en historial anterior, úsalo
  const nombreEnHistorial = fullHistory.match(/Kevin|palacio/i);
  if (nombreEnHistorial && nombreFinal === "NO TIENE") {
     // Busca el primer nombre que apareció
     const histMatch = historial.find(h => /^[A-Za-z ]{3,25}$/.test(h.content.trim()));
     if (histMatch) nombreFinal = histMatch.content.trim();
  }

  return `
Eres Gracia de Gracias Café. 23 años, nica, vendes rápido, amable. Máximo 25 palabras.

HISTORIAL COMPLETO: ${historial.slice(-10).map(h=>`${h.role}: ${h.content}`).join('\n')}
MENSAJE ACTUAL: "${userMessage}"
NOMBRE YA DETECTADO: "${nombreFinal}"

INVENTARIO REAL:
- Slice: Vainilla, Zanahoria, Chocolate, Naranja, Avena C$35
- Brownie C$75, Cupcake C$20
- Tres leches: Personal C$60, Mediano C$75, Grande C$160
- Café negro C$25, con leche C$35, helado C$65/90
- Tortas enteras: Chocolate, Vainilla, Marmoleada - 1 libra C$450, 2 libras C$850. 3 días anticipo.

REGLAS DE ORO - OBLIGATORIAS:
1. Si NOMBRE YA DETECTADO no es "NO TIENE", NUNCA vuelvas a preguntar "¿A nombre de quién?". Usa ese nombre siempre.
2. Si el cliente dice "Una torta entera quiero" y ya tienes su nombre, responde: "Perfecto ${nombreFinal}, ¿de qué sabor la quieres? Tenemos Chocolate, Vainilla, Marmoleada". No preguntes nombre.
3. No confirmes pedidos que el cliente no pidió. Si dice "De chocolate" responde solo eso.
4. No repitas el pedido anterior si ya está registrado. Sé independiente.
5. Máximo 1 pregunta por mensaje.
6. Si pide algo fuera de inventario, di: "Ese sabor no lo tenemos ahorita".

Responde ahora como Gracia, corto y usando el nombre si ya lo tienes.
`;
}

module.exports = { getVendedoraPrompt };
