import {apiRequest} from "./api";

// Ruta configurable para adaptarse al prefijo registrado en Flask V2.
export function generateV2Map(payload) {
    const endpoint = import.meta.env.VITE_API_V2_ENDPOINT || "/api/v2/maps/generate-adaptive";
    return apiRequest(endpoint, {method: "POST", body: JSON.stringify(payload)});
}
