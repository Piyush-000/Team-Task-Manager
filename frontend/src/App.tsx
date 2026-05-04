import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { Link, Navigate, Route, Routes, useNavigate } from "react-router-dom";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import Projects from "./pages/Projects";
import Tasks from "./pages/Tasks";

type PrivateRouteProps = {
  token: string | null;
  children: ReactNode;
};

const PrivateRoute = ({ token, children }: PrivateRouteProps) => {
  return token ? <>{children}</> : <Navigate to="/login" replace />;
};

function App() {
  const [token, setToken] = useState<string | null>(localStorage.getItem("ttm_token"));
  const [userName, setUserName] = useState<string | null>(localStorage.getItem("ttm_user_name"));
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) {
      localStorage.removeItem("ttm_token");
      localStorage.removeItem("ttm_user_name");
    }
  }, [token]);

  const handleAuth = (tokenValue: string, name?: string) => {
    localStorage.setItem("ttm_token", tokenValue);
    if (name) localStorage.setItem("ttm_user_name", name);
    setToken(tokenValue);
    setUserName(name || null);
    navigate("/dashboard");
  };

  const logout = () => {
    setToken(null);
    setUserName(null);
    navigate("/login");
  };

  return (
    <div className="app-shell">
      <header className="topbar">
        <h1>Team Task Manager</h1>
        {token ? (
          <div className="user-bar">
            <nav className="nav-links">
              <Link to="/dashboard">Dashboard</Link>
              <Link to="/projects">Projects</Link>
              <Link to="/tasks">Tasks</Link>
            </nav>
            <span>{userName || "Member"}</span>
            <button onClick={logout}>Logout</button>
          </div>
        ) : null}
      </header>

      <main className="content">
        <Routes>
          <Route path="/" element={<Navigate to={token ? "/dashboard" : "/login"} replace />} />
          <Route path="/login" element={<Login onAuth={handleAuth} />} />
          <Route path="/signup" element={<Signup onAuth={handleAuth} />} />
          <Route path="/dashboard" element={<PrivateRoute token={token}><Dashboard /></PrivateRoute>} />
          <Route path="/projects" element={<PrivateRoute token={token}><Projects /></PrivateRoute>} />
          <Route path="/tasks" element={<PrivateRoute token={token}><Tasks /></PrivateRoute>} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
