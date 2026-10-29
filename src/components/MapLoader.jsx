import "./css/MapLoader.css";

export default function MapLoader() {
    return (
        <div className="rhyzome-loader" role="status" aria-live="polite">
            <div className="rhyzome-loader-content">
                <div className="rhyzome-loader-animation">
                    <div className="rhyzome-loader-ring" />
                    <div className="rhyzome-loader-core">
                        <span>R</span>
                    </div>
                </div>

                <h2>Generando tu mapa</h2>

                <p>
                    Estamos creando y evaluando el terreno
                </p>

                <div className="rhyzome-loader-dots" aria-hidden="true">
                    <span />
                    <span />
                    <span />
                </div>

                <div className="rhyzome-loader-info">
                    Esto puede tardar unos segundos
                </div>
            </div>
        </div>
    );
}