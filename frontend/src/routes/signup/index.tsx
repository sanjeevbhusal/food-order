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
import { createFileRoute, redirect } from "@tanstack/react-router";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import axios, { AxiosError } from "axios";
import { API_URL } from "@/lib/constants";
import { useState } from "react";
import { Loader2 } from "lucide-react";

import { toast } from "sonner";

export const Route = createFileRoute("/signup/")({
  component: SignupComponent,
  beforeLoad: ({ context }) => {
    if (context.auth.isAuthenticated) {
      throw redirect({
        to: "/",
      });
    }
  },
});

const formSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email(),
  password: z.string().min(8, "Password must be atleast 8 characters"),
});

function SignupComponent() {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
    },
  });
  const [email, setEmail] = useState("");

  const [isLoading, setIsLoading] = useState(false);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    try {
      await axios.post(`${API_URL}/authentication/signup`, values);
      setEmail(values.email);
      form.reset();
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
        case 409:
          form.setError("email", {
            message: "Email is already in use",
          });
          break;

        default:
          toast.error("Something went wrong");
      }
    } finally {
      setIsLoading(false);
    }
  }

  if (form.formState.isSubmitSuccessful) {
    return (
      <div className="flex flex-col items-center pt-12">
        <h2 className="text-lg font-bold">Account Created Succesfully</h2>
        <p className="mt-2">
          In order to activate your account, you have to verify your email. We
          have sent an email to <span className="font-bold">{email}</span> with
          further instructions.
        </p>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center h-full gap-4">
      <div className="w-96">
        <h3 className="text-2xl font-semibold">Signup To QuickBite</h3>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="mt-4 space-y-8"
          >
            <FormField
              control={form.control}
              name="firstName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>First Name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="lastName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Last Name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
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
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input type="password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full">
              {isLoading ? <Loader2 className="animate-spin" /> : "Signup"}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}
