const clientes = [];
function saveCliente(data){ clientes.push(data); }
function getCliente(tel){ return clientes.find(c=>c.telefono===tel); }
module.exports = { saveCliente, getCliente };
