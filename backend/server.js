const express = require("express");
const cors = require("cors");
const playwright = require("playwright");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());

app.post("/run-test", async (req, res) => {
    const { url, expectedProducts } = req.body;
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

        let screenshotPath = null;
        if (expectedProducts && h2Elements.length !== parseInt(expectedProducts)) {
            screenshotPath = path.join(__dirname, `screenshot_${Date.now()}.png`);
            await page.screenshot({ path: screenshotPath, fullPage: true });
        }

        await browser.close();

        res.json({
            success: true,
            title,
            h2Elements,
            screenshot: screenshotPath ? `/screenshots/${path.basename(screenshotPath)}` : null,
        });
    } catch (error) {
        if (browser) await browser.close();
        res.status(500).json({ success: false, message: "Error en la automatización", error: error.message });
    }
});

app.use("/screenshots", express.static(path.join(__dirname)));

const PORT = 5000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
