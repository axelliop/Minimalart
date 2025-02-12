const express = require("express");
const cors = require("cors");
const playwright = require("playwright");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());
app.use("/screenshots", express.static(path.join(__dirname, "screenshots")));

// Crear la carpeta de screenshots si no existe
if (!fs.existsSync("screenshots")) {
    fs.mkdirSync("screenshots");
}

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
        let unidentifiedDiscounts = [];
        let screenshotPath = null;

        if (validateDiscount) {
            discountResults = await page.$$eval("span.berocket-label-user-image", spans => {
                return spans.map(span => {
                    const styleAttr = span.getAttribute("style") || "";
                    const match = styleAttr.match(/url\(["']?(.*?)["']?\)/);
                    return match ? match[1] : null;
                }).filter(url => url); // Filtramos valores nulos
            });

            detectedDiscounts = discountResults.map(src => {
                const label = DISCOUNT_LABELS[src] || "otro tipo de label";
                if (label === "otro tipo de label") {
                    unidentifiedDiscounts.push(src);
                }
                return label;
            });

            // Si hay descuentos no identificados, tomar una captura de pantalla
            if (unidentifiedDiscounts.length > 0) {
                const timestamp = Date.now();
                screenshotPath = `screenshots/snapshot_${timestamp}.png`;
                await page.screenshot({ path: screenshotPath });
            }
        }

        await browser.close();

        res.json({
            success: true,
            title,
            h2Elements,
            discountResults: detectedDiscounts,
            screenshotPath: screenshotPath ? `/screenshots/${path.basename(screenshotPath)}` : null
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
