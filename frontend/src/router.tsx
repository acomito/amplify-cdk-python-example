import { createBrowserRouter, Navigate } from "react-router-dom";
import AuthLogin from "./pages/auth-login";
import AuthSignup from "./pages/auth-signup";
import AppHome from "./pages/app-home";

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
    path: "/app",
    element: <AppHome />,
  },
]);
