import {useLocation, useNavigate} from "react-router-dom";

import {
    generateV2Map
} from "../../../services/mapsApi";

import {
    saveMap
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
import MapViewer from "../../../components/MapViewer";
import GenerationError from "../../../components/GenerationError.jsx";
import GenerationStatus from "../../../components/GenerationStatus";
import UnsavedMapDialog from "../../../components/UnsavedMapDialog";
import MapHistory from "../../../components/MapHistory";
import MapRendererV2, { exportV2Canvas } from "../../../components/MapRendererV2";
import MapLegendV2 from "../../../components/MapLegendV2";
import MapMetricsPanel from "../../../components/MapMetricsPanel";
import "../../../components/css/DashboardV2.css";
import "../../../components/css/DashboardBranding.css";

function restoreSavedMap(savedMap) {
    if (!savedMap) return null;
    if (!savedMap.generation_data?.layers) return null;

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
    const generatedMap = storedGeneration;

    return {
        mapType,
        algorithm,
        width: Number(savedMap.width ?? 50),
        height: Number(savedMap.height ?? 35),
        seed: Number(savedMap.seed ?? 42),
        complexity: complexities[String(savedMap.complexity ?? "").toLowerCase()] || "Medio",
        tileSize: Number(savedMap.tile_size ?? 16),
        generatedMap,
        version: "v2",
    };
}

function Dashboard() {
    const navigate = useNavigate();
    const location = useLocation();
    const savedMap = location.state?.savedMap ?? null;

    // La función inicializadora se ejecuta solo al montar esta instancia.
    const [restored] = useState(() => restoreSavedMap(savedMap));
    useEffect(() => {
        if (savedMap && !restored) {
            toast.warning("Este mapa utiliza un formato anterior y no puede abrirse en el generador actual.");
        }
    }, [savedMap, restored]);

    const version = "v2";
    const [activeTab, setActiveTab] = useState("generator");
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
        () => Boolean(restored)
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
        complexity, version,
    }), [mapType, algorithm, width, height, seed, complexity, version]);

    const hasPendingChanges = useMemo(() => {
        if (!generatedMap || !lastGeneratedConfig) return false;
        return JSON.stringify(currentGenerationConfig) !==
            JSON.stringify(lastGeneratedConfig);
    }, [generatedMap, currentGenerationConfig, lastGeneratedConfig]);

    // El mapa visible y sus exportaciones deben usar la configuración con la
    // que se generó, no los valores editados que aún están pendientes.
    const visibleVersion = lastGeneratedConfig?.version ?? version;
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
            rhyzome_version: "v2",
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
        if (!generatedMap?.layers) {
            toast.error("El mapa no contiene las capas necesarias para exportar PNG.");
            return;
        }
        try {
            const canvas = await exportV2Canvas(generatedMap, Math.max(8, Number(tileSize) || 16));
            const blob = await new Promise(resolve => canvas.toBlob(resolve, "image/png"));
            if (!blob) throw new Error("No se pudo crear el PNG");
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = `rhyzome_${visibleMapType.toLowerCase()}_${visibleSeed}.png`;
            document.body.appendChild(link);
            link.click();
            link.remove();
            setTimeout(() => URL.revokeObjectURL(url), 1000);
            toast.success("Descarga PNG iniciada");
        } catch (error) {
            toast.error(error?.message || "No fue posible exportar el PNG");
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
            {
                payload.complexity = ({ Bajo: "bajo", Medio: "medio", Alto: "alto" })[complexity] || "medio";
                payload.variant = "B";
                payload.include_ml = true;
            }

            // Captura exactamente los parámetros enviados a esta solicitud.
            const requestedConfig = getGenerationConfig({
                mapType,
                algorithm,
                width,
                height,
                seed,
                complexity, version,
            });

            console.log("Solicitud enviada al backend:", payload);

            const response = await generateV2Map(payload);
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
            const normalizedResponse = response?.layers?.collision
                ? { ...response, matrix: response.layers.collision.map(row => row.map(cell => Number(cell) === 0 ? 1 : 0)), rhyzome_version: "v2" }
                : { ...response, rhyzome_version: version };
            setGeneratedMap(normalizedResponse);
            setLastGeneratedConfig(requestedConfig);
            // El nuevo mapa todavía no está guardado.
            setIsMapSaved(false);

            // Solo registrar respuestas exitosas, conservando como máximo cinco.
            historyCounterRef.current += 1;
            const historyId = `map-${historyCounterRef.current}`;
            const entry = {
                id: historyId,
                generatedMap: normalizedResponse,
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

    const visibleHistory = mapHistory.filter((item) =>
        item.config?.version === "v2"
    );

    const handleSelectHistoryMap = (historyId) => {
        if (generating || isSaving || savingRef.current) return;
        if (historyId === activeMapId) return;
        if (!visibleHistory.some((item) => item.id === historyId)) return;

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

                    <div className="rh-brand-copy"><strong>RHYZOME</strong></div>
                </div>

                <div className="header-actions">

                    <button
                        type="button"
                        className="manual-button"
                        onClick={() => setShowManual(true)}
                    >
                        <BookOpen size={18}/>
                        Manual de usuario
                    </button>

                    <button
                        type="button"
                        className="maps-button"
                        onClick={() => navigate("/maps")}
                    >
                        <Map size={18}/>
                        Mis mapas
                    </button>

                    <button
                        className="logout-button"
                        onClick={logout}
                        title="Cerrar sesión"
                        aria-label="Cerrar sesión"
                    >
                        <LogOut size={19}/>
                    </button>

                </div>

            </header>

            <div className="dashboard-content rh-dashboard-v2">

                {/* SIDEBAR */}
                {<aside className="sidebar rh-v2-sidebar" aria-label="Configuración del generador V2">
                    <div className="sidebar-title">GENERADOR</div>
                    <section className="parameter-section">
                        <div className="section-label">TIPO DE MAPA</div>
                        <div className="map-types rh-v2-terrain-grid">
                            <button type="button" className={mapType === "Bosque" ? "map-type active" : "map-type"} onClick={() => selectMapType("Bosque")}><Trees size={14}/>Bosque</button>
                            <button type="button" className={mapType === "Desierto" ? "map-type active" : "map-type"} onClick={() => selectMapType("Desierto")}><Sun size={14}/>Desierto</button>
                            <button type="button" className={mapType === "Ciudad" ? "map-type active" : "map-type"} onClick={() => selectMapType("Ciudad")}><Building2 size={14}/>Ciudad</button>
                            <button type="button" className={mapType === "Mazmorra" ? "map-type active" : "map-type"} onClick={() => selectMapType("Mazmorra")}><Skull size={14}/>Mazmorra</button>
                        </div>
                    </section>
                    <section className="parameter-section rh-v2-slider-section">
                        <div className="section-label">DIMENSIONES</div>
                        <label className="rh-v2-range-label"><span>ANCHO</span><strong>{width}</strong><input aria-label="Ancho V2" type="range" min="10" max="100" value={width} onChange={e => setWidth(Number(e.target.value))}/></label>
                        <label className="rh-v2-range-label"><span>ALTO</span><strong>{height}</strong><input aria-label="Alto V2" type="range" min="10" max="100" value={height} onChange={e => setHeight(Number(e.target.value))}/></label>
                    </section>
                    <section className="parameter-section">
                        <div className="section-label">SEMILLA (SEED)</div>
                        <div className="rh-v2-seed"><input aria-label="Semilla V2" type="number" value={seed} onChange={e => setSeed(e.target.value)}/><button type="button" title="Nueva semilla" aria-label="Nueva semilla" onClick={() => setSeed(String(Math.floor(Math.random() * 1000000)))}><Shuffle size={15}/></button></div>
                    </section>
                    <section className="parameter-section">
                        <div className="section-label">ALGORITMO RECOMENDADO</div>
                        <div className="rh-v2-recommendation"><CheckCircle2 size={15}/><span>{mapType === "Mazmorra" ? "Autómatas Celulares" : "Ruido procedural"} · {mapType}</span></div>
                    </section>
                    <section className="parameter-section">
                        <div className="section-label">NIVEL DE COMPLEJIDAD</div>
                        <div className="rh-v2-complexity" role="group" aria-label="Complejidad V2">
                            {[["Bajo","Simple"],["Medio","Equilibrado"],["Alto","Denso"]].map(([value,detail]) => <button key={value} type="button" aria-pressed={complexity === value} className={complexity === value ? "active" : ""} onClick={() => setComplexity(value)}><strong>{value}</strong><small>{detail}</small></button>)}
                        </div>
                        <label className="rh-v2-range-label rh-v2-scale"><span>ESCALA DE VISUALIZACIÓN</span><strong>{tileSize} px</strong><input aria-label="Escala visual V2" type="range" min="8" max="32" value={tileSize} onChange={e => setTileSize(Number(e.target.value))}/></label>
                    </section>
                    <div className="rh-v2-bottom-actions">
                        <button type="button" className="rh-v2-generate" onClick={handleGenerateRequest} disabled={generating || isSaving}><Sparkles size={17}/> {generating ? "Generando..." : "Generar mapa"}</button>
                        <div className="rh-v2-export">
                            <button type="button" onClick={handleSaveMap} disabled={!generatedMap || generating || isSaving || isMapSaved}><Save size={19}/><span>Guardar</span></button>
                            <button type="button" onClick={handleExportJSON} disabled={!generatedMap || generating}><FileJson size={19}/><span>JSON</span></button>
                            <button type="button" onClick={handleExportPNG} disabled={!generatedMap || generating}><Image size={19}/><span>PNG</span></button>
                        </div>
                    </div>
                </aside>}


                {/* WORKSPACE: solo muestra el mapa generado */}
                <main className="workspace">
                    {<nav className="rh-workspace-tabs" aria-label="Vista del escenario">
                        <button type="button" className={activeTab === "generator" ? "active" : ""} onClick={() => setActiveTab("generator")}>Generador</button>
                        <button type="button" className={activeTab === "metrics" ? "active" : ""} onClick={() => setActiveTab("metrics")}>Métricas</button>
                    </nav>}
                    {<div className="rh-metrics-view" style={{display: activeTab === "metrics" ? "block" : "none"}}>
                        <div className="rh-v2-notice"><span className="rh-notice-icon">✓</span><div><strong>Métricas del escenario generado</strong><p>Evaluación del mapa según las medidas disponibles de calidad y complejidad.</p></div></div>
                        <div className="rh-metrics-columns">
                            <div className="rh-metrics-left">
                                {generatedMap && <section className="rh-metrics-preview"><h3>◈ &nbsp; Mapa generado ({visibleVersion.toUpperCase()})</h3><div className="rh-metrics-preview-map">
                                    {generatedMap?.layers && <MapRendererV2 response={generatedMap} terrainType={visibleMapType} tileSize={16} fit/>}
                                </div></section>}
                                {generatedMap?.layers && <MapLegendV2 response={generatedMap}/>}
                            </div>
                            <MapMetricsPanel response={generatedMap} terrainType={visibleMapType} version={visibleVersion}/>
                        </div>
                    </div>}
                    <div className="rh-generator-pane" style={{display: activeTab === "generator" ? "flex" : "none"}}>


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
                                        {generatedMap?.layers && <MapRendererV2 response={generatedMap} terrainType={visibleMapType} tileSize={tileSize} />}
                                    </MapViewer>

                                    <MapHistory
                                        maps={visibleHistory}
                                        activeMapId={activeMapId}
                                        onSelect={handleSelectHistoryMap}
                                        onDelete={handleDeleteHistoryMap}
                                        disabled={generating || isSaving}
                                    />
                                </div>

                                {generatedMap?.layers && <MapLegendV2 response={generatedMap} />}



                            </div>

                        ) : (

                            /* ESTADO INICIAL */
                            <div className="empty-workspace">

                                <Map size={44} strokeWidth={1.5} />

                                <h2>Configura y genera tu mapa</h2>

                                <p>
                                    Selecciona el terreno y los parámetros de "V2" y presiona
                                    <strong> "Generar mapa"</strong> para crear tu escenario.
                                </p>

                            </div>

                        )}

                    </div>
                </main>

            </div>

            {/* FOOTER */}
            <footer className="dashboard-footer rh-footer">
                <div className="rh-footer-identity">
                    <Map size={17} aria-hidden="true" />
                    <strong>RHYZOME</strong>
                    <span className="rh-footer-divider" aria-hidden="true" />
                    <span>Generador procedural de escenarios 2D</span>
                </div>
                <span className="rh-footer-copyright">© 2026 · Proyecto académico</span>
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

                        <div className="manual-content manual-guide">
                            <p className="manual-intro">Rhyzome crea escenarios para videojuegos. No necesitas conocimientos de programación: elige un tipo de mapa, ajusta sus opciones y observa el resultado.</p>
                            <h3>1. ¿Cómo genero un mapa?</h3>
                            <ol>
                                <li><strong>Elige el escenario:</strong> bosque, desierto, ciudad o mazmorra.</li>
                                <li><strong>Selecciona el tamaño:</strong> cuanto mayores sean las dimensiones, más espacio tendrá el mapa.</li>
                                <li><strong>Elige la complejidad:</strong> indica el tipo de resultado que deseas obtener; el sistema también puede estimar la complejidad del mapa generado.</li>
                                <li><strong>Usa una semilla si quieres repetir un resultado:</strong> es un número que ayuda a reproducir la generación con los mismos ajustes.</li>
                                <li><strong>Presiona Generar:</strong> observa el mapa, su leyenda y la pestaña de métricas. Puedes guardarlo o exportarlo como imagen PNG o archivo JSON.</li>
                            </ol>
                            <h3>2. ¿Qué son las métricas?</h3>
                            <p>Son medidas que describen cómo está construido el mapa. <strong>No son notas ni calificaciones:</strong> un número más alto no siempre significa un mapa mejor. Por ejemplo, un bosque puede necesitar más obstáculos que una plaza abierta.</p>
                            <div className="manual-metric-list">
                                <div><strong>Accesibilidad</strong><p>Cuánto espacio se puede recorrer. Si marca <strong>80 %</strong>, aproximadamente 80 de cada 100 casillas son transitables. No asegura que todas estén comunicadas.</p></div>
                                <div><strong>Densidad de obstáculos</strong><p>Cuánto espacio está bloqueado por elementos que impiden pasar. Un <strong>20 %</strong> significa unas 20 casillas bloqueadas de cada 100. Más obstáculos no siempre es peor.</p></div>
                                <div><strong>Conectividad</strong><p>Qué proporción del espacio transitable pertenece a la zona conectada más grande. <strong>100 %</strong> significa que todas las casillas transitables se conectan entre sí; no que todo el mapa sea transitable.</p></div>
                                <div><strong>Mayor región conectada</strong><p>Qué tan grande es la zona continua principal respecto al espacio que puede recorrerse. Un valor alto indica que gran parte del recorrido está unido. Puede coincidir con conectividad según el cálculo usado.</p></div>
                                <div><strong>Regiones conectadas</strong><p>Cuántas zonas transitables separadas existen. <strong>1</strong> indica una sola zona continua; <strong>3</strong> indica tres zonas que no están conectadas entre sí.</p></div>
                                <div><strong>Densidad de bordes</strong><p>Cuántas veces cambia el tipo de terreno entre casillas vecinas. Un valor alto suele indicar más cambios entre superficies; uno bajo, áreas más uniformes.</p></div>
                                <div><strong>Entropía (filas)</strong><p>Describe cuánto varía la distribución de terrenos a lo largo de las filas. Un valor mayor suele indicar más diversidad o irregularidad en esa dirección.</p></div>
                                <div><strong>Entropía (columnas)</strong><p>Es similar a la anterior, pero analiza las columnas. No es un porcentaje ni una puntuación de calidad.</p></div>
                                <div><strong>Densidad de objetos</strong><p>Qué proporción del mapa está ocupada por objetos contabilizados, como rocas, árboles o edificios, según el escenario. <strong>10 %</strong> significa aproximadamente una décima parte.</p></div>
                                <div><strong>Tipos de terreno</strong><p>Cuántas clases diferentes de superficie aparecen. Por ejemplo, <strong>3</strong> podría corresponder a arena, agua y camino.</p></div>
                                <div><strong>Tipos de objetos</strong><p>Cuántas clases distintas de elementos aparecen. Por ejemplo, cactus y rocas representan <strong>2</strong> tipos, aunque haya muchos de cada uno.</p></div>
                                <div><strong>Solapamientos inválidos</strong><p>Cuenta situaciones donde elementos se colocaron de manera incompatible según las reglas del generador. <strong>0</strong> significa que no se detectaron conflictos de ese tipo.</p></div>
                                <div><strong>Variación local</strong><p>Mide cuánto cambia la posibilidad de pasar de una casilla a la siguiente. Un valor alto indica más alternancia entre espacios libres y bloqueados.</p></div>
                                <div><strong>Relación perímetro/área</strong><p>Compara el contorno de las zonas transitables con su superficie. Un valor mayor suele reflejar formas más recortadas o estrechas. <strong>No es un porcentaje</strong> y depende del tamaño y la forma del mapa.</p></div>
                            </div>
                            <h3>3. ¿Cómo interpreto el gráfico radar?</h3>
                            <p>Cada punta representa una característica distinta. Cuanto más lejos del centro llega la figura verde, mayor es el valor mostrado en ese eje. <strong>Una figura más grande no significa necesariamente mejor calidad.</strong> Compara el radar con las métricas numéricas para entender qué cambia entre mapas.</p>
                            <h3>4. ¿Qué significa la complejidad ML?</h3>
                            <p>La inteligencia artificial analiza características del mapa y lo clasifica como de complejidad <strong>baja, media o alta</strong>. Es una estimación del sistema, no una medida exacta de dificultad para todos los jugadores. Si aparece una confianza, indica qué tan segura es la predicción del modelo, no la calidad del mapa.</p>
                            <h3>5. Ejemplo de lectura de resultados</h3>
                            <p>Si un mapa muestra <strong>92 % de accesibilidad, 8 % de obstáculos, 100 % de conectividad y 1 región</strong>, puedes entender que casi todo el escenario se puede recorrer y que las zonas transitables forman una sola área comunicada. Eso no significa que el mapa sea necesariamente fácil o mejor.</p>
                            <h3>6. ¿Qué hago si aparece «—»?</h3>
                            <p>Significa que ese dato no está disponible para el mapa mostrado. <strong>No equivale a cero.</strong> Prueba generar un mapa nuevo y comprueba que la versión del sistema admita esa métrica.</p>
                            <h3>7. ¿Para qué sirven las descargas?</h3>
                            <p><strong>PNG:</strong> guarda una imagen que puedes ver o compartir. <strong>JSON:</strong> guarda datos del escenario para revisarlos o utilizarlos en otras herramientas compatibles.</p>
                            <div className="manual-recommendations"><h3>¿Qué algoritmo utiliza cada escenario?</h3><p><strong>Bosque, desierto y ciudad:</strong> generación basada en ruido (Perlin/Simplex según la versión). <strong>Mazmorra:</strong> autómatas celulares. No necesitas configurar estos métodos para comprender las métricas.</p></div>
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
                                 version = "v2",
                             }) {
    return {
        mapType,
        algorithm,
        width: Number(width),
        height: Number(height),
        seed: seed == null ? "" : String(seed),
        complexity, version,
    };
}

export default DashboardPage;


