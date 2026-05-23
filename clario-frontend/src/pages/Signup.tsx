import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import api from "@/api/axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";

export default function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await api.post("/v1/auth/signup", { name, email, password });
      login(res.data.session.access_token);
      navigate("/dashboard");
    } catch (err: any) {
      setError(err.response?.data?.error || "Signup failed");
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
                    Create account
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    Enter your details to get started
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  {error && (
                    <div className="rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                      {error}
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-sm font-medium text-foreground">
                      Full name
                    </Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="John Doe"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      className="h-12 rounded-md border-border bg-background"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium text-foreground">
                      Email address
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="m@example.com"
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

                  <Button
                    type="submit"
                    className="h-12 w-full rounded-md text-sm font-medium"
                    disabled={loading}
                  >
                    {loading ? "Creating account..." : "Create account"}
                  </Button>

                  <p className="pt-2 text-center text-sm text-muted-foreground">
                    Already have an account?{" "}
                    <Link
                      to="/login"
                      className="font-medium text-primary hover:text-primary/80"
                    >
                      Sign in
                    </Link>
                  </p>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="relative hidden overflow-hidden lg:flex lg:items-center lg:justify-center bg-gradient-to-br from-[#8b5cf6] via-[#9b6dff] to-[#c4b5fd] p-10">
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
                  <path d="M12 5v14" />
                  <path d="M5 12h14" />
                  <path d="M19 8v8a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2Z" />
                </svg>
              </div>

              <h2 className="mb-3 text-3xl font-semibold tracking-tight">
                Start building faster
              </h2>
              <p className="max-w-sm text-sm leading-6 text-white/85">
                Create your workspace, manage chatbots, and organize integrations in one clean product environment.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}