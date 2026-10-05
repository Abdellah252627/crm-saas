import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { LoadingState } from "./components/LoadingState";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { Clients } from "./pages/Clients";
import { Login } from "./pages/Login";
import { Pipeline } from "./pages/Pipeline";
import { Register } from "./pages/Register";

// Recharts pushes the bundle past the default chunk warning, so the dashboard
// (the only chart consumer) is split out and loaded on demand.
const Dashboard = lazy(() =>
  import("./pages/Dashboard").then((module) => ({ default: module.Dashboard })),
);

function RouteFallback() {
  return <LoadingState message="جارٍ تحميل الصفحة…" />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route
            path="/"
            element={
              <Suspense fallback={<RouteFallback />}>
                <Dashboard />
              </Suspense>
            }
          />
          <Route path="/clients" element={<Clients />} />
          <Route path="/pipeline" element={<Pipeline />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}