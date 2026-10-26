import { resolveMapTile } from "../utils/mapTileResolver";

export default function MapRenderer({
                                        map,
                                        terrainType = "bosque",
                                        tileSize = 24,
                                    }) {
    if (!Array.isArray(map) || map.length === 0) {
        return <p>No hay mapa disponible.</p>;
    }

    const width = map[0]?.length;

    if (
        !width ||
        !map.every(
            (row) =>
                Array.isArray(row) &&
                row.length === width &&
                row.every((cell) => cell === 0 || cell === 1)
        )
    ) {
        return <p>La matriz del mapa no es válida.</p>;
    }

    return (
        <div
            style={{
                overflow: "auto",
                maxWidth: "100%",
                padding: "12px",
                background: "#101820",
                borderRadius: "8px",
            }}
        >
            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: `repeat(${width}, ${tileSize}px)`,
                    width: "max-content",
                    margin: "auto",
                }}
            >
                {map.flatMap((row, y) =>
                    row.map((cell, x) => {

                        const sprite = resolveMapTile(
                            map,
                            y,
                            x,
                            terrainType
                        );

                        return (
                            <div
                                key={`${x}-${y}`}
                                style={{
                                    width: tileSize,
                                    height: tileSize,

                                    backgroundColor:
                                        terrainType === "mazmorra"
                                            ? cell === 0
                                                ? "#263238"
                                                : "#9CA3AF"
                                            : cell === 0
                                                ? "#374151"
                                                : "#3BA776",

                                    backgroundImage: sprite
                                        ? `url("${sprite}")`
                                        : "none",

                                    backgroundSize: "100% 100%",
                                    backgroundRepeat: "no-repeat",
                                    imageRendering: "pixelated",

                                    filter:
                                        terrainType === "mazmorra"
                                            ? cell === 0
                                                ? "brightness(0.35)"
                                                : "brightness(1.15)"
                                            : "none",
                                }}
                            />
                        );
                    })
                )}
            </div>
        </div>
    );
}