import {useEffect, useMemo, useRef, useState} from "react";
import {useNavigate} from "react-router-dom";

import {
    Search,
    SlidersHorizontal,
    ChevronUp,
    ChevronDown,
    Plus,
    BookOpen,
    Trees,
    Sun,
    Building2,
    Skull,
    Grid2X2,
    List,
    ChevronLeft,
    ChevronRight,
    Map as MapIcon,
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

import {toast} from "sonner";

const biomeIcons = {
    Todos: MapIcon,
    Bosque: Trees,
    Desierto: Sun,
    Ciudad: Building2,
    Mazmorra: Skull,
};

import "./MyMaps-modal.css";
import "./MyMapsRedesign.css";

const PAGE_SIZE = 6;

function MyMaps() {
    const navigate = useNavigate();

    const [maps, setMaps] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState("");

    const [search, setSearch] = useState("");
    const [biome, setBiome] = useState("Todos");
    const [dateFilter, setDateFilter] = useState("Cualquier fecha");
    const [showFilters, setShowFilters] = useState(true);
    const [hasSearched, setHasSearched] = useState(false);
    // Los controles son borradores; la galería solo usa los filtros aplicados.
    const [appliedFilters, setAppliedFilters] = useState({
        search: "", biome: "Todos", dateFilter: "Cualquier fecha",
    });
    const applyFilters = () => {
        setAppliedFilters({search: search.trim(), biome, dateFilter});
        setHasSearched(true);
        setPage(1);
    };
    const clearFilters = () => {
        setSearch("");
        setBiome("Todos");
        setDateFilter("Cualquier fecha");
        setAppliedFilters({search: "", biome: "Todos", dateFilter: "Cualquier fecha"});
        setHasSearched(false);
        setPage(1);
    };
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
            setMaps(data.filter((map) => Boolean(map.generation_data?.layers)));
        } catch (error) {
            console.error("Error cargando mapas:", error);
            setLoadError(error?.message || "No fue posible cargar los mapas.");
        } finally {
            setLoading(false);
        }
    }

    const filteredMaps = useMemo(() => {
        const now = new Date();
        const {search: activeSearch, biome: activeBiome, dateFilter: activeDateFilter} = appliedFilters;

        const result = maps.filter((map) => {
            const name = String(map.name ?? "");
            const type = normalizeMapType(map.map_type);

            const searchMatch = name.toLowerCase().includes(activeSearch.toLowerCase());

            const biomeMatch =
                activeBiome === "Todos" ||
                type.toLowerCase() === activeBiome.toLowerCase();

            const createdAt = map.created_at ? new Date(map.created_at) : null;
            let dateMatch = true;

            if (activeDateFilter !== "Cualquier fecha") {
                if (!createdAt || Number.isNaN(createdAt.getTime())) return false;
                const diffMs = now.getTime() - createdAt.getTime();
                const diffDays = diffMs / (1000 * 60 * 60 * 24);

                if (activeDateFilter === "Hoy") {
                    dateMatch =
                        createdAt.getFullYear() === now.getFullYear() &&
                        createdAt.getMonth() === now.getMonth() &&
                        createdAt.getDate() === now.getDate();
                } else if (activeDateFilter === "Últimos 7 días") {
                    dateMatch = diffDays >= 0 && diffDays <= 7;
                } else if (activeDateFilter === "Últimos 30 días") {
                    dateMatch = diffDays >= 0 && diffDays <= 30;
                }
            }

            return searchMatch && biomeMatch && dateMatch;
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
    }, [maps, appliedFilters, sort]);

    useEffect(() => {
        setPage(1);
    }, [appliedFilters, sort]);

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
                <div className="maps-brand" aria-label="Rhyzome">
                    <div className="maps-brand-icon"><MapIcon size={17}/></div>
                    <strong>RHYZOME</strong>
                </div>
                <nav className="maps-header-actions" aria-label="Navegación principal">
                    <button type="button" className="maps-nav-button" onClick={createMap}>
                        <MapIcon size={18}/> Generador
                    </button>
                    <span className="maps-nav-button maps-nav-current" aria-current="page">
                        <Grid2X2 size={18}/> Mis mapas
                    </span>
                    <button type="button" className="logout-button" onClick={logout}
                            title="Cerrar sesión" aria-label="Cerrar sesión">
                        <LogOut size={18}/>
                    </button>
                </nav>
            </header>

            <main className="maps-content">
                <div className="maps-title">
                    <h1>Mis Mapas</h1>
                    <p>Gestiona y revisa los mapas que has generado en Rhyzome.</p>
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
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") applyFilters();
                                }}
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

                        </div>
                    )}
                    <div className="maps-filter-actions">
                        <button type="button" className="maps-apply-search" onClick={applyFilters}>
                            <Search size={16}/> Buscar mapas
                        </button>
                        <button type="button" className="maps-reset-search" onClick={clearFilters}>
                            <X size={15}/> Limpiar filtros
                        </button>
                    </div>
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

                {!loading && !loadError && !hasSearched && (
                    <div className="maps-empty" role="status">
                        <div className="empty-icon"><Search size={42}/></div>
                        <h2>Busca tus mapas guardados</h2>
                        <p>Selecciona un bioma, una fecha o escribe un nombre y presiona Buscar mapas. Si no eliges
                            filtros, se mostrarán todos los mapas.</p>
                    </div>
                )}

                {hasSearched && !loadError && filteredMaps.length > 0 && (
                    <div className="results-toolbar">
                        <span className="maps-results-count">
                            {loading ? "Cargando mapas..." : `${filteredMaps.length} mapas encontrados`}
                        </span>

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

                {hasSearched && !loading && !loadError && filteredMaps.length === 0 && (
                    <div className="maps-empty">
                        <div className="empty-icon">
                            <MapIcon size={42}/>
                        </div>

                        <h2>
                            {hasActiveFilters(appliedFilters.search, appliedFilters.biome, appliedFilters.dateFilter)
                                ? "No se encontraron mapas"
                                : "Aún no tienes mapas"}
                        </h2>

                        <p>
                            {hasActiveFilters(appliedFilters.search, appliedFilters.biome, appliedFilters.dateFilter)
                                ? "Intenta cambiar los filtros de búsqueda."
                                : "¡Genera y guarda tu primer mapa!"}
                        </p>

                        {!hasActiveFilters(appliedFilters.search, appliedFilters.biome, appliedFilters.dateFilter) && (
                            <button className="create-first-map" onClick={createMap}>
                                <Plus size={16}/>
                                Crear primer mapa
                            </button>
                        )}
                    </div>
                )}

                {hasSearched && !loading &&
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

                {hasSearched && !loading &&
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

                {hasSearched && !loading && !loadError && filteredMaps.length > 0 && (
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

            <footer className="dashboard-footer rh-footer maps-footer">
                <div className="rh-footer-identity">
                    <MapIcon size={17} aria-hidden="true"/>
                    <strong>RHYZOME</strong>
                    <span className="rh-footer-divider" aria-hidden="true"/>
                    <span>Generador procedural de escenarios 2D</span>
                </div>
                <span className="rh-footer-copyright">© 2026 · Proyecto académico</span>
            </footer>

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
                            <Trash2 size={26}/>
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
                                        <RefreshCw size={16} className="delete-loading"/>
                                        Eliminando...
                                    </>
                                ) : (
                                    <>
                                        <Trash2 size={16}/>
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
    const Icon = biomeIcons[biome] || MapIcon;

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
                            <Trash2 size={17}/>
                        )}
                    </button>
                </div>

                {/* Tipo de terreno */}
                <div className="map-biome">
                    <Icon size={13}/>
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
    const Icon = biomeIcons[biome] || MapIcon;

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
                        <RefreshCw size={17} className="delete-loading"/>
                    ) : (
                        <Trash2 size={17}/>
                    )}
                </button>
            </div>
        </article>
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

function hasActiveFilters(search, biome, dateFilter) {
    return (
        Boolean(search) ||
        biome !== "Todos" ||
        dateFilter !== "Cualquier fecha"
    );
}

export default MyMaps;

