import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle, CircleAlert } from "lucide-react";
import { supabase } from "../../../lib/supabase";
import "../../../index.css";
import rhizomeLogo from "../../../assets/logo.png";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); setMessage("");
    if (!password || !confirmPassword) return setError("Completa ambos campos.");
    if (password.length < 6) return setError("La contraseña debe tener al menos 6 caracteres.");
    if (password !== confirmPassword) return setError("Las contraseñas no coinciden.");
    try {
      setLoading(true);
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) return setError(updateError.message);
      setMessage("Contraseña actualizada correctamente.");
      setPassword(""); setConfirmPassword("");
      setTimeout(() => navigate("/"), 1200);
    } catch (err) {
      console.error(err);
      setError("No fue posible actualizar la contraseña. Abre nuevamente el enlace de recuperación.");
    } finally { setLoading(false); }
  };

  return (
    <div className="container">
      <div className="left"><div className="overlay">
        <div className="hidden xl:flex w-full logo items-center justify-center"><img src={rhizomeLogo} alt="Rhyzome" className="w-40 h-40 object-contain" /></div>
        <h1>Rhyzome</h1><p>Generación procedural de mapas 2D<br />para videojuegos</p>
      </div></div>
      <div className="right"><div className="form-box">
        <h2>Nueva contraseña</h2><p>Define una nueva contraseña para tu cuenta</p>
        <form onSubmit={handleSubmit}>
          <input type="password" placeholder="Nueva contraseña" value={password} onChange={(e) => setPassword(e.target.value)} />
          <input type="password" placeholder="Confirmar nueva contraseña" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
          {error && <div className="error-message"><CircleAlert size={18}/><span>{error}</span></div>}
          {message && <div className="success-message"><CheckCircle size={18}/><span>{message}</span></div>}
          <button type="submit" disabled={loading}>{loading ? "Actualizando..." : "Actualizar contraseña"}</button>
        </form>
      </div></div>
    </div>
  );
}
