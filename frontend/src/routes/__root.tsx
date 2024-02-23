import { NavBar } from "@/components/navbar";
import { createRootRouteWithContext, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/router-devtools";
import { Toaster } from "@/components/ui/sonner";
import { AuthContext } from "@/context/auth";

interface MyRouterContext {
  auth: AuthContext;
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
  component: () => (
    <div className="flex flex-col min-h-screen">
      <Toaster richColors />
      <NavBar />
      <div className="h-8 px-4 grow">
        <Outlet />
      </div>
      <TanStackRouterDevtools />
    </div>
  ),
});
