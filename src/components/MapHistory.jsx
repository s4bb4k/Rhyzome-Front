import { useEffect, useRef, useState } from "react";
import { Clock3, ChevronDown, Eye, Trash2, CheckCircle2 } from "lucide-react";
import "./css/MapHistory.css";

/** Menú compacto superpuesto a la esquina superior derecha del explorador. */
export default function MapHistory({
                                       maps = [],
                                       activeMapId = null,
                                       onSelect,
                                       onDelete,
                                       disabled = false,
                                   }) {
    const [open, setOpen] = useState(false);
    const rootRef = useRef(null);

    useEffect(() => {
        if (!open) return undefined;
        const onPointerDown = (event) => {
            if (!rootRef.current?.contains(event.target)) setOpen(false);
        };
        const onKeyDown = (event) => {
            if (event.key === "Escape") setOpen(false);
        };
        document.addEventListener("pointerdown", onPointerDown);
        document.addEventListener("keydown", onKeyDown);
        return () => {
            document.removeEventListener("pointerdown", onPointerDown);
            document.removeEventListener("keydown", onKeyDown);
        };
    }, [open]);

    if (maps.length === 0) return null;

    return (
        <div className="map-history-compact" ref={rootRef}>
            <button
                type="button"
                className={`map-history-trigger${open ? " is-open" : ""}`}
                onClick={() => setOpen((value) => !value)}
                aria-expanded={open}
                aria-controls="map-history-menu"
                title="Consultar historial temporal de mapas"
            >
                <Clock3 size={14} />
                <span>Historial {maps.length}/5</span>
                <ChevronDown size={13} className={open ? "map-history-chevron-up" : ""} />
            </button>

            {open && (
                <div className="map-history-popover" id="map-history-menu" role="region" aria-label="Historial de generación">
                    <div className="map-history-popover-heading">
                        <strong>Mapas recientes</strong>
                        <span>Solo durante esta sesión</span>
                    </div>
                    <div className="map-history-items">
                        {maps.map((item) => {
                            const active = item.id === activeMapId;
                            return (
                                <div className={`map-history-row${active ? " is-active" : ""}`} key={item.id}>
                                    <button
                                        type="button"
                                        className="map-history-select"
                                        disabled={active || disabled}
                                        onClick={() => {
                                            setOpen(false);
                                            onSelect?.(item.id);
                                        }}
                                        title={active ? "Mapa actual" : "Recuperar este mapa"}
                                    >
                                        <span className="map-history-row-title">
                                            <strong>{item.config.mapType}</strong>
                                            {item.isSaved && <CheckCircle2 size={13} aria-label="Guardado" />}
                                        </span>
                                        <small>Semilla {item.config.seed} · {item.config.width}×{item.config.height} · Calidad {item.quality}%</small>
                                    </button>
                                    {active ? (
                                        <span className="map-history-active-tag">Actual</span>
                                    ) : (
                                        <Eye size={14} className="map-history-eye" aria-hidden="true" />
                                    )}
                                    <button
                                        type="button"
                                        className="map-history-remove"
                                        disabled={disabled}
                                        onClick={() => onDelete?.(item.id)}
                                        title="Quitar del historial (no elimina de Supabase)"
                                        aria-label={`Quitar ${item.config.mapType}, semilla ${item.config.seed}, del historial`}
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
