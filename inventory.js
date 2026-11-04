module.exports = {
  items: [
    { nombre: 'Café Helado', precio: 120, stock: 20, disponible: true, tags: 'frio fresco' },
    { nombre: 'Café Helado con Mocha', precio: 150, stock: 15, disponible: true, tags: 'frio fresco dulce' },
    { nombre: 'Café Caliente con Leche', precio: 110, stock: 25, disponible: true, tags: 'caliente friolenta lluvia' },
    { nombre: 'Capuccino', precio: 130, stock: 15, disponible: true, tags: 'caliente friolenta' },
    { nombre: 'Latte Caliente', precio: 120, stock: 20, disponible: true, tags: 'caliente' },
    { nombre: 'Fresquito Cacao', precio: 80, stock: 10, disponible: true, tags: 'frio fresco' },
    { nombre: 'Fresquito Jamaica', precio: 80, stock: 0, disponible: false, tags: 'frio' },
    { nombre: 'Brownie', precio: 90, stock: 8, disponible: true, tags: 'postre caliente' },
    { nombre: 'Torta Chocolate', precio: 120, stock: 3, disponible: true, tags: 'postre' },
  ],
  cafe_info: '100% Café Toro de Matagalpa, Nicaragua. Café de altura, lavado, intenso y afrutado. Puro nica.',
  getDisponibles() { return this.items.filter(i => i.disponible && i.stock > 0); },
  getMenuTexto() { return this.getDisponibles().map(i => `• ${i.nombre} - C$${i.precio}`).join('\n'); }
};
