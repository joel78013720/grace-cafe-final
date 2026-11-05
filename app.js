const express = require('express');
const bodyParser = require('body-parser');
const { responderGraciasCafe, esPedidoGrande } = require('./graciasCafe');

const app = express();
app.use(bodyParser.json());
app.use(require('cors')());

// Memoria simple en RAM (después la pasamos a Google Sheet)
let memorias = {};

app.post('/webhook', async (req, res) => {
  const numero = req.body.numero || req.body.from;
  const mensaje = req.body.mensaje || req.body.text;
  const historial = req.body.historial || [];

  if(!memoria) memorias[numero] = { nombre: null, pedido: null };
  
  try {
    let respuesta = await responderGraciasCafe(mensaje, historial, memorias[numero]);
    
    // Guarda nombre si lo dice
    if(mensaje.toLowerCase().includes("mi nombre es")) {
      memorias[numero].nombre = mensaje.split("es")[1].trim();
    }

    res.json({ respuesta: respuesta, esPedidoGrande: esPedidoGrande(mensaje) });
  } catch(e) {
    console.log(e);
    res.json({ respuesta: "Mire, se me cayó un momentito la señal, ¿me repite porfa qué quería?" });
  }
});

app.get('/', (req, res) => res.send('Gracias Cafe BOT vivo con IA de Meta'));

app.listen(10000, () => console.log('Bot corriendo'));
