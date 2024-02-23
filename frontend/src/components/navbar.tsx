import { Link, useNavigate } from "@tanstack/react-router";
import { Logo } from "./logo";
import { Button } from "./ui/button";
import { Route as LoginRoute } from "@/routes/login";
import { Route as SignupRoute } from "@/routes/signup";
import { useAuth } from "@/hooks/useAuth";
import axios from "axios";
import { API_URL } from "@/lib/constants";
import { toast } from "sonner";

export function NavBar() {
  const { isAuthenticated, setUser } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    try {
      axios.post(
        `${API_URL}/authentication/logout`,
        {},
        { withCredentials: true }
      );

      setUser(null);
      navigate({ to: "/login" });

      toast.success("Logged out successfully");
    } catch (error) {
      toast.error("Failed to logout, Something went wrong.");
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between h-full p-4">
        <Logo />
        <div className="flex items-center gap-6">
          {isAuthenticated ? (
            <Button
              size="default"
              variant="link"
              onClick={() => handleLogout()}
            >
              Logout
            </Button>
          ) : (
            <>
              <Link to={LoginRoute.to} activeProps={{}}>
                {({ isActive }) => (
                  <Button
                    size="default"
                    variant="link"
                    className={`${isActive ? "text-blue-500" : ""}`}
                  >
                    Login
                  </Button>
                )}
              </Link>
              <Link to={SignupRoute.to}>
                <Button size="sm">Signup</Button>
              </Link>
            </>
          )}
        </div>
      </div>
      <hr />
    </div>
  );
}
