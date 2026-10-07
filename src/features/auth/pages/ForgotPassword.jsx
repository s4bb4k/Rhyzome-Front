import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle, CircleAlert } from "lucide-react";
import { supabase } from "../../../lib/supabase";
import "../../../index.css";
import rhizomeLogo from "../../../assets/logo.png";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    if (!email.trim()) return setError("Ingresa tu correo electrónico.");
    try {
      setLoading(true);
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (resetError) return setError(resetError.message);
      setMessage("Te enviamos un enlace para restablecer tu contraseña. Revisa tu correo.");
    } catch (err) {
      console.error(err);
      setError("No fue posible enviar el correo de recuperación.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="left"><div className="overlay">
        <div className="hidden xl:flex w-full logo items-center justify-center"><img src={rhizomeLogo} alt="Rhyzome" className="w-40 h-40 object-contain" /></div>
        <h1>Rhyzome</h1><p>Generación procedural de mapas 2D<br />para videojuegos</p>
      </div></div>
      <div className="right"><div className="form-box">
        <h2>Recuperar contraseña</h2><p>Ingresa el correo asociado a tu cuenta</p>
        <form onSubmit={handleSubmit}>
          <input type="email" placeholder="Correo electrónico" value={email} onChange={(e) => setEmail(e.target.value)} />
          {error && <div className="error-message"><CircleAlert size={18}/><span>{error}</span></div>}
          {message && <div className="success-message"><CheckCircle size={18}/><span>{message}</span></div>}
          <button type="submit" disabled={loading}>{loading ? "Enviando..." : "Enviar enlace de recuperación"}</button>
        </form>
        <p className="login-link"><span onClick={() => navigate("/")}>Volver a iniciar sesión</span></p>
      </div></div>
    </div>
  );
}
