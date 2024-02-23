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
import { createFileRoute, redirect } from "@tanstack/react-router";
import axios, { AxiosError } from "axios";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

export const Route = createFileRoute("/forgot-password/")({
  component: ForgotPassword,
  beforeLoad: ({ context }) => {
    if (context.auth.isAuthenticated) {
      throw redirect({
        to: "/",
      });
    }
  },
});

const formSchema = z.object({
  email: z.string().email(),
});

function ForgotPassword() {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      await axios.post(`${API_URL}/authentication/forgot-password`, values, {
        withCredentials: true,
      });
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
        case 404:
          form.setError("email", {
            message: "User not found",
          });
          break;
        default:
          toast.error("Something went wrong");
      }
    }
  }

  if (form.formState.isSubmitSuccessful) {
    return (
      <div className="flex flex-col items-center pt-12">
        <h2 className="text-lg font-bold">Email sent Succesfully</h2>
        <p className="mt-2">
          We sent a email to{" "}
          <span className="font-bold">{form.getValues("email")}</span> with
          instructions on how to reset your password.
        </p>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center h-full">
      <div className="w-96">
        <h3 className="text-2xl font-semibold">Forgot Password</h3>
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
                  <FormMessage />
                  <FormDescription>
                    We will send a email with instructions on how to reset the
                    password
                  </FormDescription>
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full">
              {form.formState.isLoading ? (
                <Loader2 className="animate-spin" />
              ) : (
                "Send Reset Email"
              )}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}
