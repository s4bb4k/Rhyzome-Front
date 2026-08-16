import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "./features/auth/pages/Login";
import Register from "./features/auth/pages/Register";
import Dashboard from "./features/dashboard/pages/Dashboard";
import MyMaps from "./features/maps/pages/MyMaps";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/maps" element={<MyMaps />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;