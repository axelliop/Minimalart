const express = require('express');
const { chromium } = require('playwright');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

// Ruta principal para verificar si el servidor está activo
app.get('/', (req, res) => {
    res.send('Servidor funcionando correctamente');
});

app.post('/run-test', async (req, res) => {
    const { url, expectedProducts } = req.body;
    if (!url) return res.status(400).json({ error: 'URL is required' });

    try {
        const browser = await chromium.launch();
        const page = await browser.newPage();
        await page.goto(url);

        // Obtener el título de la página
        const title = await page.title();

        // Obtener todos los elementos <h2> y extraer su texto
        const h2Elements = await page.$$eval('h2', elements => elements.map(el => el.textContent.trim()));

        await browser.close();

        res.json({ success: true, title, expectedProducts, h2Elements });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.listen(5000, () => console.log('Server running on port 5000'));
