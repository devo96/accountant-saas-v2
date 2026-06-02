"use client";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useTranslations } from "next-intl";
import { signIn } from "next-auth/react";
import { useRouter } from "@/i18n/navigation";
import { useState } from "react";
import { BarChart3 } from "lucide-react";

export default function LoginPage() {
  const t = useTranslations("auth");
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError("Invalid email or password");
      setLoading(false);
    } else {
      router.push("/dashboard");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[var(--color-bg)]">
      <Card className="w-full max-w-xs animate-fade-in-up">
        <CardHeader className="text-center">
          <div className="mb-3 flex justify-center">
            <div className="h-10 w-10 rounded-lg bg-primary-500 flex items-center justify-center">
              <BarChart3 className="h-5 w-5 text-white" />
            </div>
          </div>
          <CardTitle className="text-base">{t("login")}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-3">
            <Input
              id="email"
              label={t("email")}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Input
              id="password"
              label={t("password")}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            {error && (
              <Alert variant="danger">{error}</Alert>
            )}
            <Button type="submit" className="w-full" loading={loading}>
              {t("loginButton")}
            </Button>
          </form>
          <p className="mt-4 text-center text-xs text-gray-500 dark:text-gray-400">
            {t("noAccount")}{" "}
            <a href="/register" className="text-primary-600 dark:text-primary-400 hover:underline font-medium">
              {t("createAccount")}
            </a>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
