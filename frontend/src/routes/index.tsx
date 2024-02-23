import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: LandingPage,
  beforeLoad: ({ context }) => {
    if (context.auth.isAuthenticated) {
      throw redirect({
        to: "/home",
      });
    }
  },
});

function LandingPage() {
  return (
    <div>
      <h1 className="pt-20 text-3xl text-center">
        Welcome to food ordering application
      </h1>
    </div>
  );
}
