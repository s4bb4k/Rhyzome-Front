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
  CircleAlert
} from "lucide-react";

import { supabase } from "../../../lib/supabase";

function Register() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

   const handleRegister = async (e) => {
    e.preventDefault();

    setError("");
    setMessage("");

    // Validar campos
    if (!username || !email || !password || !confirmPassword) {
      setError("Todos los campos son obligatorios.");
      return;
    }

    // Validar contraseñas
    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    // Validar longitud
    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    try {
      setLoading(true);

      // Crear usuario en Supabase Auth
      const { data, error: signUpError } =
        await supabase.auth.signUp({
          email,
          password,
        });

      if (signUpError) {
        setError(signUpError.message);
        return;
      }

      // Crear perfil
      if (data.user) {
        const { error: profileError } = await supabase
          .from("profiles")
          .insert({
            id: data.user.id,
            username: username,
          });

        if (profileError) {
          setError(
            "El usuario fue creado, pero no se pudo guardar el perfil."
          );
          console.error(profileError);
          return;
        }
      }

      setMessage(
        "Cuenta creada correctamente."
      );

      // Limpiar formulario
      setUsername("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");

    } catch (err) {
      console.error(err);
      setError("Ocurrió un error al crear la cuenta.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      {/* Lado izquierdo */}
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

      {/* Lado derecho */}
      <div className="right">
        <div className="form-box">
          <h2>Crea tu cuenta</h2>
          <p>Únete y empieza a generar mapas</p>

          <form onSubmit={handleRegister}>

              <input
                type="text"
                placeholder="Nombre de usuario"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />

              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />

              <input
                type="password"
                placeholder="Contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />

              <input
                type="password"
                placeholder="Confirmar contraseña"
                value={confirmPassword}
                onChange={(e) =>
                  setConfirmPassword(e.target.value)
                }
              />

              {error && (
                <div className="error-message">
                  <CircleAlert size={18} />
                  <span>{error}</span>
                </div>
              )}

              {message && (
                <div className="success-message">
                  <CheckCircle size={18} />
                  <span>{message}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
              >
                {loading ? "Creando cuenta..." : "Crear cuenta"}
              </button>

          </form>

          <p className="login-link">
            ¿Ya tienes cuenta?{" "}
             <span onClick={() => navigate("/")}>
                Inicia sesión
              </span>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Register;