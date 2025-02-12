const express = require("express");
const cors = require("cors");
const playwright = require("playwright");

const app = express();
app.use(cors());
app.use(express.json());

// Tabla de referencia de imágenes a descuentos
const DISCOUNT_LABELS = {
    "https://arcorencasa.com/wp-content/uploads/2021/09/20off.png": "20%",
    "https://arcorencasa.com/wp-content/uploads/2021/09/25off.png": "25%",
    "https://arcorencasa.com/wp-content/uploads/2021/11/30off.png": "30%",
};

app.post("/run-test", async (req, res) => {
    const { url, validateDiscount } = req.body;
    if (!url) {
        return res.status(400).json({ success: false, message: "URL no proporcionada" });
    }

    let browser;
    try {
        browser = await playwright.chromium.launch({ headless: false });
        const context = await browser.newContext();
        const page = await context.newPage();
        await page.goto(url, { timeout: 30000 });

        const title = await page.title();
        const h2Elements = await page.$$eval("h2", elements => elements.map(el => el.textContent.trim()));

        let discountResults = [];
        let detectedDiscounts = [];

        if (validateDiscount) {
            discountResults = await page.$$eval("span.berocket-label-user-image", spans => {
                return spans.map(span => {
                    const styleAttr = span.getAttribute("style") || "";
                    const match = styleAttr.match(/url\(["']?(.*?)["']?\)/);
                    return match ? match[1] : null;
                }).filter(url => url); // Filtramos valores nulos
            });

            console.log("URLs de descuento detectadas:", discountResults);

            detectedDiscounts = discountResults.map(src => DISCOUNT_LABELS[src] || "Descuento no identificado");

            console.log("Descuentos extraídos:", detectedDiscounts);
        }

        await browser.close();

        res.json({
            success: true,
            title,
            h2Elements,
            discountResults: detectedDiscounts,
        });
    } catch (error) {
        if (browser) await browser.close();
        res.status(500).json({ success: false, message: "Error en la automatización", error: error.message });
    }
});

const PORT = 5000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});