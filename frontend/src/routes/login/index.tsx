import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Link,
  createFileRoute,
  redirect,
  useNavigate,
} from "@tanstack/react-router";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import axios, { AxiosError } from "axios";
import { API_URL } from "@/lib/constants";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Route as HomeRoute } from "@/routes/index";
import { useAuth } from "@/hooks/useAuth";
import { User } from "@/types";

export const Route = createFileRoute("/login/")({
  component: LoginComponent,
  beforeLoad: ({ context }) => {
    console.log("login component before load", context);
    if (context.auth.isAuthenticated) {
      throw redirect({
        to: "/",
      });
    }
  },
});

const formSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, "Password is required"),
});

const EMAIL_NOT_VERIFIED_ERROR_MESSAGE =
  "Email not verified. Please verify your email";
const EMAIL_DOESNOT_EXIST_ERROR_MESSAGE = "User not Found";

function LoginComponent() {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });
  const navigate = useNavigate();
  const { setUser } = useAuth();

  const [verificationEmailSent, setVerificationEmailSent] = useState(false);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      const response = await axios.post<{ data: User }>(
        `${API_URL}/authentication/login`,
        values,
        {
          withCredentials: true,
        }
      );

      const user = response.data.data;
      setUser(user);

      setTimeout(() => {
        navigate({ to: HomeRoute.to });
      }, 500);
    } catch (e) {
      const error = e as AxiosError;
      const response = error.response;

      if (!response) {
        toast.error(
          "Looks like you are offline. Please check your internet connection and try again."
        );
        return;
      }

      switch (response.status) {
        case 404:
          form.setError("email", {
            message: EMAIL_DOESNOT_EXIST_ERROR_MESSAGE,
          });
          break;
        case 401:
          form.setError("password", {
            message: "Invalid password",
          });
          break;
        case 403:
          form.setError("email", {
            message: EMAIL_NOT_VERIFIED_ERROR_MESSAGE,
          });
          break;
        default:
          toast.error("Something went wrong");
      }
    }
  }

  async function sendVerificationLink() {
    try {
      await axios.post(`${API_URL}/authentication/send-verification-email`, {
        email: form.getValues("email"),
      });
      setVerificationEmailSent(true);
    } catch (error) {
      toast.error("Something went wrong");
    }
  }

  if (verificationEmailSent) {
    return (
      <div className="flex flex-col items-center pt-12 ">
        <h2 className="text-lg font-bold">
          Verification Link Sent Succesfully
        </h2>
        <p className="mt-2">
          In order to activate your account, you have to verify your email. We
          have sent an email to{" "}
          <span className="font-bold">{form.getValues("email")}</span> with
          further instructions.
        </p>
      </div>
    );
  }

  const emailErrorMessage = form.formState?.errors.email?.message;

  return (
    <div className="flex items-center justify-center h-full">
      <div className="w-96">
        <h3 className="text-2xl font-semibold">Login To QuickBite</h3>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="mt-4 space-y-8"
          >
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  {emailErrorMessage === EMAIL_NOT_VERIFIED_ERROR_MESSAGE ? (
                    <FormMessage>
                      <span className="block">{emailErrorMessage}</span>
                      <span
                        className="p-0 m-0 text-sm text-blue-500 underline cursor-pointer"
                        onClick={sendVerificationLink}
                      >
                        Resend Verification Email ?
                      </span>
                    </FormMessage>
                  ) : emailErrorMessage ===
                    EMAIL_DOESNOT_EXIST_ERROR_MESSAGE ? (
                    <FormMessage>
                      {emailErrorMessage}
                      <Link
                        className="ml-2 text-sm text-blue-500 underline"
                        to={"/signup"}
                      >
                        Signup ?
                      </Link>
                    </FormMessage>
                  ) : (
                    <FormMessage />
                  )}
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between">
                    <FormLabel>Password</FormLabel>
                    <Link to={"/forgot-password"} className="text-sm">
                      <span className="text-blue-500 underline">
                        Forgot Password ?
                      </span>
                    </Link>
                  </div>
                  <FormControl>
                    <Input type="password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full">
              {form.formState.isLoading ? (
                <Loader2 className="animate-spin" />
              ) : (
                "Login"
              )}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}
