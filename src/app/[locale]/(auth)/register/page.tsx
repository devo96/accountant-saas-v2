"use client";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { useState } from "react";
import { FadeIn } from "@/components/transitions";

export default function RegisterPage() {
  const t = useTranslations("auth");
  const router = useRouter();
  const [name, setName] = useState("");
  const [organizationName, setOrganizationName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    if (password !== confirmPassword) {
      setError(t("passwordMismatch"));
      setLoading(false);
      return;
    }

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password, organizationName }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Registration failed");
      setLoading(false);
      return;
    }

    setSuccess(t("registerSuccess"));
    setLoading(false);
    setTimeout(() => router.push("/login"), 2000);
  }

  return (
    <FadeIn>
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-sm animate-fade-in-up">
          <CardHeader className="text-center">
            <div className="mb-4 flex justify-center">
              <div className="h-14 w-14 rounded-full bg-primary-800 dark:bg-primary-600 flex items-center justify-center shadow-lg shadow-primary-800/20 dark:shadow-primary-600/20">
                <span className="text-white text-2xl font-bold">ق</span>
              </div>
            </div>
            <CardTitle className="text-gray-900 dark:text-gray-100">{t("register")}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                id="name"
                label={t("name")}
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
              <Input
                id="organizationName"
                label={t("organizationName")}
                value={organizationName}
                onChange={(e) => setOrganizationName(e.target.value)}
                required
              />
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
              <Input
                id="confirmPassword"
                label={t("confirmPassword")}
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
              {error && (
                <Alert variant="danger">{error}</Alert>
              )}
              {success && (
                <Alert variant="success" dismissible>{success}</Alert>
              )}
              <Button type="submit" className="w-full" loading={loading}>
                {loading ? "..." : t("registerButton")}
              </Button>
            </form>
            <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
              {t("alreadyHaveAccount")}{" "}
              <a href="/login" className="text-primary-800 dark:text-primary-400 hover:underline font-medium">
                {t("loginLink")}
              </a>
            </p>
          </CardContent>
        </Card>
      </div>
    </FadeIn>
  );
}
