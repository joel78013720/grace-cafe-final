const inventory = [
  { nombre: 'Vanilla slice', precio: 35, disponible: true },
  { nombre: 'Zanahoria slice', precio: 35, disponible: true },
  { nombre: 'Chocolate slice', precio: 35, disponible: true },
  { nombre: 'Naranja slice', precio: 35, disponible: true },
  { nombre: 'Galletas Avena', precio: 35, disponible: true },
  { nombre: 'Brownies', precio: 75, disponible: true },
  { nombre: 'Cupcake', precio: 20, disponible: true },
  { nombre: 'Tres leches', precio: '60/75/160', disponible: true },
];
function checkInventory(item){ return inventory.find(i=> item.toLowerCase().includes(i.nombre.toLowerCase())) || null; }
function listAvailable(){ return inventory.filter(i=>i.disponible); }
module.exports = { inventory, checkInventory, listAvailable };
