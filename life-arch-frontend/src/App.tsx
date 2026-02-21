import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
} from "react-router-dom";
import { useAuthStore } from "./store/authStore";
import Login from "./pages/Login";
import Register from "./pages/Register";

// --- Placeholder Pages (We will build these out next) ---
// const Login = () => <div className="p-8">Login Page (Pending)</div>;
// const Register = () => <div className="p-8">Register Page (Pending)</div>;
const Dashboard = () => {
  const { email, logout } = useAuthStore();
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Welcome, {email}</h1>
      <button
        onClick={logout}
        className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
      >
        Logout
      </button>
    </div>
  );
};

// --- Auth Guard ---
const ProtectedRoute = () => {
  const token = useAuthStore((state) => state.token);

  // If no token exists, redirect to login
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // Otherwise, render the child routes
  return <Outlet />;
};

// --- Main App Component ---
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route path="/app" element={<ProtectedRoute />}>
          <Route index element={<Dashboard />} />
        </Route>

        <Route path="*" element={<Navigate to="/app" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
