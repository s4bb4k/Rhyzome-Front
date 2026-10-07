import {useEffect, useState} from "react";
import {useLocation, useNavigate} from "react-router-dom";
import {
    generateAdaptiveMap
} from "../../../services/mapsApi";

import {
    saveMap,
    getMapMatrix
} from "../../../services/mapsStorage";

import {
    Map,
    LogOut,
    Trees,
    Sun,
    Building2,
    Skull,
    Shuffle,
    Save,
    FileJson,
    Image,
    Sparkles,
    BookOpen,
    X,
    BadgeCheck
} from "lucide-react";

import {supabase} from "../../../lib/supabase";

function Dashboard() {
    const navigate = useNavigate();
    const location = useLocation();
    const savedMap = location.state?.savedMap ?? null;

    const [mapType, setMapType] = useState(
        () => localStorage.getItem("rhizome.mapType") || "Mazmorra"
    );

    const [width, setWidth] = useState(50);
    const [height, setHeight] = useState(35);
    const [seed, setSeed] = useState(539989);

    const [algorithm, setAlgorithm] = useState(
        () => localStorage.getItem("rhizome.algorithm") || "cellular"
    );
    const [showManual, setShowManual] = useState(false);

    const [complexity, setComplexity] = useState("Medio");
    const [tileSize, setTileSize] = useState(16);

    const [generating, setGenerating] = useState(false);
    const [generatedMap, setGeneratedMap] = useState(null);
    const [generationError, setGenerationError] = useState("");

    // Métricas de solo lectura. No usamos setters independientes:
    // los valores se derivan de la respuesta real del backend.
    const evaluationMetrics = getEvaluationMetrics(generatedMap);
    const quality = evaluationMetrics.quality;
    const compression = evaluationMetrics.compression;
    const accessibility = evaluationMetrics.accessibility;

    useEffect(() => {
        localStorage.setItem("rhizome.mapType", mapType);
        localStorage.setItem("rhizome.algorithm", algorithm);
    }, [mapType, algorithm]);

    // Si el usuario abre un mapa desde "Mis Mapas", cargamos exactamente
    // sus parámetros y el resultado almacenado, sin regenerarlo automáticamente.
    useEffect(() => {
        if (!savedMap) return;

        const mapTypeMap = {
            bosque: "Bosque",
            desierto: "Desierto",
            ciudad: "Ciudad",
            urbano: "Ciudad",
            mazmorra: "Mazmorra",
        };

        const complexityMap = {
            low: "Bajo",
            medium: "Medio",
            high: "Alto",
            bajo: "Bajo",
            medio: "Medio",
            alto: "Alto",
        };

        const restoredType =
            mapTypeMap[String(savedMap.map_type ?? "").toLowerCase()] ||
            "Bosque";

        const restoredAlgorithm =
            String(
                savedMap.algorithm ??
                (restoredType === "Mazmorra" ? "cellular" : "perlin")
            ).toLowerCase();

        setMapType(restoredType);
        setAlgorithm(restoredAlgorithm);
        setWidth(Number(savedMap.width ?? 50));
        setHeight(Number(savedMap.height ?? 35));
        setSeed(Number(savedMap.seed ?? 42));
        setComplexity(
            complexityMap[String(savedMap.complexity ?? "").toLowerCase()] ||
            "Medio"
        );
        setTileSize(Number(savedMap.tile_size ?? 16));

        const storedGeneration = savedMap.generation_data;

        if (storedGeneration && typeof storedGeneration === "object") {
            setGeneratedMap(storedGeneration);
        } else {
            setGeneratedMap({
                map: savedMap.matrix,
                matrix: savedMap.matrix,
                metrics: savedMap.metrics,
                seed: savedMap.seed,
                algorithm: restoredAlgorithm,
            });
        }

        setGenerationError("");
    }, [savedMap]);

    useEffect(() => {
        if (!showManual) return undefined;

        const closeOnEscape = (event) => {
            if (event.key === "Escape") setShowManual(false);
        };

        window.addEventListener("keydown", closeOnEscape);
        return () => window.removeEventListener("keydown", closeOnEscape);
    }, [showManual]);

    const handleSaveMap = async () => {
        if (!generatedMap) {
            alert("Primero debes generar un mapa.");
            return;
        }

        try {
            const savedMap = await saveMap({
                mapType, algorithm, width, height, seed, complexity, tileSize, generatedMap,
            });
            console.log("Mapa guardado en Supabase:", savedMap);
            alert("Mapa guardado correctamente.");
        } catch (error) {
            console.error("Error guardando mapa:", error);
            alert(error?.message || "No fue posible guardar el mapa.");
        }
    };

    const handleExportJSON = () => {
        if (!generatedMap) return;

        const exportData = {
            rhyzome_version: "1.0",
            exported_at: new Date().toISOString(),
            configuration: {
                map_type: mapType,
                algorithm,
                width: Number(width),
                height: Number(height),
                seed: Number(seed),
                complexity,
                tile_size: Number(tileSize),
            },
            result: generatedMap,
        };

        const blob = new Blob([JSON.stringify(exportData, null, 2)], {
            type: "application/json",
        });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `rhyzome_${mapType.toLowerCase()}_${seed}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const handleExportPNG = () => {
        if (!generatedMap) return;

        const matrix = getMapMatrix(generatedMap);
        if (!Array.isArray(matrix) || !Array.isArray(matrix[0])) {
            alert("No se encontró una matriz válida para exportar.");
            return;
        }

        const rows = matrix.length;
        const columns = matrix[0].length;
        const pixelSize = 10;
        const canvas = document.createElement("canvas");
        canvas.width = columns * pixelSize;
        canvas.height = rows * pixelSize;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        matrix.forEach((row, y) => {
            row.forEach((cell, x) => {
                ctx.fillStyle = getExportColor(mapType, Number(cell));
                ctx.fillRect(x * pixelSize, y * pixelSize, pixelSize, pixelSize);
            });
        });

        const link = document.createElement("a");
        link.download = `rhyzome_${mapType.toLowerCase()}_${seed}.png`;
        link.href = canvas.toDataURL("image/png");
        link.click();
    };

    const selectMapType = (selectedType) => {
        setMapType(selectedType);
        setAlgorithm(selectedType === "Mazmorra" ? "cellular" : "perlin");
    };

    const generateMap = async () => {
        try {
            setGenerating(true);
            setGenerationError("");

            const complexityMap = {
                Bajo: "low",
                Medio: "medium",
                Alto: "high",
            };

            const payload = {
                terrain_type: mapType,
                algorithm,
                width: Number(width),
                height: Number(height),
                seed: Number(seed),
                complexity: complexityMap[complexity] || "medium",
                tile_size: Number(tileSize),
                attempts: 20,
            };

            console.log("Solicitud enviada al backend:", payload);

            const response = await generateAdaptiveMap(payload);

            console.log("Respuesta del backend:", response);
            setGeneratedMap(response);
        } catch (error) {
            console.error("Error generando mapa:", error);
            setGeneratedMap(null);
            setGenerationError(
                error?.message || "No fue posible generar el mapa. Verifica la conexión con el backend."
            );
        } finally {
            setGenerating(false);
        }
    };

    const generateRandomSeed = () => {
        setSeed(Math.floor(Math.random() * 999999));
    };

    const logout = async () => {
        await supabase.auth.signOut();
        navigate("/");
    };

    return (
        <div className="dashboard">

            {/* HEADER */}
            <header className="dashboard-header">

                <div className="brand">
                    <div className="brand-icon">
                        <Map size={17}/>
                    </div>

                    <strong>Rhizome</strong>
                </div>

                <div className="header-actions">

                    <button
                        type="button"
                        className="manual-button"
                        onClick={() => setShowManual(true)}
                    >
                        <BookOpen size={14}/>
                        Manual de usuario
                    </button>

                    <button
                        type="button"
                        className="maps-button"
                        onClick={() => navigate("/maps")}
                    >
                        <Map size={14}/>
                        Mis mapas
                    </button>

                    <button
                        className="logout-button"
                        onClick={logout}
                        title="Cerrar sesión"
                    >
                        <LogOut size={15}/>
                    </button>

                </div>

            </header>

            <div className="dashboard-content">

                {/* SIDEBAR */}
                <aside className="sidebar">

                    <div className="sidebar-title">
                        PARÁMETROS
                    </div>

                    {/* TIPO DE MAPA */}
                    <section className="parameter-section">

                        <div className="section-label">
                            TIPO DE MAPA
                        </div>

                        <div className="map-types">

                            <button
                                className={mapType === "Bosque" ? "map-type active" : "map-type"}
                                onClick={() => selectMapType("Bosque")}
                            >
                                <Trees size={14}/>
                                Bosque
                            </button>

                            <button
                                className={mapType === "Desierto" ? "map-type active" : "map-type"}
                                onClick={() => selectMapType("Desierto")}
                            >
                                <Sun size={14}/>
                                Desierto
                            </button>

                            <button
                                className={mapType === "Ciudad" ? "map-type active" : "map-type"}
                                onClick={() => selectMapType("Ciudad")}
                            >
                                <Building2 size={14}/>
                                Ciudad
                            </button>

                            <button
                                className={mapType === "Mazmorra" ? "map-type active" : "map-type"}
                                onClick={() => selectMapType("Mazmorra")}
                            >
                                <Skull size={14}/>
                                Mazmorra
                            </button>

                        </div>

                    </section>

                    {/* DIMENSIONES */}
                    <section className="parameter-section">

                        <div className="section-label">
                            DIMENSIONES
                        </div>

                        <Slider
                            label="ANCHO"
                            value={width}
                            min={10}
                            max={100}
                            onChange={setWidth}
                        />

                        <Slider
                            label="ALTO"
                            value={height}
                            min={10}
                            max={100}
                            onChange={setHeight}
                        />

                    </section>

                    {/* SEED */}
                    <section className="parameter-section">

                        <div className="section-label">
                            SEMILLA (SEED)
                        </div>

                        <div className="seed-container">

                            <input
                                type="number"
                                value={seed}
                                onChange={(e) => setSeed(e.target.value)}
                            />

                            <button onClick={generateRandomSeed}>
                                <Shuffle size={14}/>
                            </button>

                        </div>

                    </section>

                    {/* ALGORITMOS */}
                    <section className="parameter-section">

                        <div className="section-label">
                            ALGORITMOS
                        </div>

                        <div className="recommendation-message">
                            <BadgeCheck size={14}/>
                            Recomendado
                            para {mapType}: {mapType === "Mazmorra" ? "Autómatas Celulares" : "Ruido Perlin"}
                        </div>

                        <Algorithm
                            title="Ruido Perlin/Simplex"
                            description="Terreno orgánico y natural"
                            enabled={algorithm === "perlin"}
                            onSelect={() => {}}
                        />

                        <Algorithm
                            title="Autómatas Celulares"
                            description="Genera cuevas y grutas"
                            enabled={algorithm === "cellular"}
                            onSelect={() => {}}
                        />

                    </section>

                    {/* COMPLEJIDAD */}
                    <section className="parameter-section">

                        <div className="section-label">
                            PARÁMETROS AVANZADOS
                        </div>

                        <div className="sub-label">
                            NIVEL DE COMPLEJIDAD
                        </div>

                        <div className="complexity">

                            {["Bajo", "Medio", "Alto"].map((level) => (
                                <button
                                    key={level}
                                    className={
                                        complexity === level
                                            ? "complexity-button active"
                                            : "complexity-button"
                                    }
                                    onClick={() => setComplexity(level)}
                                >
                                    <strong>{level}</strong>

                                    <small>
                                        {level === "Bajo"
                                            ? "Simple y legible"
                                            : level === "Medio"
                                                ? "Balance equilibrado"
                                                : "Detallado y denso"}
                                    </small>
                                </button>
                            ))}

                        </div>

                        <Slider
                            label="TAMAÑO DE TILE (PX)"
                            value={tileSize}
                            min={8}
                            max={32}
                            onChange={setTileSize}
                        />

                    </section>

                    {/* EVALUACIÓN - SOLO LECTURA */}
                    <section className="parameter-section">
                        <div className="section-label">
                            EVALUACIÓN
                        </div>

                        <Slider
                            label="CALIDAD"
                            value={quality}
                            min={0}
                            max={100}
                            suffix="%"
                            readOnly
                        />

                        <Slider
                            label="COMPRENSIÓN"
                            value={compression}
                            min={0}
                            max={100}
                            suffix="%"
                            readOnly
                        />

                        <Slider
                            label="ACCESIBILIDAD"
                            value={accessibility}
                            min={0}
                            max={100}
                            suffix="%"
                            readOnly
                        />
                    </section>

                    {/* ACTIONS */}
                    <div className="sidebar-actions">

                        <button
                            className="generate-button"
                            onClick={generateMap}
                            disabled={generating}
                        >
                            <Sparkles size={15}/>

                            {generating
                                ? "Generando..."
                                : "Generar mapa"}
                        </button>

                        <div className="export-buttons">

                            <button onClick={handleSaveMap} disabled={!generatedMap}>
                                <Save size={14}/>
                                Guardar
                            </button>

                            <button onClick={handleExportJSON} disabled={!generatedMap}>
                                <FileJson size={14}/>
                                JSON
                            </button>

                            <button onClick={handleExportPNG} disabled={!generatedMap}>
                                <Image size={14}/>
                                PNG
                            </button>

                        </div>

                    </div>

                </aside>

                {/* WORKSPACE: solo muestra el mapa generado */}
                <main className="workspace">
                    {generationError ? (
                        <div className="empty-workspace">
                            <X size={44} strokeWidth={1.5}/>
                            <h2>No fue posible generar el mapa</h2>
                            <p>{generationError}</p>
                        </div>
                    ) : generatedMap ? (
                        <MapMatrixPreview response={generatedMap} mapType={mapType}/>
                    ) : (
                        <div className="empty-workspace">
                            <Map size={44} strokeWidth={1.5}/>
                            <h2>Configura y genera tu mapa</h2>
                            <p>
                                Ajusta los parámetros de la izquierda y presiona
                                <strong> "Generar mapa"</strong> para crear tu mapa procedural.
                            </p>
                        </div>
                    )}
                </main>

            </div>

            {/* FOOTER */}
            <footer className="dashboard-footer">

        <span>
          Rhizome
        </span>

                <span>
          © 2026
        </span>

                <span>
          Generador Procedural de Mapas
        </span>

            </footer>

            {showManual && (
                <div
                    className="modal-backdrop"
                    role="presentation"
                    onMouseDown={(event) => {
                        if (event.target === event.currentTarget) setShowManual(false);
                    }}
                >
                    <section
                        className="manual-modal"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="manual-title"
                    >
                        <div className="manual-modal-header">
                            <div>
                                <span className="manual-eyebrow">AYUDA</span>
                                <h2 id="manual-title">Manual de usuario</h2>
                            </div>
                            <button
                                type="button"
                                className="modal-close"
                                onClick={() => setShowManual(false)}
                                aria-label="Cerrar manual"
                            >
                                <X size={18}/>
                            </button>
                        </div>

                        <div className="manual-content">
                            <ol>
                                <li><strong>Selecciona el mapa.</strong> El sistema marcará automáticamente el algoritmo
                                    recomendado.
                                </li>
                                <li><strong>Ajusta las dimensiones y la semilla.</strong> La misma semilla permite
                                    reproducir un mapa.
                                </li>
                                <li><strong>Configura la complejidad y evaluación.</strong> Revisa los valores antes de
                                    generar.
                                </li>
                                <li><strong>Genera el mapa.</strong> Después podrás guardarlo o exportarlo como JSON o
                                    PNG.
                                </li>
                            </ol>

                            <div className="manual-recommendations">
                                <h3>Algoritmos recomendados</h3>
                                <p><strong>Bosque, Desierto y Ciudad:</strong> Ruido Perlin/Simplex.</p>
                                <p><strong>Mazmorra:</strong> Autómatas Celulares.</p>
                            </div>
                        </div>

                        <button
                            type="button"
                            className="manual-understood"
                            onClick={() => setShowManual(false)}
                        >
                            Entendido
                        </button>
                    </section>
                </div>
            )}

        </div>
    );
}


/* ----------------------------- */
/* COMPONENTES AUXILIARES */

/* ----------------------------- */

function Slider({
                    label,
                    value,
                    min,
                    max,
                    onChange,
                    suffix = "",
                    readOnly = false,
                }) {
    return (
        <div className="slider-group">

            <div className="slider-header">
                <span>{label}</span>
                <strong>{value}{suffix}</strong>
            </div>

            <input
                type="range"
                min={min}
                max={max}
                value={value}
                onChange={
                    readOnly
                        ? undefined
                        : (e) => onChange?.(Number(e.target.value))
                }
                aria-readonly={readOnly}
                tabIndex={readOnly ? -1 : 0}
                style={readOnly ? {pointerEvents: "none"} : undefined}
            />

        </div>
    );
}


function Algorithm({
                       title,
                       description,
                       enabled,
                       onSelect,
                   }) {
    return (
        <div className="algorithm">

            <div>

                <strong>
                    {title}
                </strong>

                <small>
                    {description}
                </small>

            </div>

            <button
                className={enabled ? "switch active" : "switch"}
                onClick={onSelect}
                role="radio"
                aria-checked={enabled}
                aria-label={`Seleccionar ${title}`}
            >
                <span/>
            </button>

        </div>
    );
}

function MapMatrixPreview({response, mapType}) {
    const matrix =
        response?.matrix ||
        response?.map ||
        response?.map_data?.matrix ||
        response?.data?.matrix ||
        response?.result?.matrix;

    if (!Array.isArray(matrix) || !Array.isArray(matrix[0])) {
        return (
            <div className="recommendation-message">
                El backend respondió correctamente, pero la matriz no está en un campo reconocido.
                Puedes revisar la respuesta JSON debajo para identificar su ubicación.
            </div>
        );
    }

    const rows = matrix.length;
    const columns = matrix[0].length;
    const maxPreview = 70;
    const rowStep = Math.max(1, Math.ceil(rows / maxPreview));
    const columnStep = Math.max(1, Math.ceil(columns / maxPreview));
    const preview = matrix
        .filter((_, rowIndex) => rowIndex % rowStep === 0)
        .map((row) => row.filter((_, columnIndex) => columnIndex % columnStep === 0));

    return (
        <div
            className="map-matrix-preview"
            style={{
                display: "grid",
                gridTemplateColumns: `repeat(${preview[0].length}, minmax(3px, 1fr))`,
                width: "min(100%, 720px)",
                aspectRatio: `${columns} / ${rows}`,
                overflow: "hidden",
                borderRadius: "10px",
                marginTop: "18px",
                background: "#111827",
            }}
            aria-label={`Vista previa del mapa de ${columns} por ${rows}`}
        >
            {preview.flatMap((row, rowIndex) =>
                row.map((cell, columnIndex) => (
                    <span
                        key={`${rowIndex}-${columnIndex}`}
                        title={`Valor: ${cell}`}
                        style={{
                            background: getCellColor(mapType, Number(cell)),
                            minWidth: 0,
                            minHeight: 0,
                        }}
                    />
                ))
            )}
        </div>
    );
}



function toPercent(value) {
    const number = Number(value);
    if (!Number.isFinite(number)) return 0;

    // Algunas métricas del backend pueden venir en rango 0..1.
    const percent = number >= 0 && number <= 1 ? number * 100 : number;
    return Math.max(0, Math.min(100, Math.round(percent)));
}

function getEvaluationMetrics(response) {
    if (!response) {
        return {quality: 0, compression: 0, accessibility: 0};
    }

    const metrics =
        response.evaluation ||
        response.metrics ||
        response.statistics ||
        response.stats ||
        response.map_metrics ||
        response.result?.metrics ||
        {};

    const qualityValue =
        metrics.quality ??
        metrics.quality_score ??
        response.quality ??
        response.quality_score;

    const compressionValue =
        metrics.comprehension ??
        metrics.compression ??
        metrics.comprehension_score ??
        metrics.compression_score ??
        response.comprehension ??
        response.compression;

    const accessibilityValue =
        metrics.accessibility ??
        metrics.accessibility_score ??
        metrics.floor_ratio ??
        response.accessibility ??
        response.floor_ratio;

    return {
        quality: toPercent(qualityValue),
        compression: toPercent(compressionValue),
        accessibility: toPercent(accessibilityValue),
    };
}

function getCellColor(mapType, value) {
    const active = value !== 0;

    if (mapType === "Bosque") {
        return active ? "#22c55e" : "#123524";
    }

    if (mapType === "Desierto") {
        return active ? "#f4c76b" : "#8b5e34";
    }

    if (mapType === "Ciudad") {
        return active ? "#cbd5e1" : "#334155";
    }

    return active ? "#d1d5db" : "#111827";
}

function getExportColor(mapType, value) {
    const active = value !== 0;
    if (mapType === "Bosque") return active ? "#22c55e" : "#123524";
    if (mapType === "Desierto") return active ? "#f4c76b" : "#8b5e34";
    if (mapType === "Ciudad") return active ? "#cbd5e1" : "#334155";
    return active ? "#d1d5db" : "#111827";
}

export default Dashboard;
