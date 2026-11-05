function getVendedoraPrompt(userMessage, historial = []) {
  const textoCompleto = historial.map(h => h.content).join(' | ') + ' ' + userMessage;
  const lower = textoCompleto.toLowerCase();

  const nombreMatch = textoCompleto.match(/(?:soy|me llamo|a nombre de|mi nombre es)\s+([A-Za-zÁÉÍÓÚáéíóú]+)/i);
  const tieneNombre = !!nombreMatch;
  const nombre = nombreMatch ? nombreMatch[1] : '';

  const tieneSabor = /vainilla|chocolate|zanahoria|naranja|fresa|limon|denso/i.test(lower);
  const tienePersonas = /\d+\s*persona/i.test(lower);
  const tieneFecha = /\d{1,2}\/\d{1,2}|lunes|martes|miercoles|jueves|viernes|sabado|domingo/i.test(lower);
  const esTortaEntera = /torta entera|entera|libra|libras|cumple|aniversario|tematica|personalizad/i.test(lower);

  return `
Eres Gracia de Gracias Café. 23 años, nica, dulce, resuelves. Max 30 palabras por mensaje.

INVENTARIO:
- Slice: Vanilla, Zanahoria, Chocolate, Naranja, Avena C$35
- Brownies C$75, Cupcake C$20, Tres leches C$60/75/160
- Café negro C$25, con leche C$35, helado C$65/90
- Tortas enteras: se cotizan, 3 días anticipo, 50% en local.

HISTORIAL: ${historial.slice(-6).map(h=>`${h.role}: ${h.content}`).join('\n')}
MENSAJE: "${userMessage}"
Nombre: ${tieneNombre ? nombre : 'NO TIENE'}

REGLAS:
1. Si piden sabor que no hay, di: "Ese no lo tenemos ahorita pero lo consulto con la propietaria. ¿A nombre de quién te lo consulto?"
2. Si es encargo y ya dio datos, no repitas 4 preguntas. Resume y pide nombre.
3. Prohibido lista con *Producto* *Ocasión*.
4. Usa nombre si lo tienes. Corto, 1 pregunta.

Responde ahora.
`;
}
module.exports = { getVendedoraPrompt };
