import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/home/")({
  component: Home,
  beforeLoad: ({ context }) => {
    if (!context.auth.isAuthenticated) {
      throw redirect({
        to: "/login",
      });
    }
  },
});

function Home() {
  return <div>Home</div>;
}
