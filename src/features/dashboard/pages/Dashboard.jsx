import { useState } from "react";
import { useNavigate } from "react-router-dom";

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
  Sparkles
} from "lucide-react";

import { supabase } from "../../../lib/supabase";

function Dashboard() {
  const navigate = useNavigate();

  const [mapType, setMapType] = useState("Bosque");

  const [width, setWidth] = useState(50);
  const [height, setHeight] = useState(35);
  const [seed, setSeed] = useState(539989);

  const [perlin, setPerlin] = useState(true);
  const [cellular, setCellular] = useState(false);

  const [complexity, setComplexity] = useState("Medio");
  const [tileSize, setTileSize] = useState(16);

  const [quality, setQuality] = useState(78);
  const [compression, setCompression] = useState(75);
  const [accessibility, setAccessibility] = useState(80);

  const [generating, setGenerating] = useState(false);

  const generateMap = async () => {
    setGenerating(true);

    // Aquí posteriormente conectaremos
    // con el backend de Rhizome.

    console.log({
      mapType,
      width,
      height,
      seed,
      perlin,
      cellular,
      complexity,
      tileSize,
      quality,
      compression,
      accessibility,
    });

    setTimeout(() => {
      setGenerating(false);
    }, 1000);
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
            <Map size={17} />
          </div>

          <strong>Rhizome</strong>
        </div>

        <div className="header-actions">

          <button
            type="button"
            className="maps-button"
            onClick={() => navigate("/maps")}
            >
            <Map size={14} />
            Mis mapas
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
                onClick={() => setMapType("Bosque")}
              >
                <Trees size={14} />
                Bosque
              </button>

              <button
                className={mapType === "Desierto" ? "map-type active" : "map-type"}
                onClick={() => setMapType("Desierto")}
              >
                <Sun size={14} />
                Desierto
              </button>

              <button
                className={mapType === "Urbano" ? "map-type active" : "map-type"}
                onClick={() => setMapType("Urbano")}
              >
                <Building2 size={14} />
                Urbano
              </button>

              <button
                className={mapType === "Mazmorra" ? "map-type active" : "map-type"}
                onClick={() => setMapType("Mazmorra")}
              >
                <Skull size={14} />
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
                <Shuffle size={14} />
              </button>

            </div>

          </section>

          {/* ALGORITMOS */}
          <section className="parameter-section">

            <div className="section-label">
              ALGORITMOS
            </div>

            <Algorithm
              title="Ruido Perlin/Simplex"
              description="Terreno orgánico y natural"
              enabled={perlin}
              setEnabled={setPerlin}
            />

            <Algorithm
              title="Autómatas Celulares"
              description="Genera cuevas y grutas"
              enabled={cellular}
              setEnabled={setCellular}
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

          {/* EVALUACIÓN */}
          <section className="parameter-section">

            <div className="section-label">
              EVALUACIÓN
            </div>

            <Slider
              label="CALIDAD"
              value={quality}
              min={0}
              max={100}
              onChange={setQuality}
              suffix="%"
            />

            <Slider
              label="COMPRENSIÓN"
              value={compression}
              min={0}
              max={100}
              onChange={setCompression}
              suffix="%"
            />

            <Slider
              label="ACCESIBILIDAD"
              value={accessibility}
              min={0}
              max={100}
              onChange={setAccessibility}
              suffix="%"
            />

          </section>

          {/* ACTIONS */}
          <div className="sidebar-actions">

            <button
              className="generate-button"
              onClick={generateMap}
              disabled={generating}
            >
              <Sparkles size={15} />

              {generating
                ? "Generando..."
                : "Generar mapa"}
            </button>

            <div className="export-buttons">

              <button>
                <Save size={14} />
                Guardar
              </button>

              <button>
                <FileJson size={14} />
                JSON
              </button>

              <button>
                <Image size={14} />
                PNG
              </button>

            </div>

          </div>

        </aside>

        {/* WORKSPACE */}
        <main className="workspace">

          <div className="empty-workspace">

            <Map
              size={44}
              strokeWidth={1.5}
            />

            <h2>
              Configura y genera tu mapa
            </h2>

            <p>
              Ajusta los parámetros de la izquierda y
              presiona <strong>"Generar"</strong> para
              crear tu mapa procedural
            </p>

          </div>

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
}) {
  return (
    <div className="slider-group">

      <div className="slider-header">

        <span>{label}</span>

        <strong>
          {value}{suffix}
        </strong>

      </div>

      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />

    </div>
  );
}


function Algorithm({
  title,
  description,
  enabled,
  setEnabled,
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
        onClick={() => setEnabled(!enabled)}
      >
        <span />
      </button>

    </div>
  );
}

export default Dashboard;