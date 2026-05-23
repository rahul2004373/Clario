import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import api from "@/api/axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [remember, setRemember] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await api.post("/v1/auth/login", { email, password });
      login(res.data.session.access_token);
      navigate("/dashboard");
    } catch (err: any) {
      setError(err.response?.data?.error || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
        <div className="flex items-center justify-center px-6 py-10 sm:px-10 lg:px-16">
          <div className="w-full max-w-md">
            <div className="mb-10 flex items-center gap-3">
              <div className="grid h-10 w-10 grid-cols-2 gap-1 rounded-md bg-primary/10 p-2">
                <div className="rounded-sm bg-primary" />
                <div className="rounded-sm bg-primary/70" />
                <div className="rounded-sm bg-primary/70" />
                <div className="rounded-sm bg-primary" />
              </div>
              <span className="text-xl font-semibold tracking-tight text-foreground">
                Clario
              </span>
            </div>

            <Card className="border-0 shadow-none">
              <CardContent className="p-0">
                <div className="mb-8 space-y-2">
                  <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                    Welcome back
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    Please enter your details
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  {error && (
                    <div className="rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                      {error}
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium text-foreground">
                      Email address
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="h-12 rounded-md border-border bg-background"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-sm font-medium text-foreground">
                      Password
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="h-12 rounded-md border-border bg-background"
                    />
                  </div>

                  <div className="flex items-center justify-between gap-4 text-sm">
                    <label className="flex items-center gap-2 text-muted-foreground">
                      <input
                        type="checkbox"
                        checked={remember}
                        onChange={(e) => setRemember(e.target.checked)}
                        className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                      />
                      Remember for 30 days
                    </label>

                    <button
                      type="button"
                      className="font-medium text-primary transition-colors hover:text-primary/80"
                    >
                      Forgot password
                    </button>
                  </div>

                  <Button
                    type="submit"
                    className="h-12 w-full rounded-md text-sm font-medium"
                    disabled={loading}
                  >
                    {loading ? "Signing in..." : "Sign in"}
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    className="h-12 w-full rounded-md text-sm font-medium"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 48 48"
                      className="mr-2 h-5 w-5"
                    >
                      <path
                        fill="#FFC107"
                        d="M43.611 20.083H42V20H24v8h11.303C33.654 32.657 29.193 36 24 36c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.27 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"
                      />
                      <path
                        fill="#FF3D00"
                        d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.27 4 24 4c-7.682 0-14.347 4.337-17.694 10.691z"
                      />
                      <path
                        fill="#4CAF50"
                        d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.143 35.091 26.715 36 24 36c-5.173 0-9.625-3.329-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"
                      />
                      <path
                        fill="#1976D2"
                        d="M43.611 20.083H42V20H24v8h11.303c-.793 2.327-2.28 4.324-4.274 5.57-.001-.001 6.19 5.238 6.19 5.238C36.781 39.17 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"
                      />
                    </svg>
                    Sign in with Google
                  </Button>

                  <p className="pt-2 text-center text-sm text-muted-foreground">
                    Don&apos;t have an account?{" "}
                    <Link
                      to="/signup"
                      className="font-medium text-primary hover:text-primary/80"
                    >
                      Sign up
                    </Link>
                  </p>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="relative hidden lg:flex items-center justify-center overflow-hidden bg-gradient-to-br from-[#8b5cf6] via-[#9b6dff] to-[#c4b5fd] p-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.18),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.14),transparent_28%)]" />

          <div className="relative z-10 flex h-full w-full max-w-2xl items-center justify-center rounded-[32px] border border-white/20 bg-white/10 p-8 backdrop-blur-sm">
            <div className="flex w-full max-w-md flex-col items-center text-center text-white">
              <div className="mb-8 grid h-20 w-20 place-items-center rounded-full border border-white/30 bg-white/15">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-10 w-10"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                >
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  <path d="M8 9h8" />
                  <path d="M8 13h5" />
                </svg>
              </div>

              <h2 className="mb-3 text-3xl font-semibold tracking-tight">
                Your AI workspace
              </h2>
              <p className="max-w-sm text-sm leading-6 text-white/85">
                Manage chatbots, workspace activity, docs, and integrations through one clean platform.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}