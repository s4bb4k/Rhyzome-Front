import {useEffect, useMemo, useRef, useState} from "react";
import {useNavigate} from "react-router-dom";

import { getTerrainSprite } from "../../../utils/terrainSprites";

import {
    Search,
    SlidersHorizontal,
    ChevronUp,
    ChevronDown,
    Plus,
    Trees,
    Sun,
    Building2,
    Skull,
    Grid2X2,
    List,
    ChevronLeft,
    ChevronRight,
    Map,
    LogOut,
    X,
    Trash2,
    RefreshCw,
} from "lucide-react";

import {supabase} from "../../../lib/supabase";
import {
    getMyMaps,
    deleteMap,
} from "../../../services/mapsStorage";

import { toast } from "sonner";

const biomeIcons = {
    Todos: Map,
    Bosque: Trees,
    Desierto: Sun,
    Ciudad: Building2,
    Mazmorra: Skull,
};

import "./MyMaps-modal.css";

const PAGE_SIZE = 6;

function MyMaps() {
    const navigate = useNavigate();

    const [maps, setMaps] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState("");

    const [search, setSearch] = useState("");
    const [biome, setBiome] = useState("Todos");
    const [dateFilter, setDateFilter] = useState("Cualquier fecha");
    const [width, setWidth] = useState(10);
    const [seed, setSeed] = useState("");
    const [showFilters, setShowFilters] = useState(true);
    const [view, setView] = useState("grid");
    const [sort, setSort] = useState("Más recientes");
    const [page, setPage] = useState(1);
    const [deletingId, setDeletingId] = useState(null);
    const [mapToDelete, setMapToDelete] = useState(null);
    const deleteDialogRef = useRef(null);
    const cancelDeleteRef = useRef(null);
    const previousFocusRef = useRef(null);
    const deletingIdRef = useRef(null);
    deletingIdRef.current = deletingId;

    useEffect(() => {
        if (!mapToDelete) return;

        previousFocusRef.current = document.activeElement;
        cancelDeleteRef.current?.focus();

        const onKeyDown = (event) => {
            if (event.key === "Escape") {
                if (deletingIdRef.current === null) setMapToDelete(null);
                return;
            }
            if (event.key !== "Tab") return;

            const focusable = Array.from(
                deleteDialogRef.current?.querySelectorAll('button:not(:disabled)') ?? []
            );
            if (!focusable.length) {
                event.preventDefault();
                return;
            }
            const first = focusable[0];
            const last = focusable[focusable.length - 1];
            if (event.shiftKey && document.activeElement === first) {
                event.preventDefault();
                last.focus();
            } else if (!event.shiftKey && document.activeElement === last) {
                event.preventDefault();
                first.focus();
            }
        };

        document.addEventListener("keydown", onKeyDown);
        return () => {
            document.removeEventListener("keydown", onKeyDown);
            previousFocusRef.current?.focus?.();
        };
    }, [mapToDelete]);

    useEffect(() => {
        loadMaps();
    }, []);

    async function loadMaps() {
        try {
            setLoading(true);
            setLoadError("");
            const data = await getMyMaps();
            setMaps(data);
        } catch (error) {
            console.error("Error cargando mapas:", error);
            setLoadError(error?.message || "No fue posible cargar los mapas.");
        } finally {
            setLoading(false);
        }
    }

    const filteredMaps = useMemo(() => {
        const now = new Date();

        const result = maps.filter((map) => {
            const name = String(map.name ?? "");
            const type = normalizeMapType(map.map_type);

            const searchMatch = name.toLowerCase().includes(search.toLowerCase());

            const biomeMatch =
                biome === "Todos" ||
                type.toLowerCase() === biome.toLowerCase();

            const widthMatch = Number(map.width ?? 0) >= width;

            const seedMatch =
                !seed ||
                String(map.seed ?? "").includes(seed);

            const createdAt = map.created_at ? new Date(map.created_at) : null;
            let dateMatch = true;

            if (dateFilter !== "Cualquier fecha" && createdAt && !Number.isNaN(createdAt.getTime())) {
                const diffMs = now.getTime() - createdAt.getTime();
                const diffDays = diffMs / (1000 * 60 * 60 * 24);

                if (dateFilter === "Hoy") {
                    dateMatch =
                        createdAt.getFullYear() === now.getFullYear() &&
                        createdAt.getMonth() === now.getMonth() &&
                        createdAt.getDate() === now.getDate();
                } else if (dateFilter === "Últimos 7 días") {
                    dateMatch = diffDays >= 0 && diffDays <= 7;
                } else if (dateFilter === "Últimos 30 días") {
                    dateMatch = diffDays >= 0 && diffDays <= 30;
                }
            }

            return searchMatch && biomeMatch && widthMatch && seedMatch && dateMatch;
        });

        return [...result].sort((a, b) => {
            if (sort === "Más antiguos") {
                return new Date(a.created_at ?? 0) - new Date(b.created_at ?? 0);
            }

            if (sort === "Nombre A-Z") {
                return String(a.name ?? "").localeCompare(String(b.name ?? ""));
            }

            if (sort === "Nombre Z-A") {
                return String(b.name ?? "").localeCompare(String(a.name ?? ""));
            }

            return new Date(b.created_at ?? 0) - new Date(a.created_at ?? 0);
        });
    }, [maps, search, biome, width, seed, dateFilter, sort]);

    useEffect(() => {
        setPage(1);
    }, [search, biome, width, seed, dateFilter, sort]);

    const totalPages = Math.max(1, Math.ceil(filteredMaps.length / PAGE_SIZE));
    const safePage = Math.min(page, totalPages);
    const startIndex = (safePage - 1) * PAGE_SIZE;
    const visibleMaps = filteredMaps.slice(startIndex, startIndex + PAGE_SIZE);

    const logout = async () => {
        await supabase.auth.signOut();
        navigate("/");
    };

    const createMap = () => {
        navigate("/dashboard");
    };

    const openMap = (map) => {
        navigate("/dashboard", {
            state: {
                savedMap: map,
            },
        });
    };

    const handleDelete = (map) => {
        if (deletingId !== null) return;
        setMapToDelete(map);
    };

    const confirmDelete = async () => {
        if (!mapToDelete || deletingId !== null) return;
        const map = mapToDelete;

        try {
            setDeletingId(map.id);
            await deleteMap(map.id);
            setMaps((current) => current.filter((item) => item.id !== map.id));
            setMapToDelete(null);
            toast.success("Mapa eliminado correctamente", {
                description: `"${map.name}" fue eliminado de tus mapas.`,
            });
        } catch (error) {
            console.error("Error eliminando mapa:", error);
            toast.error("No fue posible eliminar el mapa", {
                description: error?.message || "Ocurrió un error al intentar eliminar el mapa.",
            });
        } finally {
            setDeletingId(null);
        }
    };

    return (
        <div className="maps-page">
            <header className="maps-header">
                <div className="maps-brand">
                    <div className="maps-brand-icon">
                        <Map size={17}/>
                    </div>
                    <strong>Rhizome</strong>
                </div>

                <div className="maps-header-actions">
                    <button className="new-map-button" onClick={createMap}>
                        <Plus size={16}/>
                        Nuevo mapa
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

            <main className="maps-content">
                <div className="maps-title">
                    <h1>Mis Mapas</h1>
                    <p>
                        {loading
                            ? "Cargando mapas..."
                            : `${filteredMaps.length} mapas encontrados`}
                    </p>
                </div>

                <section className="maps-filter-box">
                    <div className="maps-search-row">
                        <div className="maps-search">
                            <Search size={17}/>

                            <input
                                type="text"
                                placeholder="Buscar por nombre de mapa..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />

                            {search && (
                                <button
                                    className="clear-search"
                                    onClick={() => setSearch("")}
                                    title="Limpiar búsqueda"
                                >
                                    <X size={15}/>
                                </button>
                            )}
                        </div>

                        <button
                            className="filters-button"
                            onClick={() => setShowFilters(!showFilters)}
                        >
                            <SlidersHorizontal size={15}/>
                            Filtros
                            {showFilters ? (
                                <ChevronUp size={14}/>
                            ) : (
                                <ChevronDown size={14}/>
                            )}
                        </button>
                    </div>

                    {showFilters && (
                        <div className="filters-content">
                            <div className="filter-group">
                                <label>BIOMA</label>

                                <div className="filter-options">
                                    {["Todos", "Bosque", "Desierto", "Ciudad", "Mazmorra"].map(
                                        (item) => {
                                            const Icon = biomeIcons[item];

                                            return (
                                                <button
                                                    key={item}
                                                    className={
                                                        biome === item
                                                            ? "filter-chip active"
                                                            : "filter-chip"
                                                    }
                                                    onClick={() => setBiome(item)}
                                                >
                                                    <Icon size={12}/>
                                                    {item}
                                                </button>
                                            );
                                        }
                                    )}
                                </div>
                            </div>

                            <div className="filter-group">
                                <label>FECHA DE CREACIÓN</label>

                                <div className="filter-options">
                                    {[
                                        "Cualquier fecha",
                                        "Hoy",
                                        "Últimos 7 días",
                                        "Últimos 30 días",
                                    ].map((item) => (
                                        <button
                                            key={item}
                                            className={
                                                dateFilter === item
                                                    ? "filter-chip active"
                                                    : "filter-chip"
                                            }
                                            onClick={() => setDateFilter(item)}
                                        >
                                            {item}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="filter-group width-filter">
                                <div className="filter-label-row">
                                    <label>ANCHO DEL MAPA</label>
                                    <strong>{width}-150</strong>
                                </div>

                                <input
                                    type="range"
                                    min="10"
                                    max="150"
                                    value={width}
                                    onChange={(e) => setWidth(Number(e.target.value))}
                                />
                            </div>

                            <div className="filter-group seed-filter">
                                <label>SEMILLA</label>

                                <input
                                    type="text"
                                    placeholder="Ej. 42869"
                                    value={seed}
                                    onChange={(e) => setSeed(e.target.value)}
                                />
                            </div>
                        </div>
                    )}
                </section>

                {loadError && (
                    <div className="maps-empty">
                        <div className="empty-icon">
                            <X size={42}/>
                        </div>
                        <h2>No fue posible cargar los mapas</h2>
                        <p>{loadError}</p>
                        <button className="create-first-map" onClick={loadMaps}>
                            <RefreshCw size={16}/>
                            Reintentar
                        </button>
                    </div>
                )}

                {!loadError && filteredMaps.length > 0 && (
                    <div className="results-toolbar">
                        <div/>

                        <div className="results-actions">
                            <span>Ordenar por:</span>

                            <select value={sort} onChange={(e) => setSort(e.target.value)}>
                                <option>Más recientes</option>
                                <option>Más antiguos</option>
                                <option>Nombre A-Z</option>
                                <option>Nombre Z-A</option>
                            </select>

                            <button
                                className={
                                    view === "grid" ? "view-button active" : "view-button"
                                }
                                onClick={() => setView("grid")}
                                title="Vista de cuadrícula"
                            >
                                <Grid2X2 size={15}/>
                            </button>

                            <button
                                className={
                                    view === "list" ? "view-button active" : "view-button"
                                }
                                onClick={() => setView("list")}
                                title="Vista de lista"
                            >
                                <List size={15}/>
                            </button>
                        </div>
                    </div>
                )}

                {!loading && !loadError && filteredMaps.length === 0 && (
                    <div className="maps-empty">
                        <div className="empty-icon">
                            <Map size={42}/>
                        </div>

                        <h2>
                            {hasActiveFilters(search, biome, dateFilter, width, seed)
                                ? "No se encontraron mapas"
                                : "Aún no tienes mapas"}
                        </h2>

                        <p>
                            {hasActiveFilters(search, biome, dateFilter, width, seed)
                                ? "Intenta cambiar los filtros de búsqueda."
                                : "¡Genera y guarda tu primer mapa!"}
                        </p>

                        {!hasActiveFilters(search, biome, dateFilter, width, seed) && (
                            <button className="create-first-map" onClick={createMap}>
                                <Plus size={16}/>
                                Crear primer mapa
                            </button>
                        )}
                    </div>
                )}

                {!loading &&
                    !loadError &&
                    visibleMaps.length > 0 &&
                    view === "grid" && (
                        <div className="maps-grid">
                            {visibleMaps.map((map) => (
                                <MapCard
                                    key={map.id}
                                    map={map}
                                    onOpen={() => openMap(map)}
                                    onDelete={() => handleDelete(map)}
                                    deleting={deletingId === map.id}
                                />
                            ))}
                        </div>
                    )}

                {!loading &&
                    !loadError &&
                    visibleMaps.length > 0 &&
                    view === "list" && (
                        <div className="maps-list">
                            {visibleMaps.map((map) => (
                                <MapListItem
                                    key={map.id}
                                    map={map}
                                    onOpen={() => openMap(map)}
                                    onDelete={() => handleDelete(map)}
                                    deleting={deletingId === map.id}
                                />
                            ))}
                        </div>
                    )}

                {!loading && !loadError && filteredMaps.length > 0 && (
                    <div className="maps-pagination">
                        <button
                            disabled={safePage <= 1}
                            onClick={() => setPage((current) => Math.max(1, current - 1))}
                        >
                            <ChevronLeft size={16}/>
                        </button>

                        {Array.from({length: totalPages}, (_, index) => index + 1).map(
                            (pageNumber) => (
                                <button
                                    key={pageNumber}
                                    className={safePage === pageNumber ? "active" : ""}
                                    onClick={() => setPage(pageNumber)}
                                >
                                    {pageNumber}
                                </button>
                            )
                        )}

                        <button
                            disabled={safePage >= totalPages}
                            onClick={() =>
                                setPage((current) => Math.min(totalPages, current + 1))
                            }
                        >
                            <ChevronRight size={16}/>
                        </button>

                        <span>
              Mostrando {startIndex + 1}-
                            {Math.min(startIndex + PAGE_SIZE, filteredMaps.length)} de{" "}
                            {filteredMaps.length} mapas
            </span>
                    </div>
                )}
            </main>

            {mapToDelete && (
                <div
                    className="delete-modal-overlay"
                    onMouseDown={(event) => {
                        if (event.target === event.currentTarget && deletingId === null) {
                            setMapToDelete(null);
                        }
                    }}
                >
                    <div
                        ref={deleteDialogRef}
                        className="delete-modal"
                        role="alertdialog"
                        aria-modal="true"
                        aria-labelledby="delete-modal-title"
                        aria-describedby="delete-modal-description"
                    >
                        <div className="delete-modal-icon" aria-hidden="true">
                            <Trash2 size={26} />
                        </div>
                        <h2 id="delete-modal-title">Eliminar mapa</h2>
                        <p id="delete-modal-description">
                            ¿Estás seguro de que deseas eliminar
                            <strong> "{mapToDelete.name}"</strong>?
                        </p>
                        <p className="delete-modal-warning">
                            Esta acción no se puede deshacer.
                        </p>
                        <div className="delete-modal-actions">
                            <button
                                ref={cancelDeleteRef}
                                type="button"
                                className="delete-modal-cancel"
                                disabled={deletingId !== null}
                                onClick={() => setMapToDelete(null)}
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                className="delete-modal-confirm"
                                disabled={deletingId !== null}
                                onClick={confirmDelete}
                            >
                                {deletingId !== null ? (
                                    <>
                                        <RefreshCw size={16} className="delete-loading" />
                                        Eliminando...
                                    </>
                                ) : (
                                    <>
                                        <Trash2 size={16} />
                                        Eliminar mapa
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function MapCard({
                     map,
                     onOpen,
                     onDelete,
                     deleting,
                 }) {
    const biome = normalizeMapType(map.map_type);
    const Icon = biomeIcons[biome] || Map;

    return (
        <article
            className="map-card"
            onClick={onOpen}
            style={{cursor: "pointer"}}
            role="button"
            tabIndex={0}
            onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    onOpen();
                }
            }}
        >
            <div className="map-image">
                <MapThumbnail
                    matrix={map.matrix}
                    mapType={biome}
                />
            </div>

            <div className="map-card-content">

                {/* Nombre del mapa y botón eliminar */}
                <div className="map-card-header">
                    <h3>{map.name}</h3>

                    <button
                        type="button"
                        className="map-delete-button map-delete-button-card"
                        title="Eliminar mapa"
                        aria-label={`Eliminar ${map.name}`}
                        disabled={deleting}
                        onClick={(event) => {
                            event.stopPropagation();
                            onDelete();
                        }}
                        onKeyDown={(event) => {
                            event.stopPropagation();
                        }}
                    >
                        {deleting ? (
                            <RefreshCw
                                size={17}
                                className="delete-loading"
                            />
                        ) : (
                            <Trash2 size={17} />
                        )}
                    </button>
                </div>

                {/* Tipo de terreno */}
                <div className="map-biome">
                    <Icon size={13} />
                    {biome}
                </div>

                {/* Dimensiones */}
                <p>
                    {map.width}x{map.height} · {map.tile_size}px
                </p>

                {/* Semilla */}
                <p>Semilla: {map.seed}</p>

                {/* Fecha de creación */}
                <small>{formatDate(map.created_at)}</small>

            </div>
        </article>
    );
}

function MapListItem({
                         map,
                         onOpen,
                         onDelete,
                         deleting,
                     }) {
    const biome = normalizeMapType(map.map_type);
    const Icon = biomeIcons[biome] || Map;

    return (
        <article
            className="map-list-item"
            onClick={onOpen}
            style={{cursor: "pointer"}}
            role="button"
            tabIndex={0}
            onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    onOpen();
                }
            }}
        >
            <div className="map-list-thumbnail">
                <MapThumbnail matrix={map.matrix} mapType={biome}/>
            </div>

            <div className="map-list-info">
                <h3>{map.name}</h3>

                <span>
          <Icon size={13}/>
                    {biome}
        </span>
            </div>

            <div>
                {map.width}x{map.height}
            </div>

            <div>{map.tile_size}px</div>

            <div>Semilla: {map.seed}</div>

            <div>{formatDate(map.created_at)}</div>

            <div className="map-list-menu-wrapper">
                <button
                    type="button"
                    className="map-delete-button map-delete-button-list"
                    title="Eliminar mapa"
                    aria-label={`Eliminar ${map.name}`}
                    disabled={deleting}
                    onClick={(event) => {
                        event.stopPropagation();
                        onDelete();
                    }}
                    onKeyDown={(event) => {
                        event.stopPropagation();
                    }}
                >
                    {deleting ? (
                        <RefreshCw size={17} className="delete-loading" />
                    ) : (
                        <Trash2 size={17} />
                    )}
                </button>
            </div>
        </article>
    );
}

function MapThumbnail({ matrix, mapType }) {
    if (
        !Array.isArray(matrix) ||
        matrix.length === 0 ||
        !Array.isArray(matrix[0]) ||
        matrix[0].length === 0
    ) {
        return (
            <div className="map-thumbnail-empty">
                <Map size={30} />
                <span>Sin vista previa</span>
            </div>
        );
    }

    const rows = matrix.length;
    const columns = matrix[0].length;

    // Limitar la cantidad de celdas para las miniaturas
    const maxPreview = 55;

    const rowStep = Math.max(
        1,
        Math.ceil(rows / maxPreview)
    );

    const columnStep = Math.max(
        1,
        Math.ceil(columns / maxPreview)
    );

    const preview = matrix
        .filter((_, rowIndex) => rowIndex % rowStep === 0)
        .map((row) =>
            row.filter(
                (_, columnIndex) =>
                    columnIndex % columnStep === 0
            )
        );

    const normalizedType = String(
        mapType ?? ""
    ).toLowerCase();

    return (
        <div
            className="map-thumbnail"
            style={{
                display: "grid",

                gridTemplateColumns:
                    `repeat(${preview[0].length}, minmax(0, 1fr))`,

                gridTemplateRows:
                    `repeat(${preview.length}, minmax(0, 1fr))`,

                width: "100%",
                height: "100%",

                overflow: "hidden",

                backgroundColor: "#101820",
            }}
            aria-label={`Vista previa de ${columns} por ${rows}`}
        >
            {preview.flatMap((row, y) =>
                row.map((cell, x) => {
                    const cellValue = Number(cell);

                    const sprite = getTerrainSprite(
                        normalizedType,
                        cellValue
                    );

                    const isDungeon =
                        normalizedType === "mazmorra";

                    return (
                        <span
                            key={`${y}-${x}`}
                            style={{
                                minWidth: 0,
                                minHeight: 0,

                                backgroundColor: getMapColor(
                                    normalizedType,
                                    cellValue
                                ),

                                backgroundImage: sprite
                                    ? `url("${sprite}")`
                                    : "none",

                                backgroundSize: "100% 100%",
                                backgroundRepeat: "no-repeat",

                                imageRendering: "pixelated",

                                filter: isDungeon
                                    ? cellValue === 0
                                        ? "brightness(0.35)"
                                        : "brightness(1.15)"
                                    : "none",
                            }}
                        />
                    );
                })
            )}
        </div>
    );
}

function normalizeMapType(type) {
    const value = String(type ?? "").trim().toLowerCase();

    if (value === "bosque") return "Bosque";
    if (value === "desierto") return "Desierto";
    if (value === "ciudad" || value === "urbano") return "Ciudad";
    if (value === "mazmorra") return "Mazmorra";

    return type ? String(type) : "Mapa";
}

function getMapColor(type, value) {
    const active = value !== 0;

    switch (String(type ?? "").toLowerCase()) {
        case "bosque":
            return active ? "#22c55e" : "#123524";

        case "desierto":
            return active ? "#f4c76b" : "#8b5e34";

        case "ciudad":
        case "urbano":
            return active ? "#cbd5e1" : "#334155";

        case "mazmorra":
            return active ? "#d1d5db" : "#111827";

        default:
            return active ? "#10b981" : "#111827";
    }
}

function formatDate(value) {
    if (!value) return "Sin fecha";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "Sin fecha";
    }

    return new Intl.DateTimeFormat("es-CO", {
        dateStyle: "medium",
        timeStyle: "short",
    }).format(date);
}

function hasActiveFilters(search, biome, dateFilter, width, seed) {
    return (
        Boolean(search) ||
        biome !== "Todos" ||
        dateFilter !== "Cualquier fecha" ||
        width !== 10 ||
        Boolean(seed)
    );
}

export default MyMaps;
