import {
    CheckCircle2,
    AlertCircle,
} from "lucide-react";

import "./css/GenerationStatus.css";

export default function GenerationStatus({
                                             hasMap = false,
                                             hasChanges = false,
                                         }) {

    // No mostrar nada si todavía no existe un mapa
    if (!hasMap) {
        return null;
    }

    return (
        <div
            className={`generation-status ${
                hasChanges
                    ? "generation-status-pending"
                    : "generation-status-success"
            }`}
            role="status"
            aria-live="polite"
        >

            <div className="generation-status-icon">

                {hasChanges ? (
                    <AlertCircle size={19}/>
                ) : (
                    <CheckCircle2 size={19}/>
                )}

            </div>

            <div className="generation-status-content">

                <strong>
                    {hasChanges
                        ? "Tienes cambios pendientes"
                        : "Configuración aplicada"}
                </strong>

                <p>
                    {hasChanges
                        ? "Has modificado los parámetros de generación. Genera nuevamente el mapa para aplicar los cambios."
                        : "El mapa mostrado corresponde a los parámetros de generación seleccionados."}
                </p>

            </div>

        </div>
    );
}