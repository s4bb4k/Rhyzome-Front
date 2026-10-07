import { apiRequest } from "./api";

export function generateAdaptiveMap(payload) {
  return apiRequest("/api/maps/generate-adaptive", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
