import { createBrowserRouter, Navigate } from "react-router-dom";
import AuthLogin from "./pages/auth-login";
import AuthSignup from "./pages/auth-signup";
import AuthConfirmCode from "./pages/auth-confirm-code";
import AppHome from "./pages/app-home";
import { ProtectedRoute } from "./components/protected-route";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Navigate to="/app" replace />,
  },
  {
    path: "/login",
    element: <AuthLogin />,
  },
  {
    path: "/signup",
    element: <AuthSignup />,
  },
  {
    path: "/confirm",
    element: <AuthConfirmCode />,
  },
  {
    path: "/app",
    element: (
      <ProtectedRoute>
        <AppHome />
      </ProtectedRoute>
    ),
  },
]);
