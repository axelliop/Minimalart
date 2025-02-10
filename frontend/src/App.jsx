import { useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { motion } from "framer-motion";

export default function App() {
    const [tests, setTests] = useState([{ url: "", expectedProducts: "" }]);
    const [results, setResults] = useState([]);
    const [alertMessages, setAlertMessages] = useState([]);
    const [loading, setLoading] = useState(false);
    

    const excludedH2s = [
        "Ingresá a tu cuenta",
        "Visitá nuestras categorías",
        "Nuestras marcas",
        "Categorías",
    ];

    const handleInputChange = (index, field, value) => {
        const newTests = [...tests];
        newTests[index][field] = value;
        setTests(newTests);
    };

    const addTest = () => {
        setTests([...tests, { url: "", expectedProducts: "" }]);
    };

    const runTests = async () => {
        setLoading(true);
        setResults([]);
        setAlertMessages([]);

        const API_URL = "https://minimalart-production.up.railway.app";
        const newResults = [];
        const newAlerts = [];

        for (let i = 0; i < tests.length; i++) {
            const { url, expectedProducts } = tests[i];

            if (!url) continue;

            try {
                const response = await fetch(`${API_URL}/run-test`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ url, expectedProducts }),
                });

                const data = await response.json();
                const filteredH2 = data.h2Elements.filter(h2 => !excludedH2s.includes(h2));
                newResults.push({ ...data, h2Elements: filteredH2, index: i });

                if (expectedProducts && filteredH2.length !== parseInt(expectedProducts)) {
                    newAlerts.push({
                        index: i,
                        message: `⚠️ ¡Atención! En la URL ${url}, se esperaban ${expectedProducts} productos, pero se encontraron ${filteredH2.length}.`,
                    });
                }

                // Nueva prueba: Verificar si la URL es accesible
                if (!data.success) {
                    newAlerts.push({
                        index: i,
                        message: `❌ Error: La URL ${url} no está disponible o tardó demasiado en cargar.`,
                    });
                }
            } catch (error) {
                console.error("Error en el test ejecutado:", error);
            }
        }

        setResults(newResults);
        setAlertMessages(newAlerts);
        setLoading(false);
    };

    const clearResults = () => {
        setResults([]);
        setAlertMessages([]);
    };

    return (
        <div className="container py-4">
            <motion.h1
                className="text-center mb-4"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                Automatización AeC - Minimalart
            </motion.h1>

            {tests.map((test, index) => (
                <motion.div 
                    key={index} 
                    className="card p-3 mb-3 shadow-sm" 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                    <div className="mb-2">
                        <input
                            type="text"
                            placeholder="Ingresar URL"
                            value={test.url}
                            onChange={(e) => handleInputChange(index, "url", e.target.value)}
                            className="form-control"
                        />
                    </div>
                    <div>
                        <input
                            type="number"
                            placeholder="Productos esperados"
                            value={test.expectedProducts}
                            onChange={(e) => handleInputChange(index, "expectedProducts", e.target.value)}
                            className="form-control"
                        />
                    </div>
                </motion.div>
            ))}

            <div className="d-flex gap-2 justify-content-center">
                <button onClick={addTest} className="btn btn-secondary">+ Añadir URL</button>
                <button onClick={runTests} className="btn btn-info" disabled={loading}>
                    {loading ? "Ejecutando..." : "Comenzar el test"}
                </button>
                <button onClick={clearResults} className="btn btn-dark">Borrar resultados</button>
            </div>

            {alertMessages.map((alert, index) => (
                <motion.div
                    key={index}
                    className="alert alert-warning mt-3"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5 }}
                >
                    {alert.message}
                </motion.div>
            ))}

            {results.length > 0 && (
                <motion.div className="mt-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
                    {results.map((result, index) => (
                        <motion.div
                            key={index}
                            className="card p-3 mb-3 shadow-sm"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: index * 0.1 }}
                        >
                            <h5 className="card-title">Título de la página: {result.title}</h5>
                            <p className="text-muted">Productos esperados: {result.expectedProducts}</p>
                            <h6>Productos encontrados:</h6>
                            <ul className="list-group">
                                {result.h2Elements.length > 0 ? (
                                    result.h2Elements.map((h2, i) => <li key={i} className="list-group-item">{h2}</li>)
                                ) : (
                                    <li className="list-group-item text-muted">No se encontraron elementos H2</li>
                                )}
                            </ul>
                        </motion.div>
                    ))}
                </motion.div>
            )}
        </div>
    );
}
