"use client";
import { useState } from "react";
import { api } from "@/lib/api-client";
import { useAppStore } from "@/store/app-store";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { ThemeToggle } from "@/components/app/theme-toggle";
import { Download, Trash2, Loader2, ShieldAlert, Database, KeyRound, Monitor } from "lucide-react";

export function SettingsView() {
  const user = useAppStore((s) => s.user);
  const setUser = useAppStore((s) => s.setUser);
  const { toast } = useToast();
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [deletePassword, setDeletePassword] = useState("");

  // Смена пароля
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPasswordConfirm, setNewPasswordConfirm] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword !== newPasswordConfirm) {
      toast({ title: "Ошибка", description: "Новые пароли не совпадают", variant: "destructive" });
      return;
    }
    setChangingPassword(true);
    try {
      await api.auth.changePassword(currentPassword, newPassword);
      toast({ title: "Пароль изменён", description: "Остальные сессии завершены" });
      setCurrentPassword("");
      setNewPassword("");
      setNewPasswordConfirm("");
    } catch (err) {
      toast({
        title: "Ошибка",
        description: err instanceof Error ? err.message : "Не удалось",
        variant: "destructive",
      });
    } finally {
      setChangingPassword(false);
    }
  }

  async function exportData() {
    setExporting(true);
    try {
      const blob = await api.account.exportData();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `mindtrack-data-${user?.email ?? "export"}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast({ title: "Данные экспортированы", description: "JSON-файл в загрузках" });
    } catch (err) {
      toast({
        title: "Ошибка",
        description: err instanceof Error ? err.message : "Не удалось",
        variant: "destructive",
      });
    } finally {
      setExporting(false);
    }
  }

  async function deleteAccount() {
    setDeleting(true);
    try {
      await api.account.delete(deletePassword);
      toast({ title: "Аккаунт удалён", description: "Все данные стёрты" });
      setUser(null);
    } catch (err) {
      toast({
        title: "Ошибка",
        description: err instanceof Error ? err.message : "Не удалось",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Настройки и приватность</h1>
        <p className="text-sm text-muted-foreground">Управление данными и аккаунтом</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Database className="h-4 w-4" />
            Профиль
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Email</span>
            <span className="font-medium">{user?.email}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Часовой пояс</span>
            <span className="font-medium">{user?.timezone}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Согласие принято</span>
            <span className="font-medium">
              {user?.consentAcceptedAt
                ? new Date(user.consentAcceptedAt).toLocaleDateString("ru-RU")
                : "—"}
            </span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Monitor className="h-4 w-4" />
            Внешний вид
          </CardTitle>
          <CardDescription>Светлая или тёмная тема оформления</CardDescription>
        </CardHeader>
        <CardContent>
          <ThemeToggle />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <KeyRound className="h-4 w-4" />
            Смена пароля
          </CardTitle>
          <CardDescription>
            После смены пароля все прочие сессии будут завершены
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={changePassword} className="max-w-sm space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="current-password">Текущий пароль</Label>
              <Input
                id="current-password"
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                autoComplete="current-password"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="new-password">Новый пароль (мин. 10 символов)</Label>
              <Input
                id="new-password"
                type="password"
                required
                minLength={10}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoComplete="new-password"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="new-password-confirm">Повторите новый пароль</Label>
              <Input
                id="new-password-confirm"
                type="password"
                required
                minLength={10}
                value={newPasswordConfirm}
                onChange={(e) => setNewPasswordConfirm(e.target.value)}
                autoComplete="new-password"
              />
            </div>
            <Button type="submit" variant="outline" disabled={changingPassword}>
              {changingPassword && <Loader2 className="h-4 w-4 animate-spin" />}
              Сменить пароль
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Download className="h-4 w-4" />
            Экспорт всех данных
          </CardTitle>
          <CardDescription>
            Скачайте всё в один JSON-файл — право на портативность (GDPR / 152-ФЗ)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={exportData} disabled={exporting} variant="outline">
            {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            Экспортировать данные (JSON)
          </Button>
        </CardContent>
      </Card>

      <Card className="border-destructive/40">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base text-destructive">
            <Trash2 className="h-4 w-4" />
            Удаление аккаунта
          </CardTitle>
          <CardDescription>
            Полное удаление аккаунта и всех записей. Действие необратимо (право на забвение).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                <Trash2 className="h-4 w-4" />
                Удалить аккаунт
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2">
                  <ShieldAlert className="h-5 w-5 text-destructive" />
                  Точно удалить всё?
                </AlertDialogTitle>
                <AlertDialogDescription>
                  Будут безвозвратно удалены: ваш профиль, все результаты тестов, записи дневника (включая
                  расшифрованные заметки), история экспорта. Это действие нельзя отменить.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <p className="text-sm">
                    Для подтверждения введите <span className="font-mono font-semibold">УДАЛИТЬ</span>:
                  </p>
                  <Input
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value)}
                    placeholder="УДАЛИТЬ"
                  />
                </div>
                <div className="space-y-1.5">
                  <p className="text-sm">И ваш текущий пароль:</p>
                  <Input
                    type="password"
                    value={deletePassword}
                    onChange={(e) => setDeletePassword(e.target.value)}
                    placeholder="Пароль"
                    autoComplete="current-password"
                  />
                </div>
              </div>
              <AlertDialogFooter>
                <AlertDialogCancel
                  onClick={() => {
                    setConfirmText("");
                    setDeletePassword("");
                  }}
                >
                  Отмена
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={deleteAccount}
                  disabled={confirmText !== "УДАЛИТЬ" || !deletePassword || deleting}
                  className="bg-destructive text-white hover:bg-destructive/90"
                >
                  {deleting && <Loader2 className="h-4 w-4 animate-spin" />}
                  Удалить навсегда
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Безопасность данных</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>✓ Пароли хранятся в виде bcrypt-хэша (12 раундов).</p>
          <p>✓ Заметки дневника и ответы тестов шифруются AES-256-GCM на уровне приложения.</p>
          <p>✓ Передача данных — по TLS.</p>
          <p>✓ Сессия — JWT в http-only cookie (30 дней), отзывается на сервере при выходе и смене пароля.</p>
          <p>✓ Ограничение числа попыток входа и сброса пароля (rate limiting).</p>
          <p>✓ Каскадное удаление: при удалении аккаунта стираются все связанные записи.</p>
        </CardContent>
      </Card>
    </div>
  );
}
