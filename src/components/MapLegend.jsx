import { useMemo } from "react";
import { Layers3 } from "lucide-react";

import "./css/MapLegend.css";

/* ==========================================
   RHYZOME - CONFIGURACIÓN DE LEYENDAS
   ========================================== */

const LEGEND_CONFIG = {

    /* ======================================
       BOSQUE
       ====================================== */

    bosque: [
        {
            id: "forest-ground",
            label: "Terreno transitable",
            description: "Zona disponible para el desplazamiento.",
            color: "#65a30d",
        },
        {
            id: "forest-obstacle",
            label: "Obstáculo natural",
            description: "Elemento que restringe el desplazamiento.",
            color: "#166534",
        },
    ],

    /* ======================================
       DESIERTO
       ====================================== */

    desierto: [
        {
            id: "desert-ground",
            label: "Terreno arenoso",
            description: "Superficie transitable del escenario desértico.",
            color: "#EAD7B5",
        },
        {
            id: "desert-obstacle",
            label: "Obstáculo",
            description: "Elemento que restringe el desplazamiento.",
            color: "#A8B9BF",
        },
    ],

    /* ======================================
       CIUDAD
       ====================================== */

    ciudad: [
        {
            id: "city-ground",
            label: "Zona transitable",
            description: "Espacio disponible para el desplazamiento.",
            color: "#A8B9BF",
        },
        {
            id: "city-obstacle",
            label: "Estructura",
            description: "Elemento que restringe el desplazamiento.",
            color: "#B88A58",
        },
    ],

    /* ======================================
       MAZMORRA
       ====================================== */

    mazmorra: [
        {
            id: "dungeon-floor",
            label: "Suelo",
            description: "Zona transitable dentro de la mazmorra.",
            color: "#a8a29e",
        },
        {
            id: "dungeon-wall",
            label: "Pared",
            description: "Elemento que limita el desplazamiento.",
            color: "#475569",
        },
    ],

    /* ======================================
       PERLIN NOISE - RESPALDO
       ====================================== */

    perlin: [
        {
            id: "perlin-ground",
            label: "Terreno transitable",
            description: "Zona disponible para el desplazamiento.",
            color: "#65a30d",
        },
        {
            id: "perlin-obstacle",
            label: "Obstáculo",
            description: "Zona que restringe el desplazamiento.",
            color: "#166534",
        },
    ],

    /* ======================================
       AUTÓMATA CELULAR - RESPALDO
       ====================================== */

    cellular: [
        {
            id: "cellular-floor",
            label: "Suelo",
            description: "Zona transitable del escenario.",
            color: "#a8a29e",
        },
        {
            id: "cellular-wall",
            label: "Pared",
            description: "Zona que limita el desplazamiento.",
            color: "#475569",
        },
    ],
};


/* ==========================================
   NORMALIZAR TIPO DE TERRENO
   ========================================== */

function normalizeTerrain(terrainType) {

    const value = String(terrainType ?? "")
        .trim()
        .toLowerCase();

    if (
        value.includes("bosque") ||
        value.includes("forest")
    ) {
        return "bosque";
    }

    if (
        value.includes("desierto") ||
        value.includes("desert")
    ) {
        return "desierto";
    }

    if (
        value.includes("ciudad") ||
        value.includes("city")
    ) {
        return "ciudad";
    }

    if (
        value.includes("mazmorra") ||
        value.includes("dungeon")
    ) {
        return "mazmorra";
    }

    return null;
}


/* ==========================================
   NORMALIZAR ALGORITMO
   ========================================== */

function normalizeAlgorithm(algorithm) {

    const value = String(algorithm ?? "")
        .trim()
        .toLowerCase();

    if (
        value.includes("cellular") ||
        value.includes("celular") ||
        value.includes("automata") ||
        value.includes("autómata")
    ) {
        return "cellular";
    }

    if (value.includes("perlin")) {
        return "perlin";
    }

    return null;
}


/* ==========================================
   COMPONENTE PRINCIPAL
   ========================================== */

export default function MapLegend({
                                      algorithm,
                                      terrainType,
                                      items,
                                  }) {

    /* ======================================
       OBTENER ELEMENTOS DE LA LEYENDA
       ====================================== */

    const legendItems = useMemo(() => {

        // Permitir leyendas personalizadas
        if (Array.isArray(items)) {
            return items;
        }

        // Identificar el escenario
        const terrain = normalizeTerrain(terrainType);

        // Priorizar la leyenda del escenario
        if (terrain && LEGEND_CONFIG[terrain]) {
            return LEGEND_CONFIG[terrain];
        }

        // Si no existe, utilizar el algoritmo
        const normalizedAlgorithm =
            normalizeAlgorithm(algorithm);

        if (
            normalizedAlgorithm &&
            LEGEND_CONFIG[normalizedAlgorithm]
        ) {
            return LEGEND_CONFIG[normalizedAlgorithm];
        }

        // Sin configuración disponible
        return [];

    }, [algorithm, terrainType, items]);


    /* ======================================
       NO MOSTRAR SI NO HAY ELEMENTOS
       ====================================== */

    if (legendItems.length === 0) {
        return null;
    }


    /* ======================================
       RENDERIZAR LEYENDA
       ====================================== */

    return (
        <section
            className="map-legend"
            aria-label="Leyenda del mapa"
        >

            {/* ENCABEZADO */}

            <div className="map-legend-header">

                <div className="map-legend-title">

                    <Layers3
                        size={17}
                        strokeWidth={1.8}
                    />

                    <h3>
                        Leyenda del mapa
                    </h3>

                </div>

                <span className="map-legend-count">
                    {legendItems.length} tipos
                </span>

            </div>


            {/* ELEMENTOS */}

            <div className="map-legend-items">

                {legendItems.map((item) => (

                    <div
                        key={item.id}
                        className="map-legend-item"
                    >

                        {/* COLOR DEL TERRENO */}

                        <span
                            className="map-legend-color"
                            style={{
                                backgroundColor: item.color,
                            }}
                            aria-hidden="true"
                        />


                        {/* INFORMACIÓN */}

                        <div className="map-legend-item-info">

                            <span className="map-legend-item-label">
                                {item.label}
                            </span>

                            <span className="map-legend-item-description">
                                {item.description}
                            </span>

                        </div>

                    </div>

                ))}

            </div>

        </section>
    );
}