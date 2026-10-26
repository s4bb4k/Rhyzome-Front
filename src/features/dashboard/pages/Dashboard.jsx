import {useLocation, useNavigate} from "react-router-dom";
import MapRenderer from "../../../components/MapRenderer";
import {getTerrainSprite} from "../../../utils/terrainSprites";

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
    BadgeCheck,
    CheckCircle2,
    LoaderCircle
} from "lucide-react";

import {supabase} from "../../../lib/supabase";

import {toast} from "sonner";
import "../../../components/css/DashboardActions.css";

import MapLoader from "../../../components/MapLoader";
import {
    useEffect,
    useMemo,
    useRef,
    useState
} from "react";
import MetricTooltip from "../../../components/MetricTooltip";
import MapLegend from "../../../components/MapLegend";
import MapViewer from "../../../components/MapViewer";
import GenerationError from "../../../components/GenerationError.jsx";
import GenerationStatus from "../../../components/GenerationStatus";
import UnsavedMapDialog from "../../../components/UnsavedMapDialog";
import MapHistory from "../../../components/MapHistory";

function restoreSavedMap(savedMap) {
    if (!savedMap) return null;

    const mapTypes = {
        bosque: "Bosque", desierto: "Desierto", ciudad: "Ciudad",
        urbano: "Ciudad", mazmorra: "Mazmorra",
    };
    const complexities = {
        low: "Bajo", medium: "Medio", high: "Alto",
        bajo: "Bajo", medio: "Medio", alto: "Alto",
    };
    const mapType = mapTypes[String(savedMap.map_type ?? "").toLowerCase()] || "Bosque";
    const algorithm = String(
        savedMap.algorithm ?? (mapType === "Mazmorra" ? "cellular" : "perlin")
    ).toLowerCase();
    const storedGeneration = savedMap.generation_data;
    const generatedMap = storedGeneration && typeof storedGeneration === "object"
        ? storedGeneration
        : {
            map: savedMap.matrix,
            matrix: savedMap.matrix,
            metrics: savedMap.metrics,
            seed: savedMap.seed,
            algorithm,
        };

    return {
        mapType,
        algorithm,
        width: Number(savedMap.width ?? 50),
        height: Number(savedMap.height ?? 35),
        seed: Number(savedMap.seed ?? 42),
        complexity: complexities[String(savedMap.complexity ?? "").toLowerCase()] || "Medio",
        tileSize: Number(savedMap.tile_size ?? 16),
        generatedMap,
    };
}

function Dashboard() {
    const navigate = useNavigate();
    const location = useLocation();
    const savedMap = location.state?.savedMap ?? null;

    // La función inicializadora se ejecuta solo al montar esta instancia.
    const [restored] = useState(() => restoreSavedMap(savedMap));

    const [mapType, setMapType] = useState(
        () => restored?.mapType ?? localStorage.getItem("rhizome.mapType") ?? "Mazmorra"
    );
    const [width, setWidth] = useState(() => restored?.width ?? 50);
    const [height, setHeight] = useState(() => restored?.height ?? 35);
    const [seed, setSeed] = useState(() => restored?.seed ?? 539989);
    const [algorithm, setAlgorithm] = useState(
        () => restored?.algorithm ?? localStorage.getItem("rhizome.algorithm") ?? "cellular"
    );
    const [showManual, setShowManual] = useState(false);
    const [complexity, setComplexity] = useState(() => restored?.complexity ?? "Medio");
    const [tileSize, setTileSize] = useState(() => restored?.tileSize ?? 16);
    const [generating, setGenerating] = useState(false);
    const [generatedMap, setGeneratedMap] = useState(() => restored?.generatedMap ?? null);
    const [generationError, setGenerationError] = useState("");

    const [generationErrorType, setGenerationErrorType] =
        useState("unknown");

    const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
    const [pendingHistoryId, setPendingHistoryId] = useState(null);
    const [mapHistory, setMapHistory] = useState([]);
    const [activeMapId, setActiveMapId] = useState(null);
    const historyCounterRef = useRef(0);

    const [lastGeneratedConfig, setLastGeneratedConfig] = useState(() =>
        restored ? getGenerationConfig(restored) : null
    );

    // Estado del guardado del mapa actual
    const [isSaving, setIsSaving] = useState(false);
    // Si se abrió desde Mis Mapas, ya está guardado
    const [isMapSaved, setIsMapSaved] = useState(
        () => Boolean(savedMap)
    );
    // Evita dos solicitudes de guardado simultáneas
    const savingRef = useRef(false);

    // Comparar únicamente los parámetros que afectan la generación.
    // tileSize se excluye: modifica la visualización, no la matriz.
    const currentGenerationConfig = useMemo(() => getGenerationConfig({
        mapType,
        algorithm,
        width,
        height,
        seed,
        complexity,
    }), [mapType, algorithm, width, height, seed, complexity]);

    const hasPendingChanges = useMemo(() => {
        if (!generatedMap || !lastGeneratedConfig) return false;
        return JSON.stringify(currentGenerationConfig) !==
            JSON.stringify(lastGeneratedConfig);
    }, [generatedMap, currentGenerationConfig, lastGeneratedConfig]);

    // El mapa visible y sus exportaciones deben usar la configuración con la
    // que se generó, no los valores editados que aún están pendientes.
    const visibleMapType = lastGeneratedConfig?.mapType ?? mapType;
    const visibleAlgorithm = lastGeneratedConfig?.algorithm ?? algorithm;
    const visibleWidth = lastGeneratedConfig?.width ?? Number(width);
    const visibleHeight = lastGeneratedConfig?.height ?? Number(height);
    const visibleSeed = lastGeneratedConfig?.seed ?? String(seed);
    const visibleComplexity = lastGeneratedConfig?.complexity ?? complexity;

    // Métricas de solo lectura. No usamos setters independientes:
    // los valores se derivan de la respuesta real del backend.
    const evaluationMetrics = getEvaluationMetrics(generatedMap);
    const quality = evaluationMetrics.quality;
    const connectivity = evaluationMetrics.connectivity;
    const accessibility = evaluationMetrics.accessibility;



    useEffect(() => {
        localStorage.setItem("rhizome.mapType", mapType);
        localStorage.setItem("rhizome.algorithm", algorithm);
    }, [mapType, algorithm]);

    useEffect(() => {
        if (!showManual) return undefined;

        const closeOnEscape = (event) => {
            if (event.key === "Escape") setShowManual(false);
        };

        window.addEventListener("keydown", closeOnEscape);
        return () => window.removeEventListener("keydown", closeOnEscape);
    }, [showManual]);

    const handleSaveMap = async () => {

        // Evitar guardar sin un mapa generado
        if (!generatedMap) {
            toast.warning("Primero debes generar un mapa.");
            return;
        }

        // Evitar solicitudes simultáneas
        if (savingRef.current) {
            return;
        }

        // Evitar guardar nuevamente el mismo resultado
        if (isMapSaved) {
            toast.info("Este mapa ya se encuentra guardado.");
            return;
        }

        savingRef.current = true;
        setIsSaving(true);

        try {

            const savedMapResult = await saveMap({
                mapType: visibleMapType,
                algorithm: visibleAlgorithm,
                width: visibleWidth,
                height: visibleHeight,
                seed: visibleSeed,
                complexity: visibleComplexity,
                tileSize,
                generatedMap,
            });

            console.log(
                "Mapa guardado en Supabase:",
                savedMapResult
            );

            // Marcar el resultado actual como guardado, también en el historial.
            setIsMapSaved(true);
            setMapHistory((previous) => previous.map((item) =>
                item.id === activeMapId ? { ...item, isSaved: true } : item
            ));

            toast.success("Mapa guardado correctamente", {
                description:
                    "Puedes consultarlo en la sección Mis Mapas.",
            });

        } catch (error) {

            console.error("Error guardando mapa:", error);

            toast.error("No fue posible guardar el mapa", {
                description:
                    error?.message ||
                    "Ocurrió un error al guardar el mapa en Supabase.",
            });

        } finally {

            savingRef.current = false;
            setIsSaving(false);

        }
    };

    const handleExportJSON = () => {
        if (!generatedMap) return;

        const exportData = {
            rhyzome_version: "1.0",
            exported_at: new Date().toISOString(),
            configuration: {
                map_type: visibleMapType,
                algorithm: visibleAlgorithm,
                width: visibleWidth,
                height: visibleHeight,
                seed: Number(visibleSeed),
                complexity: visibleComplexity,
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
        link.download = `rhyzome_${visibleMapType.toLowerCase()}_${visibleSeed}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const handleExportPNG = async () => {
        if (!generatedMap) return;

        const matrix = getMapMatrix(generatedMap);

        // Validar que exista una matriz rectangular
        if (
            !Array.isArray(matrix) ||
            matrix.length === 0 ||
            !Array.isArray(matrix[0]) ||
            matrix[0].length === 0 ||
            !matrix.every(
                (row) =>
                    Array.isArray(row) &&
                    row.length === matrix[0].length
            )
        ) {
            toast.error("No se encontró una matriz válida para exportar.");
            return;
        }

        const rows = matrix.length;
        const columns = matrix[0].length;

        // Utilizar el tamaño seleccionado en el Dashboard
        const pixelSize = Math.max(1, Math.round(Number(tileSize) || 16));

        const terrainType = String(
            generatedMap.ui_config?.terrain_type ??
            generatedMap.parameters?.terrain_type ??
            visibleMapType
        ).toLowerCase();

        try {
            // Obtener los sprites necesarios para el terreno
            const spriteSources = new Set();

            matrix.forEach((row) => {
                row.forEach((cell) => {
                    const sprite = getTerrainSprite(
                        terrainType,
                        Number(cell)
                    );

                    if (sprite) {
                        spriteSources.add(sprite);
                    }
                });
            });

            // Cargar cada sprite una sola vez
            const spriteEntries = await Promise.all(
                [...spriteSources].map(async (src) => {
                    const image = await loadSprite(src);
                    return [src, image];
                })
            );

            const loadedSprites = new globalThis.Map(spriteEntries);

            // Crear el canvas
            const canvas = document.createElement("canvas");

            canvas.width = columns * pixelSize;
            canvas.height = rows * pixelSize;

            const ctx = canvas.getContext("2d");

            if (!ctx) {
                throw new Error(
                    "No se pudo crear el contexto del canvas."
                );
            }

            // Mantener la apariencia pixel art
            ctx.imageSmoothingEnabled = false;

            // Dibujar la matriz utilizando los sprites
            matrix.forEach((row, y) => {
                row.forEach((cell, x) => {
                    const cellValue = Number(cell);

                    const spriteSrc = getTerrainSprite(
                        terrainType,
                        cellValue
                    );

                    const image = loadedSprites.get(spriteSrc);

                    const posX = x * pixelSize;
                    const posY = y * pixelSize;

                    // Color de respaldo
                    ctx.fillStyle = getExportColor(
                        terrainType,
                        cellValue
                    );

                    ctx.fillRect(
                        posX,
                        posY,
                        pixelSize,
                        pixelSize
                    );

                    if (!image) return;

                    // Aplicar el mismo contraste del Dashboard
                    if (terrainType === "mazmorra") {
                        ctx.filter =
                            cellValue === 0
                                ? "brightness(0.35)"
                                : "brightness(1.15)";
                    } else {
                        ctx.filter = "none";
                    }

                    ctx.drawImage(
                        image,
                        posX,
                        posY,
                        pixelSize,
                        pixelSize
                    );

                    // Evitar que el filtro afecte otras celdas
                    ctx.filter = "none";
                });
            });

            // Exportar PNG
            const blob = await new Promise((resolve, reject) => {
                canvas.toBlob(
                    (result) => {
                        if (result) {
                            resolve(result);
                        } else {
                            reject(
                                new Error("No se pudo generar el PNG.")
                            );
                        }
                    },
                    "image/png"
                );
            });

            const url = URL.createObjectURL(blob);

            const link = document.createElement("a");

            link.href = url;

            link.download =
                `rhyzome_${terrainType}_${visibleSeed}.png`;

            document.body.appendChild(link);
            link.click();
            link.remove();

            toast.success("Descarga PNG iniciada");
            // Liberar la URL temporal después de iniciar la descarga
            setTimeout(() => URL.revokeObjectURL(url), 1000);

        } catch (error) {
            console.error("Error exportando PNG:", error);

            toast.error(
                error?.message ||
                "No fue posible exportar el mapa como PNG."
            );
        }
    };

    const selectMapType = (selectedType) => {
        setMapType(selectedType);
        setAlgorithm(selectedType === "Mazmorra" ? "cellular" : "perlin");
    };

    const generateMap = async () => {
        if (generating || isSaving) return;
        console.log("GENERACIÓN NUEVA SOLICITADA");
        try {
            setGenerating(true);
            setGenerationError("");
            setGenerationErrorType("unknown");

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

            // Captura exactamente los parámetros enviados a esta solicitud.
            const requestedConfig = getGenerationConfig({
                mapType,
                algorithm,
                width,
                height,
                seed,
                complexity,
            });

            console.log("Solicitud enviada al backend:", payload);

            const response = await generateAdaptiveMap(payload);
            // Simular una demora de 3 segundos solo en desarrollo
            /*if (import.meta.env.DEV) {
                await new Promise((resolve) => setTimeout(resolve, 3000));
            }*/
            console.log("========== DIAGNÓSTICO VITE ==========");
            console.log("MODE:", import.meta.env.MODE);
            console.log("DEV:", import.meta.env.DEV);
            console.log("VITE_API_BASE_URL:", import.meta.env.VITE_API_BASE_URL);
            console.log("ORIGEN FRONTEND:", window.location.origin);
            console.log("======================================");

            console.log("Respuesta del backend:", response);
            setGeneratedMap(response);
            setLastGeneratedConfig(requestedConfig);
            // El nuevo mapa todavía no está guardado.
            setIsMapSaved(false);

            // Solo registrar respuestas exitosas, conservando como máximo cinco.
            historyCounterRef.current += 1;
            const historyId = `map-${historyCounterRef.current}`;
            const entry = {
                id: historyId,
                generatedMap: response,
                config: requestedConfig,
                tileSize: Number(tileSize),
                quality: getEvaluationMetrics(response).quality,
                isSaved: false,
            };
            setMapHistory((previous) => [entry, ...previous].slice(0, 5));
            setActiveMapId(historyId);

        } catch (error) {

            console.error("Error durante la generación del mapa:", error);
            const errorType = classifyGenerationError(error);
            // No borrar el último mapa exitoso ante un error de red.
            setGenerationErrorType(errorType);
            setGenerationError(
                error?.message || "No se pudo completar la generación del mapa."
            );
        } finally {
            setGenerating(false);
        }
    };

    /* ==========================================
   CONFIRMACIÓN DE MAPA SIN GUARDAR
   ========================================== */

    const handleGenerateRequest = () => {

        if (generating || isSaving) return;

        // Verificar si existe un mapa sin guardar
        if (generatedMap && !isMapSaved) {
            setShowUnsavedDialog(true);
            return;
        }

        // Generar directamente si no existe mapa
        // o si el mapa actual ya está guardado
        generateMap();
    };

    const restoreHistoryMap = (historyId) => {
        const selected = mapHistory.find((item) => item.id === historyId);
        if (!selected) return;

        const config = selected.config;
        setGeneratedMap(selected.generatedMap);
        setLastGeneratedConfig(config);
        setMapType(config.mapType);
        setAlgorithm(config.algorithm);
        setWidth(config.width);
        setHeight(config.height);
        setSeed(config.seed);
        setComplexity(config.complexity);
        setTileSize(selected.tileSize);
        setIsMapSaved(selected.isSaved);
        setActiveMapId(selected.id);
        setGenerationError("");
        setGenerationErrorType("unknown");
    };

    const handleSelectHistoryMap = (historyId) => {
        if (generating || isSaving || savingRef.current) return;
        if (historyId === activeMapId) return;
        if (!mapHistory.some((item) => item.id === historyId)) return;

        if (generatedMap && !isMapSaved) {
            setPendingHistoryId(historyId);
            setShowUnsavedDialog(true);
            return;
        }
        restoreHistoryMap(historyId);
    };

    const handleDeleteHistoryMap = (historyId) => {
        if (generating || isSaving || savingRef.current) return;
        setMapHistory((previous) => previous.filter((item) => item.id !== historyId));
        if (activeMapId === historyId) setActiveMapId(null);
        if (pendingHistoryId === historyId) {
            setPendingHistoryId(null);
            setShowUnsavedDialog(false);
        }
        toast.info("Mapa eliminado del historial temporal.");
    };

    const handleCancelGeneration = () => {
        setShowUnsavedDialog(false);
        setPendingHistoryId(null);
    };

    const handleConfirmGeneration = () => {
        if (generating || isSaving || savingRef.current) return;
        setShowUnsavedDialog(false);
        if (pendingHistoryId !== null) {
            const historyId = pendingHistoryId;
            setPendingHistoryId(null);
            restoreHistoryMap(historyId);
            return;
        }
        generateMap();
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

                    <strong>RHYZOME - VERSION LOCAL 2026</strong>
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
                            onSelect={() => {
                            }}
                        />

                        <Algorithm
                            title="Autómatas Celulares"
                            description="Genera cuevas y grutas"
                            enabled={algorithm === "cellular"}
                            onSelect={() => {
                            }}
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
                            label="Escala de visualización"
                            value={tileSize}
                            min={8}
                            max={32}
                            onChange={setTileSize}
                            suffix=" px"
                            tooltip="Ajusta el tamaño visual de las celdas del mapa en píxeles. Aumenta el valor para observar más detalles o redúcelo para visualizar una mayor parte del escenario. No modifica las dimensiones ni el contenido del mapa generado."
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
                            tooltip="Indicador general de calidad del mapa calculado por el sistema. Permite consultar la evaluación obtenida durante la generación."
                        />

                        <Slider
                            label="CONECTIVIDAD"
                            value={connectivity}
                            min={0}
                            max={100}
                            suffix="%"
                            readOnly
                            tooltip="Métrica relacionada con la conexión entre las zonas transitables del mapa, según el procedimiento de evaluación implementado."
                        />

                        <Slider
                            label="ACCESIBILIDAD"
                            value={accessibility}
                            min={0}
                            max={100}
                            suffix="%"
                            readOnly
                            tooltip="Indicador relacionado con la disponibilidad de espacios transitables dentro del mapa generado."
                        />
                    </section>

                    {/* ACTIONS */}
                    <div className="sidebar-actions">

                        <button
                            className="generate-button"
                            onClick={handleGenerateRequest}
                            disabled={generating || isSaving}
                        >
                            <Sparkles size={15}/>

                            Generar mapa
                        </button>

                        <div className="export-buttons">

                            {/* GUARDAR MAPA */}
                            <button
                                type="button"
                                className="export-button save-button"
                                onClick={handleSaveMap}
                                disabled={
                                    !generatedMap ||
                                    generating ||
                                    isSaving ||
                                    isMapSaved
                                }
                                title={
                                    isMapSaved
                                        ? "Este mapa ya está guardado"
                                        : isSaving
                                            ? "Guardando mapa..."
                                            : "Guardar mapa en Supabase"
                                }
                            >
                                {isSaving ? (
                                    <LoaderCircle
                                        size={21}
                                        strokeWidth={1.8}
                                        className="save-spinner"
                                    />
                                ) : isMapSaved ? (
                                    <CheckCircle2
                                        size={21}
                                        strokeWidth={1.8}
                                    />
                                ) : (
                                    <Save size={21} strokeWidth={1.8} />
                                )}

                                <span>
                                    {isSaving
                                        ? "Guardando"
                                        : isMapSaved
                                            ? "Guardado"
                                            : "Guardar"}
                                </span>

                            </button>

                            {/* EXPORTAR JSON */}
                            <button
                                type="button"
                                className="export-button json-button"
                                onClick={handleExportJSON}
                                disabled={!generatedMap || generating}
                                title="Descargar mapa en formato JSON"
                            >
                                <FileJson size={21} strokeWidth={1.8} />
                                <span>JSON</span>
                            </button>

                            {/* EXPORTAR PNG */}
                            <button
                                type="button"
                                className="export-button png-button"
                                onClick={handleExportPNG}
                                disabled={!generatedMap || generating}
                                title="Descargar imagen del mapa"
                            >
                                <Image size={21} strokeWidth={1.8} />
                                <span>PNG</span>
                            </button>

                        </div>

                    </div>

                </aside>

                {/* WORKSPACE: solo muestra el mapa generado */}
                <main className="workspace">

                    {generating ? (

                        /* GENERACIÓN EN PROCESO */
                        <MapLoader />

                    ) : generationError ? (

                        /* ERROR DE GENERACIÓN */
                        <GenerationError
                            type={generationErrorType}
                            message={generationError}
                            onRetry={generateMap}
                            retrying={generating}
                        />

                    ) : generatedMap ? (

                        /* MAPA GENERADO */
                        <div className="map-result-container">

                            <GenerationStatus
                                hasMap={Boolean(generatedMap)}
                                hasChanges={hasPendingChanges}
                            />

                            {/* Historial compacto integrado en la zona del explorador. */}
                            <div className="map-viewer-history-anchor">
                                <MapViewer>
                                    <MapRenderer
                                        map={getMapMatrix(generatedMap)}
                                        terrainType={visibleMapType.toLowerCase()}
                                        tileSize={tileSize}
                                    />
                                </MapViewer>

                                <MapHistory
                                    maps={mapHistory}
                                    activeMapId={activeMapId}
                                    onSelect={handleSelectHistoryMap}
                                    onDelete={handleDeleteHistoryMap}
                                    disabled={generating || isSaving}
                                />
                            </div>

                            <MapLegend
                                algorithm={visibleAlgorithm}
                                terrainType={visibleMapType}
                            />



                        </div>

                    ) : (

                        /* ESTADO INICIAL */
                        <div className="empty-workspace">

                            <Map size={44} strokeWidth={1.5} />

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

            <UnsavedMapDialog
                open={showUnsavedDialog}
                onCancel={handleCancelGeneration}
                onConfirm={handleConfirmGeneration}
                mode={pendingHistoryId !== null ? "restore" : "generate"}
            />

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
                    tooltip = null,
                }) {
    return (
        <div className="slider-group">

            <div className="slider-header">
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                    }}
                >
                    <span>{label}</span>

                    {tooltip && (
                        <MetricTooltip
                            title={label}
                            description={tooltip}
                        />
                    )}
                </div>

                <strong>
                    {value}{suffix}
                </strong>
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
                style={
                    readOnly
                        ? { pointerEvents: "none" }
                        : undefined
                }
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

function toPercent(value) {
    const number = Number(value);
    if (!Number.isFinite(number)) return 0;

    // Algunas métricas del backend pueden venir en rango 0..1.
    const percent = number >= 0 && number <= 1 ? number * 100 : number;
    return Math.max(0, Math.min(100, Math.round(percent)));
}

function getEvaluationMetrics(response) {
    if (!response) {
        return {
            quality: 0,
            connectivity: 0,
            accessibility: 0
        };
    }

    const metrics =
        response.metrics ||
        response.evaluation ||
        response.statistics ||
        response.stats ||
        response.map_metrics ||
        response.result?.metrics ||
        {};

    return {
        quality: toPercent(
            metrics.quality ??
            metrics.quality_score ??
            response.quality
        ),

        connectivity: toPercent(
            metrics.connectivity ??
            response.connectivity
        ),

        accessibility: toPercent(
            metrics.accessibility ??
            metrics.accessibility_score ??
            metrics.floor_ratio ??
            response.accessibility
        )
    };
}

function getExportColor(mapType, value) {
    const active = value !== 0;
    if (mapType === "bosque") return active ? "#22c55e" : "#123524";
    if (mapType === "desierto") return active ? "#f4c76b" : "#8b5e34";
    if (mapType === "ciudad") return active ? "#cbd5e1" : "#334155";
    return active ? "#d1d5db" : "#111827";
}

// Una nueva entrada del historial monta una instancia nueva y restaura su mapa.
function DashboardPage() {
    const location = useLocation();
    return <Dashboard key={location.key}/>;
}

function loadSprite(src) {
    return new Promise((resolve, reject) => {
        const image = new window.Image();

        image.onload = () => resolve(image);

        image.onerror = () => {
            reject(
                new Error(`No se pudo cargar el sprite: ${src}`)
            );
        };

        image.src = src;
    });
}

/* ==========================================
   IDENTIFICAR ERRORES DE GENERACIÓN
 ========================================== */

function classifyGenerationError(error) {
    const status = Number(
        error?.status ??
        error?.response?.status ??
        0
    );

    const message = String(
        error?.message ?? ""
    ).toLowerCase();

    const name = String(
        error?.name ?? ""
    ).toLowerCase();

    if (
        name === "aborterror" ||
        message.includes("timeout") ||
        message.includes("timed out") ||
        message.includes("tiempo de espera")
    ) {
        return "timeout";
    }

    if (status === 401 || status === 403) {
        return "authentication";
    }

    if (
        status === 400 ||
        status === 422
    ) {
        return "validation";
    }

    if (status >= 500) {
        return "server";
    }

    if (
        error instanceof TypeError ||
        message.includes("failed to fetch") ||
        message.includes("networkerror") ||
        message.includes("network error")
    ) {
        return "connection";
    }

    return "unknown";
}

/* ==========================================
   CONFIGURACIÓN DE GENERACIÓN
   ========================================== */

function getGenerationConfig({
                                 mapType,
                                 algorithm,
                                 width,
                                 height,
                                 seed,
                                 complexity,
                             }) {
    return {
        mapType,
        algorithm,
        width: Number(width),
        height: Number(height),
        seed: seed == null ? "" : String(seed),
        complexity,
    };
}

export default DashboardPage;

