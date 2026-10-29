
import {
    AlertTriangle,
    WifiOff,
    Clock3,
    ShieldAlert,
    Settings2,
    RefreshCw,
} from "lucide-react";

import "./css/GenerationError.css";

/* ==========================================
   RHYZOME - TIPOS DE ERROR
   ========================================== */

const ERROR_CONFIG = {
    connection: {
        icon: WifiOff,
        title: "No se pudo conectar con el servidor",
        description:
            "No fue posible establecer comunicación con el servidor de Rhyzome. Comprueba tu conexión a Internet e inténtalo nuevamente.",
    },

    timeout: {
        icon: Clock3,
        title: "La generación está tardando demasiado",
        description:
            "El servidor está tardando más de lo esperado en responder. Espera unos segundos e intenta nuevamente.",
    },

    validation: {
        icon: Settings2,
        title: "Parámetros de generación inválidos",
        description:
            "Algunos parámetros no son válidos. Revisa las dimensiones, el algoritmo y las opciones seleccionadas.",
    },

    authentication: {
        icon: ShieldAlert,
        title: "Problema de autenticación",
        description:
            "No fue posible verificar tu sesión. Inicia sesión nuevamente si el problema continúa.",
    },

    server: {
        icon: AlertTriangle,
        title: "El servidor presentó un problema",
        description:
            "El servidor no pudo completar la generación del mapa. Puedes intentar nuevamente en unos momentos.",
    },

    unknown: {
        icon: AlertTriangle,
        title: "No fue posible generar el mapa",
        description:
            "Ocurrió un problema inesperado durante la generación. Intenta nuevamente.",
    },
};

/* ==========================================
   COMPONENTE PRINCIPAL
   ========================================== */

export default function GenerationError({
                                            type = "unknown",
                                            message,
                                            onRetry,
                                            retrying = false,
                                        }) {
    const config = ERROR_CONFIG[type] ?? ERROR_CONFIG.unknown;
    const Icon = config.icon;

    return (
        <section
            className="generation-error"
            role="alert"
            aria-live="assertive"
        >
            <div className="generation-error-icon">
                <Icon size={32} strokeWidth={1.7} />
            </div>

            <h2 className="generation-error-title">
                {config.title}
            </h2>

            <p className="generation-error-description">
                {config.description}
            </p>

            {message && (
                <p className="generation-error-detail">
                    {message}
                </p>
            )}

            {typeof onRetry === "function" && (
                <button
                    type="button"
                    className="generation-error-retry"
                    onClick={onRetry}
                    disabled={retrying}
                >
                    <RefreshCw
                        size={17}
                        className={
                            retrying
                                ? "generation-error-spinner"
                                : ""
                        }
                    />

                    <span>
                        {retrying
                            ? "Reintentando..."
                            : "Reintentar generación"}
                    </span>
                </button>
            )}
        </section>
    );
}