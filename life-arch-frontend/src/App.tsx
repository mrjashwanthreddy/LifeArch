import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
} from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useAuthStore } from "./store/authStore";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import CalendarView from "./pages/CalendarView";
import AppLayout from "./components/AppLayout";
import ProjectView from "./pages/ProjectView";

// 1. ADD THIS IMPORT
import HabitsView from "./pages/HabitsView";
import GoalsView from "./pages/GoalsView";
import AnalyticsView from "./pages/AnalyticsView";
import ProfileView from "./pages/ProfileView";

const queryClient = new QueryClient();

const isTokenExpired = (token: string) => {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    // Buffer of 10 seconds
    return payload.exp && payload.exp * 1000 < Date.now() - 10000;
  } catch {
    return true;
  }
};

const ProtectedRoute = () => {
  const token = useAuthStore((state) => state.token);
  const logout = useAuthStore((state) => state.logout);

  if (!token || isTokenExpired(token)) {
    if (token) logout();
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route path="/app" element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="calendar" element={<CalendarView />} />
              <Route path="projects/:projectId" element={<ProjectView />} />

              {/* 2. ADD THIS ROUTE */}
              <Route path="habits" element={<HabitsView />} />
              <Route path="goals" element={<GoalsView />} />
              <Route path="analytics" element={<AnalyticsView />} />
              <Route path="profile" element={<ProfileView />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/app" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
