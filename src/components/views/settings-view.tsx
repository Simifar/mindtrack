"use client";
import { useState } from "react";
import { api } from "@/lib/api-client";
import { useAppStore } from "@/store/app-store";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Download, Trash2, Loader2, ShieldAlert, Database } from "lucide-react";

export function SettingsView() {
  const user = useAppStore((s) => s.user);
  const setUser = useAppStore((s) => s.setUser);
  const setView = useAppStore((s) => s.setView);
  const { toast } = useToast();
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmText, setConfirmText] = useState("");

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
      await api.account.delete();
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
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setConfirmText("")}>Отмена</AlertDialogCancel>
                <AlertDialogAction
                  onClick={deleteAccount}
                  disabled={confirmText !== "УДАЛИТЬ" || deleting}
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
          <p>✓ Пароли хранятся в виде bcrypt-хэша (10 раундов).</p>
          <p>✓ Заметки дневника и ответы тестов шифруются AES-256-GCM на уровне приложения.</p>
          <p>✓ Передача данных — по TLS.</p>
          <p>✓ Сессия — JWT в http-only cookie (30 дней).</p>
          <p>✓ Каскадное удаление: при удалении аккаунта стираются все связанные записи.</p>
        </CardContent>
      </Card>
    </div>
  );
}
