
import {
    createContext,
    useContext,
    useEffect,
    useState,
} from "react";

import { supabase } from "../../../lib/supabase";

const AuthContext = createContext(null);

// Activar únicamente para probar la renovación manual
const TEST_REFRESH = false;

export function AuthProvider({ children }) {
    const [session, setSession] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let active = true;
        let validating = false;
        let refreshTestExecuted = false;

        // Prueba temporal de renovación del token
        async function testRefresh() {
            if (!TEST_REFRESH || refreshTestExecuted) return;

            refreshTestExecuted = true;

            try {
                const { data, error } =
                    await supabase.auth.refreshSession();

                if (!active) return;

                if (error) {
                    console.error(
                        "Error renovando sesión:",
                        error.message
                    );
                    return;
                }

                console.log("Token renovado correctamente");
                console.log(
                    "Nueva expiración:",
                    data.session?.expires_at
                );

                if (data.session) {
                    setSession(data.session);
                }
            } catch (error) {
                console.error(
                    "Error en prueba de renovación:",
                    error
                );
            }
        }

        // Validar la sesión actual
        async function validateSession() {
            if (validating) return;

            validating = true;

            try {
                const { data, error } =
                    await supabase.auth.getUser();

                if (!active) return;

                if (error || !data.user) {
                    setSession(null);
                    return;
                }

                const { data: sessionData, error: sessionError } =
                    await supabase.auth.getSession();

                if (!active) return;

                if (sessionError || !sessionData.session) {
                    setSession(null);
                    return;
                }

                setSession(sessionData.session);

                const expiresAt = sessionData.session.expires_at;
                const now = Math.floor(Date.now() / 1000);

                const remainingSeconds = expiresAt - now;
                const remainingMinutes = remainingSeconds / 60;

                console.log("========== SESIÓN RHYZOME ==========");
                console.log("Usuario autenticado:", data.user.email);
                console.log(
                    "Fecha de expiración:",
                    new Date(expiresAt * 1000).toLocaleString()
                );
                console.log(
                    "Minutos restantes:",
                    remainingMinutes.toFixed(2)
                );
                console.log("====================================");

                // Ejecutar prueba manual una sola vez
                if (TEST_REFRESH) {
                    await testRefresh();
                }
            } catch (error) {
                console.error(
                    "Error validando sesión:",
                    error
                );

                if (active) {
                    setSession(null);
                }
            } finally {
                validating = false;

                if (active) {
                    setLoading(false);
                }
            }
        }

        // Escuchar cambios de autenticación
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange(
            (event, currentSession) => {
                if (!active) return;

                console.log("Evento de autenticación:", event);

                if (event === "SIGNED_OUT") {
                    setSession(null);
                    setLoading(false);
                }

                if (
                    event === "SIGNED_IN" ||
                    event === "TOKEN_REFRESHED"
                ) {
                    setSession(currentSession);
                    setLoading(false);

                    if (event === "TOKEN_REFRESHED") {
                        console.log("Supabase renovó el token");
                        console.log(
                            "Expiración:",
                            currentSession?.expires_at
                        );
                    }
                }
            }
        );

        // Validación inicial
        validateSession();

        // Validar al regresar a la pestaña
        function handleFocus() {
            validateSession();
        }

        window.addEventListener("focus", handleFocus);

        return () => {
            active = false;
            subscription.unsubscribe();

            window.removeEventListener(
                "focus",
                handleFocus
            );
        };
    }, []);

    return (
        <AuthContext.Provider value={{ session, loading }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);

    if (!context) {
        throw new Error(
            "useAuth debe utilizarse dentro de AuthProvider"
        );
    }

    return context;
}
