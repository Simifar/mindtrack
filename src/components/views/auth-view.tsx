"use client";
import { useState } from "react";
import { api, type AppUser } from "@/lib/api-client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Brain, Loader2 } from "lucide-react";

type Mode = "auth" | "forgot" | "reset";

export function AuthView({
  onAuthed,
  resetToken: initialResetToken,
}: {
  onAuthed: (u: AppUser) => void;
  resetToken?: string | null;
}) {
  const [mode, setMode] = useState<Mode>(initialResetToken ? "reset" : "auth");
  const [tab, setTab] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";

  // --- «Забыли пароль?» ---
  const [forgotSent, setForgotSent] = useState(false);
  const [devResetUrl, setDevResetUrl] = useState<string | null>(null);

  // --- Сброс пароля ---
  const [resetToken, setResetToken] = useState(initialResetToken ?? "");
  const [newPassword, setNewPassword] = useState("");
  const [newPasswordConfirm, setNewPasswordConfirm] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const { user } =
        tab === "login"
          ? await api.auth.login(email, password)
          : await api.auth.register(email, password, tz);
      toast({ title: tab === "login" ? "Вход выполнен" : "Аккаунт создан" });
      onAuthed(user);
    } catch (err) {
      toast({
        title: "Ошибка",
        description: err instanceof Error ? err.message : "Не удалось",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  async function submitForgot(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.auth.forgotPassword(email);
      setForgotSent(true);
      setDevResetUrl(res.resetUrl ?? null);
    } catch (err) {
      toast({
        title: "Ошибка",
        description: err instanceof Error ? err.message : "Не удалось",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  async function submitReset(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword !== newPasswordConfirm) {
      toast({ title: "Ошибка", description: "Пароли не совпадают", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      await api.auth.resetPassword(resetToken, newPassword);
      toast({ title: "Пароль обновлён", description: "Войдите с новым паролем" });
      setMode("auth");
      setTab("login");
      setPassword("");
      setNewPassword("");
      setNewPasswordConfirm("");
    } catch (err) {
      toast({
        title: "Ошибка",
        description: err instanceof Error ? err.message : "Не удалось",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-background to-muted/40 px-4 py-10">
      <div className="mb-8 flex flex-col items-center gap-3 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg">
          <Brain className="h-7 w-7" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">MindTrack</h1>
          <p className="text-sm text-muted-foreground">
            Персональный self-tracker психического состояния
          </p>
        </div>
      </div>

      <div className="w-full max-w-sm rounded-xl border bg-card p-6 shadow-sm">
        {mode === "auth" && (
          <Tabs value={tab} onValueChange={(v) => setTab(v as "login" | "register")}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Вход</TabsTrigger>
              <TabsTrigger value="register">Регистрация</TabsTrigger>
            </TabsList>
            <TabsContent value="login" className="mt-4">
              <form onSubmit={submit} className="space-y-3">
                <Field label="Email">
                  <Input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    autoComplete="email"
                  />
                </Field>
                <Field label="Пароль">
                  <Input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                  />
                </Field>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                  Войти
                </Button>
                <button
                  type="button"
                  onClick={() => {
                    setMode("forgot");
                    setForgotSent(false);
                    setDevResetUrl(null);
                  }}
                  className="w-full text-center text-xs text-muted-foreground underline-offset-4 hover:underline"
                >
                  Забыли пароль?
                </button>
              </form>
            </TabsContent>
            <TabsContent value="register" className="mt-4">
              <form onSubmit={submit} className="space-y-3">
                <Field label="Email">
                  <Input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    autoComplete="email"
                  />
                </Field>
                <Field label="Пароль (мин. 10 символов)">
                  <Input
                    type="password"
                    required
                    minLength={10}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="new-password"
                  />
                </Field>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                  Создать аккаунт
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        )}

        {mode === "forgot" && (
          <div className="space-y-3">
            <h2 className="text-lg font-semibold">Восстановление пароля</h2>
            {forgotSent ? (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Если аккаунт с таким email существует, ссылка для сброса отправлена. Она действует
                  1 час.
                </p>
                {devResetUrl && (
                  <div className="rounded-md border border-dashed p-3 text-xs">
                    <p className="mb-2 font-medium">Режим разработки — ссылка сброса:</p>
                    <p className="mb-2 break-all text-muted-foreground">{devResetUrl}</p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const token = new URL(devResetUrl).searchParams.get("resetToken");
                        if (token) {
                          setResetToken(token);
                          setMode("reset");
                        }
                      }}
                    >
                      Перейти к сбросу
                    </Button>
                  </div>
                )}
                <Button variant="outline" className="w-full" onClick={() => setMode("auth")}>
                  Назад ко входу
                </Button>
              </div>
            ) : (
              <form onSubmit={submitForgot} className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Введите email аккаунта — пришлём ссылку для сброса пароля.
                </p>
                <Field label="Email">
                  <Input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    autoComplete="email"
                  />
                </Field>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                  Отправить ссылку
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={() => setMode("auth")}
                >
                  Назад
                </Button>
              </form>
            )}
          </div>
        )}

        {mode === "reset" && (
          <form onSubmit={submitReset} className="space-y-3">
            <h2 className="text-lg font-semibold">Новый пароль</h2>
            {!initialResetToken && (
              <Field label="Токен из ссылки">
                <Input
                  required
                  value={resetToken}
                  onChange={(e) => setResetToken(e.target.value)}
                  placeholder="Вставьте токен"
                />
              </Field>
            )}
            <Field label="Новый пароль (мин. 10 символов)">
              <Input
                type="password"
                required
                minLength={10}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoComplete="new-password"
              />
            </Field>
            <Field label="Повторите пароль">
              <Input
                type="password"
                required
                minLength={10}
                value={newPasswordConfirm}
                onChange={(e) => setNewPasswordConfirm(e.target.value)}
                autoComplete="new-password"
              />
            </Field>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Установить пароль
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="w-full"
              onClick={() => setMode("auth")}
            >
              Назад
            </Button>
          </form>
        )}
      </div>

      <p className="mt-6 max-w-sm text-center text-xs text-muted-foreground">
        Данные о ментальном здоровье относятся к чувствительной категории. Регистрируясь, вы
        соглашаетесь на их обработку — позже можно экспортировать или полностью удалить всё в один
        клик.
      </p>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
