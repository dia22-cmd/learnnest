import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import LandingPage from "./pages/LandingPage";
import RegisterPage from "./pages/RegisterPage";
import LoginPage from "./pages/LoginPage";
import WelcomePage from "./pages/WelcomePage";
import MaterialDetailPage from "./pages/MaterialDetailPage";
import ChildSolvePage from "./pages/ChildSolvePage";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/welcome" element={<ProtectedRoute><WelcomePage /></ProtectedRoute>} />
          <Route path="/material/:materialId" element={<ProtectedRoute><MaterialDetailPage /></ProtectedRoute>} />
          <Route path="/solve/:materialId" element={<ChildSolvePage />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

