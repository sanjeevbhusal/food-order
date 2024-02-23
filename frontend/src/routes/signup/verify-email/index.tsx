import { Button } from "@/components/ui/button";
import { API_URL } from "@/lib/constants";
import { Link, createFileRoute } from "@tanstack/react-router";
import axios from "axios";
import z from "zod";

const verifyEmailSchema = z.object({
  token: z.string(),
});

// type VerifyEmail = z.infer<typeof verifyEmailSchema>;

export const Route = createFileRoute("/signup/verify-email/")({
  component: VerifySignupEmailComponent,
  validateSearch: verifyEmailSchema,
  beforeLoad: async ({ search }) => {
    await axios.get(
      `${API_URL}/authentication/verify-email?token=${search.token}`
    );
  },
  errorComponent: () => {
    return (
      <div className="flex flex-col items-center pt-12">
        <h2 className="text-lg font-bold">Invalid Token</h2>
        <p className="mt-2">
          The Link is invalid. Please make sure you click the link sent to your
          email and donot modify the URL yourself
        </p>
      </div>
    );
  },
});

function VerifySignupEmailComponent() {
  return (
    <div className="flex flex-col items-center pt-12">
      <h2 className="text-lg font-bold">
        Your email has been verified. You can now login to the application
      </h2>
      <Link to={"/login"}>
        <Button className="mt-4">Log In</Button>
      </Link>
    </div>
  );
}
