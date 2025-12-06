"use client";

import { Button, Spin } from "antd";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function LoginLayout() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated") {
      router.push("/welcome");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black">
        <Spin size="large" />
      </div>
    );
  }

  if (session) {
    return null;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black">
      <div className="text-center">
        <h1 className="text-4xl font-semibold text-black dark:text-zinc-50 mb-6">
          FreeInvoice
        </h1>
        <p className="text-lg text-zinc-600 dark:text-zinc-400 mb-8">
          Inicia sesión para continuar
        </p>
        <Button
          type="primary"
          size="large"
          onClick={() => signIn("google", { callbackUrl: "/welcome" })}
        >
          Iniciar sesión con Google
        </Button>
      </div>
    </div>
  );
}

