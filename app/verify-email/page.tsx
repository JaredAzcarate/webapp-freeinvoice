import EmailVerification from "@/features/auth/ui/components/EmailVerification";

export default function VerifyEmailPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 p-4">
      <EmailVerification />
    </div>
  );
}
