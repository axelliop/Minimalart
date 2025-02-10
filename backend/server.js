const express = require('express');
const { chromium } = require('playwright');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors({
    origin: "https://minimalart-production.up.railway.app/", // Reemplazá con la URL de tu frontend en Vercel
    methods: "GET,POST",
    allowedHeaders: "Content-Type"
}));


// Ruta de prueba para verificar que el servidor está corriendo
app.get('/', (req, res) => {
    res.send('Servidor funcionando correctamente');
});

app.post('/run-test', async (req, res) => {
    const { url, expectedProducts } = req.body;

    if (!url) {
        return res.status(400).json({ success: false, error: 'URL is required' });
    }

    let browser;
    try {
        console.log("Iniciando navegador Playwright...");
        browser = await chromium.launch();
        const page = await browser.newPage();
        console.log(`Accediendo a la URL: ${url}`);
        await page.goto(url);

        // Obtener el título de la página
        const title = await page.title();
        console.log(`Título de la página: ${title}`);

        // Obtener todos los elementos <h2> y extraer su texto
        const h2Elements = await page.$$eval('h2', elements => elements.map(el => el.textContent.trim()));
        console.log("Elementos H2 encontrados:", h2Elements);

        await browser.close();

        res.json({ success: true, title, expectedProducts, h2Elements });
    } catch (error) {
        console.error("Error en el backend:", error);
        
        if (browser) {
            await browser.close();
        }

        res.status(500).json({ success: false, error: error.message });
    }
});

app.listen(5000, () => console.log('🚀 Server running on port 5000'));
