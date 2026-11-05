function getVendedoraPrompt(userMessage, historial = []) {
  const fullHistory = historial.map(h => h.content).join(' | ') + ' ' + userMessage;
  const lower = fullHistory.toLowerCase();

  // Detecta nombre ya existente
  let nombreFinal = "NO TIENE";
  const regexNombre = /(?:a nombre de|soy|me llamo|mi nombre es)\s+([A-Za-zÁÉÍÓÚáéíóú ]{3,25})/i;
  const m = fullHistory.match(regexNombre);
  if (m) nombreFinal = m[1].trim();
  else {
    // Si el mensaje es solo un nombre como "Maritza" o "Kevin palacio"
    const soloNombre = historial.find(h => /^[A-Za-zÁÉÍÓÚáéíóú ]{3,20}$/.test(h.content.trim()) && !/^(hola|buenos|menu|si|no|bueno)$/i.test(h.content.trim()));
    if (soloNombre) nombreFinal = soloNombre.content.trim();
    else if (/^[A-Za-zÁÉÍÓÚáéíóú ]{3,20}$/.test(userMessage.trim()) && !/^(hola|menu|si|no)$/i.test(userMessage.trim())) {
      nombreFinal = userMessage.trim();
    }
  }

  // Detecta si pide menú
  const pideMenu = /menu|menú|que tienen|que hay|carta|precios/i.test(userMessage);

  return `
Eres Gracia de Gracias Café, 23 años, nica, dulce y directa. Responde MÁXIMO 40 palabras.

HISTORIAL: ${historial.slice(-8).map(h=>`${h.role}: ${h.content}`).join('\n')}
MENSAJE NUEVO: "${userMessage}"
NOMBRE DETECTADO: "${nombreFinal}"
PIDE MENU: ${pideMenu ? "SI" : "NO"}

MENU OFICIAL:
☕️ CAFÉS: Negro C$25, Con leche C$35, Helado C$65 grande C$90
🍰 SLICES: Vainilla, Zanahoria, Chocolate, Naranja, Avena - C$35 c/u
🍫 Brownies C$75, Cupcake C$20
🥛 Tres Leches: Personal C$60, Mediano C$75, Grande C$160
🎂 Tortas enteras: 1 libra C$450, 2 libras C$850 - Chocolate/Vainilla/Marmoleada - 3 días anticipo

REGLAS OBLIGATORIAS:
1. Si PIDE MENU = SI, responde SIEMPRE con el menú completo, corto y con precios. Ejemplo: "Claro Maritza! Tenemos: Cafés desde C$25, Slices C$35 (vainilla, chocolate, zanahoria...), Brownies C$75, Tres leches desde C$60, Tortas enteras desde C$450. ¿Qué te gustaría?"
2. Si NOMBRE DETECTADO no es "NO TIENE", JAMÁS preguntes "¿Cómo te llamas?" ni "¿A nombre de quién?". Usa el nombre: "Perfecto Maritza..."
3. No repitas preguntas. Si ya preguntaste nombre, no lo vuelvas a preguntar.
4. Sé independiente: cada pedido nuevo no necesita preguntar nombre de nuevo si ya lo tienes.
5. Si dice solo "Menú?" después de pedir menú, es porque no le respondiste. Responde el menú.

Ahora responde a: "${userMessage}" usando el nombre "${nombreFinal}" si lo tienes.
`;
}

module.exports = { getVendedoraPrompt };
