import { FormMessage, Message } from "@/components/form-message";
import { SmtpMessage } from "../smtp-message";
import Navbar from "@/components/navbar";
import { ForgotPasswordForm } from "@/components/forgot-password-form";

export default async function ForgotPassword(props: {
  searchParams: Promise<Message>;
}) {
  const searchParams = await props.searchParams;

  if ("message" in searchParams) {
    return (
      <div className="flex h-screen w-full flex-1 items-center justify-center p-4 sm:max-w-md">
        <FormMessage message={searchParams} />
      </div>
    );
  }

  const initialMessage =
    "error" in searchParams
      ? { error: searchParams.error }
      : "success" in searchParams
        ? { success: searchParams.success }
        : undefined;

  return (
    <>
      <Navbar />
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-8">
        <div className="w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-sm">
          <ForgotPasswordForm initialMessage={initialMessage} />
        </div>
        <SmtpMessage />
      </div>
    </>
  );
}
