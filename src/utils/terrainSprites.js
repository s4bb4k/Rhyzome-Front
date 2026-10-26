// BOSQUE
import grass from "../assets/kenney/terrain/grass.png";
import tree from "../assets/kenney/terrain/tree.png";

// DESIERTO
import sand from "../assets/kenney/terrain/sand.png";
import stone from "../assets/kenney/terrain/stone.png";

// MAZMORRA
import floor from "../assets/kenney/dungeon/floor.png";
import wall from "../assets/kenney/dungeon/wall.png";
import wallEdge from "../assets/kenney/dungeon/wall_edge.png";
import wallCorner from "../assets/kenney/dungeon/wall_corner.png";

// CIUDAD
import road from "../assets/kenney/city/road.png";
import building from "../assets/kenney/city/building.png";

export const TERRAIN_SPRITES = {
    bosque: {
        0: tree,
        1: grass,
    },

    desierto: {
        0: stone,
        1: sand,
    },

    ciudad: {
        0: building,
        1: road,
    },

    urbano: {
        0: building,
        1: road,
    },

    mazmorra: {
        0: wall,
        1: floor,
    },
};

export const DECORATIVE_SPRITES = {
    mazmorra: {
        wallEdge,
        wallCorner,
    },
};

export function getTerrainSprite(terrainType, cellValue) {
    const terrain = TERRAIN_SPRITES[
        String(terrainType).toLowerCase()
        ];

    if (!terrain) {
        return null;
    }

    return terrain[cellValue] ?? null;
}