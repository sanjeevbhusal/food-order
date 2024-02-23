import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { API_URL } from "@/lib/constants";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, createFileRoute, redirect } from "@tanstack/react-router";
import axios, { AxiosError } from "axios";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const resetPasswordSchema = z.object({
  token: z.string(),
});

export const Route = createFileRoute("/reset-password/")({
  component: ResetPassword,
  validateSearch: resetPasswordSchema,
  beforeLoad: async ({ context, search }) => {
    if (context.auth.isAuthenticated) {
      throw redirect({
        to: "/",
      });
    }

    await axios.get(
      `${API_URL}/authentication/verify-reset-password-token?token=${search.token}`
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

const formSchema = z
  .object({
    password: z.string(),
    confirmPassword: z.string(),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

function ResetPassword() {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const { token } = Route.useSearch();

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      await axios.post(
        `${API_URL}/authentication/reset-password`,
        { ...values, token },
        {
          withCredentials: true,
        }
      );
    } catch (e) {
      console.log(e);
      const error = e as AxiosError;
      const response = error.response;

      if (!response) {
        toast.error(
          "Looks like you are offline. Please check your internet connection and try again."
        );
        return;
      }

      switch (response.status) {
        default:
          toast.error("Something went wrong");
      }
    }
  }

  if (form.formState.isSubmitSuccessful) {
    return (
      <div className="flex flex-col items-center pt-12">
        <h2 className="text-lg font-bold">Password reset Succesfully</h2>
        <Link to={"/login"}>
          <Button>Login</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center h-full">
      <div className="w-96">
        <h3 className="text-2xl font-semibold">Reset Password</h3>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="mt-4 space-y-8"
          >
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input {...field} type="password" />
                  </FormControl>
                  <FormMessage />
                  <FormDescription>
                    This will be your new password.
                  </FormDescription>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm Password</FormLabel>
                  <FormControl>
                    <Input {...field} type="password" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full">
              {form.formState.isLoading ? (
                <Loader2 className="animate-spin" />
              ) : (
                "Reset password"
              )}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}
