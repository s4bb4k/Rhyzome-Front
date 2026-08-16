import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

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
  MoreVertical,
  Grid2X2,
  List,
  ChevronLeft,
  ChevronRight,
  Map,
  LogOut,
  X,
} from "lucide-react";

import { supabase } from "../../../lib/supabase";


const initialMaps = [
  {
    id: 1,
    name: "Bosque Encantado",
    biome: "Bosque",
    width: 50,
    height: 35,
    tileSize: 16,
    seed: 42869,
    created: "Hoy, 10:24 AM",
    image:
      "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: 2,
    name: "Bosque Profundo",
    biome: "Bosque",
    width: 80,
    height: 60,
    tileSize: 12,
    seed: 91327,
    created: "Ayer, 6:15 PM",
    image:
      "https://images.unsplash.com/photo-1511497584788-876760111969?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: 3,
    name: "Sendero Verde",
    biome: "Bosque",
    width: 80,
    height: 60,
    tileSize: 12,
    seed: 33421,
    created: "Hace 2 días",
    image:
      "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: 4,
    name: "Claro del Bosque",
    biome: "Bosque",
    width: 60,
    height: 45,
    tileSize: 16,
    seed: 77812,
    created: "Hace 3 días",
    image:
      "https://images.unsplash.com/photo-1501854140801-50d01698950b?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: 5,
    name: "Bosque Nebuloso",
    biome: "Bosque",
    width: 70,
    height: 50,
    tileSize: 12,
    seed: 56578,
    created: "Hace 4 días",
    image:
      "https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: 6,
    name: "Arboleda Silenciosa",
    biome: "Bosque",
    width: 90,
    height: 50,
    tileSize: 12,
    seed: 22109,
    created: "Hace 5 días",
    image:
      "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=600&q=80",
  },
];


const biomeIcons = {
  Todos: Map,
  Bosque: Trees,
  Desierto: Sun,
  Urbano: Building2,
  Mazmorra: Skull,
};


function MyMaps() {

  const navigate = useNavigate();

  const [maps] = useState(initialMaps);

  const [search, setSearch] = useState("");

  const [biome, setBiome] = useState("Todos");

  const [dateFilter, setDateFilter] = useState("Cualquier fecha");

  const [width, setWidth] = useState(10);

  const [seed, setSeed] = useState("");

  const [showFilters, setShowFilters] = useState(true);

  const [view, setView] = useState("grid");

  const [sort, setSort] = useState("Más recientes");


  /* ================================
     FILTRADO
  ================================= */

  const filteredMaps = useMemo(() => {

    return maps.filter((map) => {

      const searchMatch =
        map.name
          .toLowerCase()
          .includes(search.toLowerCase());

      const biomeMatch =
        biome === "Todos" ||
        map.biome === biome;

      const widthMatch =
        map.width >= width;

      const seedMatch =
        !seed ||
        String(map.seed).includes(seed);

      return (
        searchMatch &&
        biomeMatch &&
        widthMatch &&
        seedMatch
      );

    });

  }, [maps, search, biome, width, seed]);


  /* ================================
     LOGOUT
  ================================= */

  const logout = async () => {

    await supabase.auth.signOut();

    navigate("/");

  };


  /* ================================
     CREAR MAPA
  ================================= */

  const createMap = () => {

    navigate("/dashboard");

  };


  return (

    <div className="maps-page">


      {/* =========================
          HEADER
      ========================== */}

      <header className="maps-header">

        <div className="maps-brand">

          <div className="maps-brand-icon">
            <Map size={17} />
          </div>

          <strong>
            Rhizome
          </strong>

        </div>


        <div className="maps-header-actions">

          <button
            className="new-map-button"
            onClick={createMap}
          >
            <Plus size={16} />

            Nuevo mapa
          </button>

          <button
            className="logout-button"
            onClick={logout}
            title="Cerrar sesión"
          >
            <LogOut size={15} />
          </button>

        </div>

      </header>


      {/* =========================
          CONTENT
      ========================== */}

      <main className="maps-content">


        {/* TITLE */}

        <div className="maps-title">

          <h1>
            Mis Mapas
          </h1>

          <p>
            {filteredMaps.length} mapas encontrados
          </p>

        </div>


        {/* =========================
            SEARCH + FILTERS
        ========================== */}

        <section className="maps-filter-box">


          {/* SEARCH */}

          <div className="maps-search-row">

            <div className="maps-search">

              <Search size={17} />

              <input
                type="text"
                placeholder="Buscar por nombre de mapa..."
                value={search}
                onChange={(e) =>
                  setSearch(e.target.value)
                }
              />

              {search && (

                <button
                  className="clear-search"
                  onClick={() => setSearch("")}
                >
                  <X size={15} />
                </button>

              )}

            </div>


            <button
              className="filters-button"
              onClick={() =>
                setShowFilters(!showFilters)
              }
            >

              <SlidersHorizontal size={15} />

              Filtros

              {showFilters ? (
                <ChevronUp size={14} />
              ) : (
                <ChevronDown size={14} />
              )}

            </button>

          </div>


          {/* FILTERS */}

          {showFilters && (

            <div className="filters-content">


              {/* BIOMA */}

              <div className="filter-group">

                <label>
                  BIOMA
                </label>

                <div className="filter-options">

                  {[
                    "Todos",
                    "Bosque",
                    "Desierto",
                    "Urbano",
                    "Mazmorra",
                  ].map((item) => {

                    const Icon =
                      biomeIcons[item];

                    return (

                      <button
                        key={item}
                        className={
                          biome === item
                            ? "filter-chip active"
                            : "filter-chip"
                        }
                        onClick={() =>
                          setBiome(item)
                        }
                      >

                        <Icon size={12} />

                        {item}

                      </button>

                    );

                  })}

                </div>

              </div>


              {/* FECHA */}

              <div className="filter-group">

                <label>
                  FECHA DE CREACIÓN
                </label>

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
                      onClick={() =>
                        setDateFilter(item)
                      }
                    >
                      {item}
                    </button>

                  ))}

                </div>

              </div>


              {/* WIDTH */}

              <div className="filter-group width-filter">

                <div className="filter-label-row">

                  <label>
                    ANCHO DEL MAPA
                  </label>

                  <strong>
                    {width}-150
                  </strong>

                </div>

                <input
                  type="range"
                  min="10"
                  max="150"
                  value={width}
                  onChange={(e) =>
                    setWidth(Number(e.target.value))
                  }
                />

              </div>


              {/* SEED */}

              <div className="filter-group seed-filter">

                <label>
                  SEMILLA
                </label>

                <input
                  type="text"
                  placeholder="Ej. 42869"
                  value={seed}
                  onChange={(e) =>
                    setSeed(e.target.value)
                  }
                />

              </div>

            </div>

          )}

        </section>


        {/* =========================
            RESULTS TOOLBAR
        ========================== */}

        {filteredMaps.length > 0 && (

          <div className="results-toolbar">

            <div />

            <div className="results-actions">

              <span>
                Ordenar por:
              </span>

              <select
                value={sort}
                onChange={(e) =>
                  setSort(e.target.value)
                }
              >
                <option>
                  Más recientes
                </option>

                <option>
                  Más antiguos
                </option>

                <option>
                  Nombre A-Z
                </option>

                <option>
                  Nombre Z-A
                </option>
              </select>


              <button
                className={
                  view === "grid"
                    ? "view-button active"
                    : "view-button"
                }
                onClick={() =>
                  setView("grid")
                }
              >
                <Grid2X2 size={15} />
              </button>


              <button
                className={
                  view === "list"
                    ? "view-button active"
                    : "view-button"
                }
                onClick={() =>
                  setView("list")
                }
              >
                <List size={15} />
              </button>

            </div>

          </div>

        )}


        {/* =========================
            EMPTY STATE
        ========================== */}

        {filteredMaps.length === 0 && (

          <div className="maps-empty">

            <div className="empty-icon">
              <Map size={42} />
            </div>

            <h2>
              {search || biome !== "Todos"
                ? "No se encontraron mapas"
                : "Aún no tienes mapas"}
            </h2>

            <p>
              {search || biome !== "Todos"
                ? "Intenta cambiar los filtros de búsqueda."
                : "¡Genera y guarda tu primer mapa!"}
            </p>

            {!search &&
              biome === "Todos" && (

                <button
                  className="create-first-map"
                  onClick={createMap}
                >
                  <Plus size={16} />
                  Crear primer mapa
                </button>

              )}

          </div>

        )}


        {/* =========================
            MAP GRID
        ========================== */}

        {filteredMaps.length > 0 && view === "grid" && (

          <div className="maps-grid">

            {filteredMaps.map((map) => (

              <MapCard
                key={map.id}
                map={map}
              />

            ))}

          </div>

        )}


        {/* =========================
            LIST VIEW
        ========================== */}

        {filteredMaps.length > 0 && view === "list" && (

          <div className="maps-list">

            {filteredMaps.map((map) => (

              <MapListItem
                key={map.id}
                map={map}
              />

            ))}

          </div>

        )}


        {/* PAGINATION */}

        {filteredMaps.length > 0 && (

          <div className="maps-pagination">

            <button>
              <ChevronLeft size={16} />
            </button>

            <button className="active">
              1
            </button>

            <button>
              2
            </button>

            <button>
              <ChevronRight size={16} />
            </button>

            <span>
              Mostrando 1-{filteredMaps.length} de{" "}
              {filteredMaps.length} mapas
            </span>

          </div>

        )}

      </main>

    </div>
  );
}


/* =====================================================
   MAP CARD
===================================================== */

function MapCard({ map }) {

  const Icon =
    biomeIcons[map.biome] || Map;

  return (

    <article className="map-card">

      <div className="map-image">

        <img
          src={map.image}
          alt={map.name}
        />

        <button className="map-menu">
          <MoreVertical size={16} />
        </button>

      </div>


      <div className="map-card-content">

        <h3>
          {map.name}
        </h3>

        <div className="map-biome">

          <Icon size={13} />

          {map.biome}

        </div>

        <p>
          {map.width}x{map.height} ·{" "}
          {map.tileSize}px
        </p>

        <p>
          Semilla: {map.seed}
        </p>

        <small>
          {map.created}
        </small>

      </div>

    </article>

  );
}


/* =====================================================
   LIST ITEM
===================================================== */

function MapListItem({ map }) {

  const Icon =
    biomeIcons[map.biome] || Map;

  return (

    <article className="map-list-item">

      <img
        src={map.image}
        alt={map.name}
      />

      <div className="map-list-info">

        <h3>
          {map.name}
        </h3>

        <span>
          <Icon size={13} />
          {map.biome}
        </span>

      </div>

      <div>
        {map.width}x{map.height}
      </div>

      <div>
        {map.tileSize}px
      </div>

      <div>
        Semilla: {map.seed}
      </div>

      <div>
        {map.created}
      </div>

      <button>
        <MoreVertical size={16} />
      </button>

    </article>

  );
}


export default MyMaps;