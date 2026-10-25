import {supabase} from "../lib/supabase";


/* =========================================================
   FUNCIONES AUXILIARES
   ========================================================= */

/**
 * Obtiene la matriz independientemente de cómo venga
 * estructurada la respuesta del backend.
 */
export function getMapMatrix(generatedMap) {
    return (
        generatedMap?.matrix ??
        generatedMap?.map ??
        generatedMap?.map_data?.matrix ??
        generatedMap?.data?.matrix ??
        generatedMap?.result?.matrix ??
        null
    );
}


/**
 * Obtiene las métricas devueltas por el backend.
 */
export function getMapMetrics(generatedMap) {
    return (
        generatedMap?.metrics ??
        generatedMap?.evaluation ??
        generatedMap?.statistics ??
        generatedMap?.stats ??
        generatedMap?.map_metrics ??
        generatedMap?.result?.metrics ??
        null
    );
}


/**
 * Convierte la complejidad utilizada por la interfaz
 * al formato almacenado en Supabase.
 */
function normalizeComplexity(complexity) {
    const complexityMap = {
        Bajo: "low",
        Medio: "medium",
        Alto: "high",

        low: "low",
        medium: "medium",
        high: "high",
    };

    return complexityMap[complexity] ?? "medium";
}


/* =========================================================
   GUARDAR MAPA
   ========================================================= */

/**
 * Guarda un mapa generado en Supabase.
 */
export async function saveMap({
                                  mapType,
                                  algorithm,
                                  width,
                                  height,
                                  seed,
                                  complexity,
                                  tileSize,
                                  generatedMap,
                              }) {

    if (!generatedMap) {
        throw new Error(
            "Primero debes generar un mapa."
        );
    }


    /* -----------------------------------------------------
       Obtener usuario autenticado
       ----------------------------------------------------- */

    const {
        data: {user},
        error: userError,
    } = await supabase.auth.getUser();


    if (userError) {
        throw userError;
    }


    if (!user) {
        throw new Error(
            "No existe una sesión activa."
        );
    }


    /* -----------------------------------------------------
       Obtener matriz y métricas
       ----------------------------------------------------- */

    const matrix =
        getMapMatrix(generatedMap);

    const metrics =
        getMapMetrics(generatedMap);


    if (!matrix) {
        throw new Error(
            "No se encontró la matriz del mapa generado."
        );
    }


    /* -----------------------------------------------------
       Registro que se enviará a Supabase
       ----------------------------------------------------- */

    const record = {

        user_id: user.id,

        name: `${mapType} - ${seed}`,

        map_type:
            String(mapType).toLowerCase(),

        algorithm:
            String(algorithm).toLowerCase(),

        width:
            Number(width),

        height:
            Number(height),

        seed:
            Number(seed),

        complexity:
            normalizeComplexity(complexity),

        tile_size:
            Number(tileSize),

        matrix,

        metrics,

        /*
         * Conservamos la respuesta completa del backend.
         * Esto permite mantener evidencia de cómo fue
         * generado el mapa.
         */
        generation_data:
        generatedMap,

        generator_version:
            "1.0",
    };


    /* -----------------------------------------------------
       Insertar en Supabase
       ----------------------------------------------------- */

    const {
        data,
        error,
    } = await supabase
        .from("maps")
        .insert(record)
        .select()
        .single();


    if (error) {
        throw error;
    }


    return data;
}


/* =========================================================
   CONSULTAR MIS MAPAS
   ========================================================= */

/**
 * Obtiene todos los mapas pertenecientes al usuario.
 *
 * Gracias a RLS, Supabase únicamente devuelve
 * los registros cuyo user_id corresponde al usuario
 * autenticado.
 */
export async function getMyMaps() {

    const {
        data: {user},
        error: userError,
    } = await supabase.auth.getUser();


    if (userError) {
        throw userError;
    }


    if (!user) {
        throw new Error(
            "No existe una sesión activa."
        );
    }


    const {
        data,
        error,
    } = await supabase
        .from("maps")
        .select("*")
        .order(
            "created_at",
            {
                ascending: false,
            }
        );


    if (error) {
        throw error;
    }


    return data ?? [];
}


/* =========================================================
   CONSULTAR MAPA POR ID
   ========================================================= */

/**
 * Obtiene un mapa específico.
 */
export async function getMapById(id) {

    if (!id) {
        throw new Error(
            "El ID del mapa es obligatorio."
        );
    }


    const {
        data,
        error,
    } = await supabase
        .from("maps")
        .select("*")
        .eq("id", id)
        .single();


    if (error) {
        throw error;
    }


    return data;
}


/* =========================================================
   ELIMINAR MAPA
   ========================================================= */

/**
 * Elimina un mapa.
 *
 * RLS evita que un usuario pueda eliminar
 * mapas pertenecientes a otro usuario.
 */
export async function deleteMap(id) {

    if (!id) {
        throw new Error(
            "El ID del mapa es obligatorio."
        );
    }


    const {
        error,
    } = await supabase
        .from("maps")
        .delete()
        .eq("id", id);


    if (error) {
        throw error;
    }


    return true;
}


/* =========================================================
   ACTUALIZAR NOMBRE
   ========================================================= */

/**
 * Permite cambiar el nombre de un mapa guardado.
 *
 * Esto nos servirá posteriormente desde Mis Mapas.
 */
export async function updateMapName(
    id,
    newName
) {

    if (!id) {
        throw new Error(
            "El ID del mapa es obligatorio."
        );
    }


    if (!newName?.trim()) {
        throw new Error(
            "El nombre del mapa no puede estar vacío."
        );
    }


    const {
        data,
        error,
    } = await supabase
        .from("maps")
        .update({
            name: newName.trim(),
        })
        .eq("id", id)
        .select()
        .single();


    if (error) {
        throw error;
    }


    return data;
}