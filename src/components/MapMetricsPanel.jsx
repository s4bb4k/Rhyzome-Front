import {
    Activity,
    BarChart3,
    Boxes,
    CircleGauge,
    Footprints,
    Layers3,
    Mountain,
    Network,
    ScanLine,
    ShieldCheck,
    Waves,
    Clock3,
    BrainCircuit
} from 'lucide-react';

function valueOf(metrics, ...keys) {
    for (const key of keys) {
        const v = metrics?.[key];
        if (v !== null && v !== undefined && v !== '' && Number.isFinite(Number(v))) return Number(v)
    }
    return null
}

function format(v, percent = false) {
    if (v === null) return '—';
    return percent ? `${(v >= 0 && v <= 1 ? v * 100 : v).toFixed(1)}%` : Number(v).toLocaleString('es-CO', {maximumFractionDigits: 3})
}

// The radar is a descriptive profile, not a single quality score.
// Ratios are normalized only when their scale is known; missing values remain missing.
function ratio(v) {
    return v === null || !Number.isFinite(v) ? null : Math.max(0, Math.min(1, v))
}

function Radar({values}) {
    const valid = values.filter(v => v.value !== null);
    if (valid.length < 3) return <p className="rh-muted">No hay suficientes indicadores para construir el perfil del
        mapa.</p>;
    const cx = 210, cy = 176, radius = 116, n = values.length;
    const coords = (i, r) => {
        const a = -Math.PI / 2 + i * 2 * Math.PI / n;
        return [cx + Math.cos(a) * r, cy + Math.sin(a) * r]
    };
    const point = (i, r) => coords(i, r).map(v => v.toFixed(1)).join(',');
    const segments = [];
    // Do not replace unavailable metrics with zero or draw a polygon through them.
    for (let i = 0; i < n; i++) if (values[i].value !== null && values[(i + 1) % n].value !== null) {
        segments.push([point(i, radius * values[i].value), point((i + 1) % n, radius * values[(i + 1) % n].value)])
    }
    const complete = valid.length === n;
    return <div className="rh-radar-wrap">
        <svg className="rh-radar" viewBox="0 0 420 365" role="img"
             aria-label="Perfil descriptivo del mapa. Los ejes muestran indicadores normalizados entre cero y uno.">
            {[.25, .5, .75, 1].map(r => <polygon key={r} points={values.map((_, i) => point(i, radius * r)).join(' ')}
                                                 fill="none" stroke="#375168" strokeWidth="1"/>)}
            {values.map((_, i) => {
                const [x, y] = coords(i, radius);
                return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="#375168"/>
            })}
            {complete && <polygon points={values.map((v, i) => point(i, radius * v.value)).join(' ')} fill="#14e0ad"
                                  fillOpacity=".20" stroke="none"/>}
            {segments.map((pair, i) => <polyline key={i} points={pair.join(' ')} fill="none" stroke="#14e0ad"
                                                 strokeWidth="2.5" strokeLinejoin="round"/>)}
            {values.map((v, i) => {
                const [x, y] = coords(i, radius * (v.value ?? 0));
                const [lx, ly] = coords(i, radius + 31);
                return <g key={v.label}>
                    <title>{`${v.label}: ${v.raw === null ? 'No disponible' : v.display}. ${v.description}`}</title>{v.value !== null &&
                    <circle cx={x} cy={y} r="4" fill="#24e8b5" stroke="#092b27" strokeWidth="1.5"/>}
                    <text x={lx} y={ly} textAnchor="middle" dominantBaseline="middle"
                          fill={v.value === null ? '#8395a6' : '#d5e8f2'} fontSize="11"
                          fontWeight="500">{v.label}</text>
                </g>
            })}
        </svg>
    </div>
}

function deriveLayerMetrics(response) {
    const layers = response?.layers ?? response?.map?.layers ?? {};
    const terrain = layers.terrain, collision = layers.collision;
    if (!Array.isArray(terrain) || !terrain.length || !Array.isArray(terrain[0])) return {};
    const cells = terrain.flat(), total = cells.length;
    const countEntropy = arr => {
        const counts = new Map();
        arr.forEach(v => counts.set(v, (counts.get(v) || 0) + 1));
        return [...counts.values()].reduce((sum, n) => {
            const p = n / arr.length;
            return sum - p * Math.log2(p)
        }, 0)
    };
    const result = {
        row_entropy: terrain.reduce((a, row) => a + countEntropy(row), 0) / terrain.length,
        col_entropy: terrain[0].reduce((a, _, x) => a + countEntropy(terrain.map(row => row[x])), 0) / terrain[0].length
    };
    if (Array.isArray(collision) && collision.length === terrain.length && collision.every(row => Array.isArray(row) && row.length === terrain[0].length)) {
        const blocked = collision.flat().filter(v => Number(v) !== 0).length;
        result.obstacle_density = blocked / total;
        result.accessibility = 1 - result.obstacle_density;
    }
    return result;
}

export default function MapMetricsPanel({response, terrainType, version}) {
    if (!response) return <section className="rh-metrics-empty">Genera o selecciona un mapa del historial para consultar
        sus métricas.</section>;
    const m = response.metrics ?? response.evaluation ?? response.statistics ?? response.stats ?? response.map_metrics ?? response.result?.metrics ?? {};
    const derived = deriveLayerMetrics(response);
    const ml = response.ml ?? response.result?.ml ?? {};
    const items = [
        ['Accesibilidad', valueOf(m, 'transitabilidad', 'accessibility', 'floor_ratio', 'accessibility_score') ?? derived.accessibility, true, Footprints],
        ['Densidad de obstáculos', valueOf(m, 'obstacle_density') ?? derived.obstacle_density, true, Mountain],
        ['Conectividad', valueOf(m, 'connectivity'), true, Network],
        ['Mayor región conectada', valueOf(m, 'mayor_region_ratio', 'largest_region_ratio'), true, Layers3],
        ['Regiones conectadas', valueOf(m, 'regiones', 'connected_components', 'n_regions'), false, Boxes],
        ['Densidad de bordes', valueOf(m, 'edge_density'), true, Activity],
        ['Entropía (filas)', valueOf(m, 'row_entropy') ?? derived.row_entropy, false, BarChart3],
        ['Entropía (columnas)', valueOf(m, 'col_entropy') ?? derived.col_entropy, false, BarChart3],
        ['Densidad de objetos', valueOf(m, 'densidad_objetos', 'object_density'), true, ScanLine],
        ['Tipos de terreno', valueOf(m, 'tipos_terreno'), false, Layers3],
        ['Tipos de objetos', valueOf(m, 'tipos_objetos'), false, Boxes],
        ['Solapamientos inválidos', valueOf(m, 'solapamientos_invalidos'), false, ShieldCheck],
        ['Variación local', valueOf(m, 'local_variance'), true, Waves],
        ['Relación perímetro/área', valueOf(m, 'perimeter_area_ratio'), false, CircleGauge]
    ];
    const prediction = ml.predicted_complexity ?? response.predicted_complexity;
    const confidence = valueOf(ml, 'confidence') ?? valueOf(response, 'confidence');
    const probabilities = ml.class_probabilities ?? response.class_probabilities;
    const accessibility = items[0][1], connectivity = items[2][1], obstacles = items[1][1], edges = items[5][1];
    const largestOpen = valueOf(m, 'largest_open_area') ?? (accessibility !== null && items[3][1] !== null ? accessibility * items[3][1] : null);
    const balance = valueOf(m, 'balance') ?? (accessibility !== null ? Math.max(0, 1 - Math.abs(accessibility - .65)) : null);
    const radar = [
        {label: 'Accesibilidad', raw: accessibility, description: 'Proporción transitable del escenario.'},
        {label: 'Conectividad', raw: connectivity, description: 'Proporción de área transitable conectada.'},
        {
            label: 'Área abierta',
            raw: largestOpen,
            description: 'Proporción estimada de la mayor área abierta respecto al mapa.'
        },
        {
            label: 'Balance',
            raw: balance,
            description: 'Índice de balance disponible en el backend o estimado a partir de la accesibilidad.'
        },
        {
            label: 'Bordes',
            raw: edges,
            description: 'Densidad de transiciones entre terrenos; no implica mejor calidad.'
        },
        {label: 'Obstáculos', raw: obstacles, description: 'Fracción de celdas bloqueadas; no implica mejor calidad.'}
    ].map(v => ({...v, value: ratio(v.raw), display: v.raw === null ? '—' : `${(v.raw * 100).toFixed(1)}%`}));
    const algorithm = response.algorithm ?? response.model_generator ?? ml.model_generator;
    const elapsed = response.adaptive?.elapsed_ms ?? response.elapsed_ms;
    return <div className="rh-metrics-layout rh-metrics-redesign">
        <section className="rh-metrics-card rh-results"><h3><BarChart3 size={19}/> Resultados de evaluación</h3>
            <div className="rh-metrics-grid">{items.map(([label, val, pct, Icon]) => <div className="rh-metric"
                                                                                          key={label}><Icon size={22}
                                                                                                            aria-hidden="true"/><span>{label}</span><strong
                className={val === null ? 'rh-not-available' : ''}>{format(val, pct)}</strong></div>)}</div>
            <small className="rh-muted">Las métricas de conectividad, bordes, variación local y perímetro/área son
                calculadas en el backend V2 actualizado. Los indicadores ausentes se muestran como —. Accesibilidad,
                obstáculos y entropías pueden calcularse a partir de las capas V2 cuando el backend no los
                envía.</small></section>
        <div className="rh-metrics-lower">
            <section className="rh-metrics-card rh-profile"><h3><Layers3 size={19}/> Perfil del mapa</h3><Radar
                values={radar}/></section>
            <section className="rh-metrics-card rh-summary"><h3><BrainCircuit size={19}/> Resumen</h3>
                <div className="rh-summary-row">
                    <span>Complejidad (ML)</span><strong>{prediction ?? 'No disponible'}</strong></div>
                <div className="rh-summary-row"><span>Confianza</span><strong>{format(confidence, true)}</strong></div>
                <div className="rh-summary-row">
                    <span>Algoritmo utilizado</span><strong>{algorithm ?? 'No informado'}</strong></div>
                <div className="rh-summary-row"><span><Clock3
                    size={14}/> Tiempo de generación</span><strong>{elapsed != null ? `${format(Number(elapsed))} ms` : 'No informado'}</strong>
                </div>
                <div className="rh-summary-row">
                    <span>Semilla</span><strong>{response.seed ?? response.parameters?.seed ?? 'No informada'}</strong>
                </div>
                {probabilities &&
                    <div className="rh-probabilities">{Object.entries(probabilities).map(([key, val]) => <div key={key}>
                        <span>{key}</span>
                        <div className="rh-prob-track">
                            <div style={{width: `${Math.max(0, Math.min(100, Number(val) * 100))}%`}}/>
                        </div>
                        <strong>{format(Number(val), true)}</strong></div>)}</div>}</section>
        </div>
    </div>;
}
