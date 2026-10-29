import { useEffect, useRef } from "react";
import { AlertTriangle, X } from "lucide-react";

import "./css/UnsavedMapDialog.css";

export default function UnsavedMapDialog({
                                             open = false,
                                             onCancel,
                                             onConfirm,
                                         }) {
    const cancelButtonRef = useRef(null);

    useEffect(() => {
        if (!open) return undefined;

        cancelButtonRef.current?.focus();

        const handleKeyDown = (event) => {
            if (event.key === "Escape") {
                onCancel?.();
            }
        };

        document.addEventListener("keydown", handleKeyDown);

        return () => {
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [open, onCancel]);

    if (!open) return null;

    return (
        <div
            className="unsaved-map-overlay"
            onMouseDown={(event) => {
                if (event.target === event.currentTarget) {
                    onCancel?.();
                }
            }}
        >
            <section
                className="unsaved-map-dialog"
                role="alertdialog"
                aria-modal="true"
                aria-labelledby="unsaved-map-title"
                aria-describedby="unsaved-map-description"
            >
                <button
                    type="button"
                    className="unsaved-map-close"
                    onClick={onCancel}
                    aria-label="Cerrar"
                >
                    <X size={18} />
                </button>

                <div className="unsaved-map-icon">
                    <AlertTriangle size={30} strokeWidth={1.8} />
                </div>

                <h2 id="unsaved-map-title">
                    ¿Generar un nuevo mapa?
                </h2>

                <p id="unsaved-map-description">
                    El mapa actual todavía no está guardado.
                    Si continúas, será reemplazado por el nuevo mapa generado.
                </p>

                <div className="unsaved-map-actions">
                    <button
                        ref={cancelButtonRef}
                        type="button"
                        className="unsaved-map-cancel"
                        onClick={onCancel}
                    >
                        Cancelar
                    </button>

                    <button
                        type="button"
                        className="unsaved-map-confirm"
                        onClick={onConfirm}
                    >
                        Generar nuevo mapa
                    </button>
                </div>
            </section>
        </div>
    );
}