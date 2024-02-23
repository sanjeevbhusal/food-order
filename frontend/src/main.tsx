import { StrictMode } from "react";
import ReactDOM from "react-dom/client";
import {
  NotFoundRoute,
  RouterProvider,
  createRouter,
} from "@tanstack/react-router";
import "./index.css";
import { Route as rootRoute } from "./routes/__root";
// Import the generated route tree
import { routeTree } from "./routeTree.gen";
import { AuthProvider } from "./context/auth";
import { useAuth } from "./hooks/useAuth";

const notFoundRoute = new NotFoundRoute({
  getParentRoute: () => rootRoute,
  component: () => <div>Not Found</div>,
});

// Create a new router instance
const router = createRouter({
  routeTree,
  notFoundRoute,
  context: {
    auth: undefined!,
  },
});

// Register the router instance for type safety
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

function InnerApp() {
  const auth = useAuth();
  return <RouterProvider router={router} context={{ auth }} />;
}

function App() {
  return (
    <AuthProvider>
      <InnerApp />
    </AuthProvider>
  );
}

// Render the app
const rootElement = document.getElementById("app")!;
if (!rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <StrictMode>
      <App />
    </StrictMode>
  );
}
