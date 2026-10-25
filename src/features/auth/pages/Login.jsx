import { useState } from "react";
import { useNavigate } from "react-router-dom";

import "../../../index.css";
import rhizomeLogo from "../../../assets/logo.png";

import {
  Trees,
  Sun,
  Building2,
  Skull,
  CheckCircle,
  CircleAlert,
} from "lucide-react";

import { supabase } from "../../../lib/supabase";

export default function Login() {

  const navigate = useNavigate();  

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();

    setError("");
    setMessage("");

    // Validar campos
    if (!email || !password) {
      setError("Ingresa tu correo electrónico y contraseña.");
      return;
    }

    try {
      setLoading(true);

      const { data, error: loginError } =
        await supabase.auth.signInWithPassword({
          email,
          password,
        });

      if (loginError) {
        console.error(loginError);

        setError(
          "Correo electrónico o contraseña incorrectos."
        );

        return;
      }

      if (data.user) {
        setMessage("Inicio de sesión exitoso.");

        // Esperamos un momento para mostrar el mensaje
        setTimeout(() => {
          navigate("/dashboard");
        }, 500);
      }

    } catch (err) {
      console.error(err);

      setError(
        "Ocurrió un error al iniciar sesión."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      {/* =========================
          LADO IZQUIERDO
      ========================== */}
      <div className="left">
        <div className="overlay">
          <div className="hidden xl:flex w-full logo items-center justify-center">
            <img
              src={rhizomeLogo}
              alt="Rhizome - Generador Procedural de Mapas"
              className="w-40 h-40 object-contain"
            />
          </div>

          <h1>Rhyzome</h1>
          <p>
            Generación procedural de mapas 2D
            <br />
            para videojuegos
          </p>
          <div className="tags">
            <span><Trees size={14} /> Bosque</span>
            <span><Sun size={14} />   Desierto</span>
            <span><Building2 size={14} /> Urbano</span>
            <span><Skull size={14} />Mazmorra</span>
          </div>
        </div>
      </div>

      {/* =========================
          LADO DERECHO
      ========================== */}
      <div className="right">
        <div className="form-box">

          <h2>Iniciar sesión</h2>
          <p>Bienvenido de vuelta a Rhyzome</p>

            <form onSubmit={handleLogin}>
              <input
                type="email"
                placeholder="Correo electrónico"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />

              <input
                type="password"
                placeholder="Contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />  

              {/* ERROR */}

              {error && (
                <div className="error-message">

                  <CircleAlert size={18} />

                  <span>
                    {error}
                  </span>

                </div>
              )}


              {/* SUCCESS */}

              {message && (
                <div className="success-message">

                  <CheckCircle size={18} />

                  <span>
                    {message}
                  </span>

                </div>
              )}

              {/* LOGIN */}

              <div className="login-link" style={{ textAlign: "right", marginBottom: "12px" }}>
                <span onClick={() => navigate("/forgot-password")}>
                  ¿Olvidaste tu contraseña?
                </span>
              </div>

              <button
                type="submit"
                disabled={loading}
              >
                {loading
                  ? "Iniciando sesión..."
                  : "Iniciar sesión"}
              </button>
            </form>
            

          <div className="login-link">
            ¿No tienes cuenta?{" "}
            <span onClick={() => navigate("/register")}>
                Regístrate
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}