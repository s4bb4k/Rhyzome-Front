import {
    TERRAIN_SPRITES,
    DECORATIVE_SPRITES,
} from "./terrainSprites";

export function resolveMapTile(
    map,
    row,
    col,
    terrainType
) {
    const cell = map[row][col];

    const terrain = TERRAIN_SPRITES[terrainType];

    if (!terrain) {
        return null;
    }

    // Suelo transitable
    if (cell === 1) {
        return terrain[1];
    }

    // Obstáculo
    if (cell === 0 && terrainType === "mazmorra") {
        const wall = terrain[0];

        const top = map[row - 1]?.[col];
        const left = map[row]?.[col - 1];

        const decorative = DECORATIVE_SPRITES.mazmorra;

        // Esquina superior izquierda de un bloque de pared
        if (top !== 0 && left !== 0) {
            return decorative.wallCorner;
        }

        // Borde superior de un bloque de pared
        if (top !== 0) {
            return decorative.wallEdge;
        }

        return wall;
    }

    return terrain[0];
}