import { useEffect, useRef, useState } from "react";
import { Maximize2, Minimize2, Move, RotateCcw } from "lucide-react";

import "./css/MapViewer.css";

export default function MapViewer({ children }) {
    const viewerRef = useRef(null);
    const viewportRef = useRef(null);

    const dragRef = useRef({
        active: false,
        pointerId: null,
        startX: 0,
        startY: 0,
        scrollLeft: 0,
        scrollTop: 0,
    });

    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isDragging, setIsDragging] = useState(false);

    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(
                document.fullscreenElement === viewerRef.current
            );
        };

        document.addEventListener(
            "fullscreenchange",
            handleFullscreenChange
        );

        return () => {
            document.removeEventListener(
                "fullscreenchange",
                handleFullscreenChange
            );
        };
    }, []);

    const toggleFullscreen = async () => {
        try {
            if (document.fullscreenElement === viewerRef.current) {
                await document.exitFullscreen();
            } else if (!document.fullscreenElement) {
                await viewerRef.current?.requestFullscreen();
            }
        } catch (error) {
            console.error(
                "No fue posible cambiar a pantalla completa:",
                error
            );
        }
    };

    const handlePointerDown = (event) => {
        if (event.button !== 0) return;

        const viewport = viewportRef.current;
        if (!viewport) return;

        dragRef.current = {
            active: true,
            pointerId: event.pointerId,
            startX: event.clientX,
            startY: event.clientY,
            scrollLeft: viewport.scrollLeft,
            scrollTop: viewport.scrollTop,
        };

        viewport.setPointerCapture(event.pointerId);
        setIsDragging(true);
    };

    const handlePointerMove = (event) => {
        const drag = dragRef.current;
        const viewport = viewportRef.current;

        if (!drag.active || !viewport) return;
        if (drag.pointerId !== event.pointerId) return;

        const deltaX = event.clientX - drag.startX;
        const deltaY = event.clientY - drag.startY;

        viewport.scrollLeft = drag.scrollLeft - deltaX;
        viewport.scrollTop = drag.scrollTop - deltaY;
    };

    const stopDragging = (event) => {
        if (
            dragRef.current.pointerId !== event.pointerId
        ) {
            return;
        }

        dragRef.current.active = false;
        dragRef.current.pointerId = null;

        const viewport = viewportRef.current;

        if (viewport?.hasPointerCapture(event.pointerId)) {
            viewport.releasePointerCapture(event.pointerId);
        }

        setIsDragging(false);
    };

    const resetPosition = () => {
        const viewport = viewportRef.current;

        if (!viewport) return;

        viewport.scrollTo({
            top: 0,
            left: 0,
            behavior: "smooth",
        });
    };

    return (
        <section
            ref={viewerRef}
            className={`map-viewer ${
                isFullscreen ? "map-viewer-fullscreen" : ""
            }`}
        >
            {/* BARRA DE HERRAMIENTAS */}

            <div className="map-viewer-toolbar">
                <div className="map-viewer-label">
                    <Move size={16} />
                    <span>Explorador de mapa</span>
                </div>

                <div className="map-viewer-actions">
                    <button
                        type="button"
                        className="map-viewer-button"
                        onClick={resetPosition}
                        title="Restablecer posición"
                        aria-label="Restablecer posición del mapa"
                    >
                        <RotateCcw size={17} />
                    </button>

                    <button
                        type="button"
                        className="map-viewer-button"
                        onClick={toggleFullscreen}
                        title={
                            isFullscreen
                                ? "Salir de pantalla completa"
                                : "Pantalla completa"
                        }
                        aria-label={
                            isFullscreen
                                ? "Salir de pantalla completa"
                                : "Mostrar mapa en pantalla completa"
                        }
                    >
                        {isFullscreen ? (
                            <Minimize2 size={17} />
                        ) : (
                            <Maximize2 size={17} />
                        )}
                    </button>
                </div>
            </div>

            {/* ÁREA DESPLAZABLE */}

            <div
                ref={viewportRef}
                className={`map-viewer-viewport ${
                    isDragging ? "is-dragging" : ""
                }`}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={stopDragging}
                onPointerCancel={stopDragging}
                onLostPointerCapture={() => {
                    dragRef.current.active = false;
                    dragRef.current.pointerId = null;
                    setIsDragging(false);
                }}
            >
                <div className="map-viewer-content">
                    {children}
                </div>
            </div>

            <div className="map-viewer-footer">
                Arrastra el mapa para desplazarte
            </div>
        </section>
    );
}