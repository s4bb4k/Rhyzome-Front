# Rhyzome — Frontend 

Rhyzome es una aplicación web académica para generar, visualizar y evaluar escenarios 2D de videojuegos mediante generación procedural y un componente de análisis basado en aprendizaje automático. Esta entrega unifica el frontend alrededor del **generador V2 multiclase**; no incluye el backend.

## Funcionalidades

- Inicio de sesión, registro y recuperación de contraseña mediante Supabase Auth.
- Generación de escenarios de **bosque, desierto, ciudad y mazmorra** con el servicio V2.
- Configuración de dimensiones, semilla y parámetros disponibles en el generador.
- Visualización por capas de terreno, objetos y colisiones, con leyenda y sprites.
- Consulta de métricas, gráfico radar y manual de usuario integrado.
- Exportación de mapas y consulta de mapas guardados en **Mis Mapas**.
- En Mis Mapas, búsqueda manual por nombre, bioma y/o fecha; los resultados se muestran después de presionar **Buscar mapas**.

## Tecnologías

React 19, Vite 8, React Router, Tailwind CSS 4, Lucide React, Sonner y Supabase JS. Las pruebas se ejecutan con Vitest y Testing Library.

## Requisitos

- Node.js compatible con Vite 8 (se recomienda Node.js 22.12 o superior).
- npm.
- Un proyecto Supabase configurado y un backend Rhyzome con el endpoint V2 disponible.

## Instalación y ejecución

```bash
npm ci
cp .env.example .env
npm run dev
```

En Windows, copie `.env.example` como `.env` manualmente o utilice `Copy-Item .env.example .env` en PowerShell. La aplicación se inicia normalmente en `http://localhost:5173`.

Configure en `.env` los valores correspondientes a su entorno:

```dotenv
VITE_API_BASE_URL=http://localhost:5000
VITE_API_V2_ENDPOINT=/api/v2/maps/generate-adaptive
VITE_SUPABASE_URL=https://TU_PROYECTO.supabase.co
VITE_SUPABASE_ANON_KEY=TU_CLAVE_PUBLICA
```

La ruta V2 es configurable; verifique que coincida con el backend desplegado. **No publique secretos** ni agregue `.env` al repositorio. La clave anónima de Supabase se utiliza en el cliente y debe acompañarse de políticas de seguridad adecuadas.

## Comandos

| Comando | Función |
| --- | --- |
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Compilación de producción |
| `npm run preview` | Vista previa del build |
| `npm run lint` | Revisión estática |
| `npm run test:run` | Pruebas automatizadas |
| `npm run test:coverage` | Pruebas con cobertura |
| `npm run test:report` | Reporte de pruebas |

## Estructura principal

```text
src/
  features/auth/          Autenticación y rutas protegidas
  features/dashboard/     Generador, visualización y manual
  features/maps/          Mis Mapas, filtros y galería
  components/             Visor V2, leyenda, métricas y componentes reutilizables
  components/css/         Estilos compartidos del generador
  services/               API HTTP y almacenamiento de mapas
  lib/                    Cliente Supabase
  utils/                  Utilidades y sprites
  assets/                 Recursos gráficos
 tests/                   Pruebas automatizadas conservadas
 .github/workflows/       Integración continua
```

## Uso básico

1. Inicie sesión y abra el **Generador**.
2. Seleccione el bioma y configure los parámetros de generación.
3. Pulse **Generar mapa** y revise la vista previa, la leyenda y las métricas.
4. Guarde o exporte el resultado según las opciones disponibles.
5. En **Mis Mapas**, seleccione filtros opcionales y pulse **Buscar mapas** para consultar los guardados.

## Integración con backend

El frontend llama al endpoint indicado por `VITE_API_V2_ENDPOINT` a través de `src/services/mapsApi.js`. La representación multiclase requiere que el backend entregue las capas y métricas esperadas por los componentes V2. El frontend por sí solo no genera mapas sin ese servicio.

## Consolidación de esta entrega

Se tomó como base la variante **Rhyzome_Front_Solo_V2** y se incorporaron del otro ZIP las configuraciones de desarrollo, las pruebas compatibles, recursos públicos y el workflow de CI. Se excluyeron `.git`, `.idea`, `node_modules`, archivos `.env` y componentes clásicos V1. Algunas pruebas heredadas específicas de V1 fueron retiradas por no corresponder al contrato V2; **la suite V2 requiere validación integral**.

## Estado de validación

El empaquetado y la revisión estática de archivos no sustituyen la ejecución real de la aplicación. Antes de publicar, ejecute `npm ci`, `npm run build`, `npm run lint` y `npm run test:run`, y valide generación V2, autenticación, guardado, recuperación, métricas y exportaciones con el backend correspondiente.

## Licencia y créditos

Proyecto académico Rhyzome. Consulte las licencias de las dependencias y de los recursos gráficos utilizados antes de redistribuirlos. No se incluye una licencia general del proyecto en esta entrega.
