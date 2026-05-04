import { useState } from "react";
import { Link } from "react-router-dom";
import { auth } from "../api";

interface LoginProps {
  onAuth: (token: string, name?: string) => void;
}

const Login = ({ onAuth }: LoginProps) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    const response = await auth.login(email, password);
    if (response?.token) {
      onAuth(response.token, response.user?.name || response.user?.email);
    } else {
      setError(response?.error || "Login failed");
    }
  };

  return (
    <div className="card">
      <h2>Login</h2>
      <form onSubmit={handleSubmit}>
        <label>
          Email
          <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
        </label>
        <label>
          Password
          <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required />
        </label>
        {error && <div className="error">{error}</div>}
        <button type="submit">Login</button>
      </form>
      <p>
        Need an account? <Link to="/signup">Sign up</Link>
      </p>
    </div>
  );
};

export default Login;
