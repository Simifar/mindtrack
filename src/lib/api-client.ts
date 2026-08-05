/**
 * API-клиент для фронтенда. Все запросы — относительные пути /api/*.
 * Не использует абсолютных URL (требование gateway).
 */

export type AppUser = {
  id: string;
  email: string;
  timezone: string;
  consentAcceptedAt: string | null;
  onboardingCompleted: boolean;
};

export type ConditionTagDTO = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  recommendedTestCodes: string[];
};

export type TestDefinitionDTO = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  periodicityDays: number;
  category: string;
  version: number;
  _count: { questions: number };
  recommended: boolean;
  due: boolean;
  lastResponse: {
    completedAt: string;
    totalScore: number;
    severity: string;
    label: string;
  } | null;
};

export type TestDetailDTO = {
  definition: {
    id: string;
    code: string;
    name: string;
    description: string | null;
    periodicityDays: number;
    category: string;
    version: number;
  };
  questions: {
    id: string;
    order: number;
    text: string;
    isFreeText: boolean;
    options: { value: number; label: string }[];
  }[];
  history: {
    completedAt: string;
    totalScore: number;
    severity: string;
    label: string;
  }[];
};

export type DiaryEntryDTO = {
  id: string;
  date: string;
  mood: number;
  sleepHours: number | null;
  energyLevel: number | null;
  notes: string;
  crisisDetected: boolean;
};

export type DashboardDTO = {
  moodSeries: {
    date: string;
    mood: number;
    sleepHours: number | null;
    energyLevel: number | null;
    notes: string;
    crisisDetected: boolean;
  }[];
  latestTests: {
    id: string;
    completedAt: string;
    totalScore: number;
    severity: string;
    label: string;
    test: { id: string; code: string; name: string; periodicityDays: number };
  }[];
  reminders: {
    id: string;
    code: string;
    name: string;
    periodicityDays: number;
    lastCompletedAt: string | null;
    due: boolean;
  }[];
  stats: {
    avgMood: number | null;
    avgSleep: number | null;
    diaryDays: number;
    totalTests: number;
  };
};

async function handle<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let msg = `Ошибка ${res.status}`;
    try {
      const j = await res.json();
      msg = j.error ?? msg;
    } catch {
      /* ignore */
    }
    throw new Error(msg);
  }
  if (res.status === 204) return undefined as T;
  const ct = res.headers.get("content-type") ?? "";
  if (ct.includes("application/json")) return (await res.json()) as T;
  return (await res.text()) as unknown as T;
}

export const api = {
  auth: {
    me: () => fetch("/api/auth/me").then((r) => handle<{ user: AppUser | null }>(r)),
    register: (email: string, password: string, timezone?: string) =>
      fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, timezone }),
      }).then((r) => handle<{ user: AppUser }>(r)),
    login: (email: string, password: string) =>
      fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      }).then((r) => handle<{ user: AppUser }>(r)),
    logout: () =>
      fetch("/api/auth/logout", { method: "POST" }).then((r) => handle<{ ok: true }>(r)),
  },
  consent: {
    accept: () =>
      fetch("/api/consent", { method: "POST" }).then((r) => handle<{ user: AppUser }>(r)),
  },
  onboarding: {
    get: () =>
      fetch("/api/onboarding").then((r) => handle<{ tags: ConditionTagDTO[]; selectedIds: string[] }>(r)),
    complete: (conditionTagIds: string[]) =>
      fetch("/api/onboarding/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conditionTagIds, consentAccepted: true }),
      }).then((r) => handle<{ user: AppUser }>(r)),
  },
  tests: {
    definitions: () =>
      fetch("/api/tests/definitions").then((r) => handle<{ definitions: TestDefinitionDTO[] }>(r)),
    detail: (id: string) => fetch(`/api/tests/${id}`).then((r) => handle<TestDetailDTO>(r)),
    submit: (testDefinitionId: string, answers: { questionId: string; value: number | string }[]) =>
      fetch("/api/tests/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ testDefinitionId, answers }),
      }).then((r) =>
        handle<{
          responseId: string;
          totalScore: number;
          severity: string;
          label: string;
          crisisDetected: boolean;
        }>(r)
      ),
    history: (testDefinitionId?: string) =>
      fetch(`/api/tests/history${testDefinitionId ? `?testDefinitionId=${testDefinitionId}` : ""}`).then(
        (r) => handle<{ items: any[] }>(r)
      ),
  },
  diary: {
    list: (from?: string, to?: string) =>
      fetch(`/api/diary?${new URLSearchParams({ from: from ?? "", to: to ?? "" })}`).then((r) =>
        handle<{ items: DiaryEntryDTO[] }>(r)
      ),
    get: (date: string) => fetch(`/api/diary/${date}`).then((r) => handle<{ entry: DiaryEntryDTO | null }>(r)),
    save: (data: {
      date: string;
      mood: number;
      sleepHours?: number | null;
      energyLevel?: number | null;
      notes?: string;
    }) =>
      fetch("/api/diary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then((r) => handle<{ entry: DiaryEntryDTO }>(r)),
  },
  dashboard: {
    get: () => fetch("/api/dashboard").then((r) => handle<DashboardDTO>(r)),
  },
  export: {
    pdf: async (data: {
      dateFrom: string;
      dateTo: string;
      sections: string[];
    }) => {
      const res = await fetch("/api/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, generateShareLink: false }),
      });
      if (!res.ok) {
        let msg = `Ошибка ${res.status}`;
        try {
          const j = await res.json();
          msg = j.error ?? msg;
        } catch {}
        throw new Error(msg);
      }
      return await res.blob();
    },
    shareLink: (data: {
      dateFrom: string;
      dateTo: string;
      sections: string[];
      shareTtlDays: number;
    }) =>
      fetch("/api/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, generateShareLink: true }),
      }).then((r) => handle<{ shareUrl: string; shareToken: string; expiresAt: string }>(r)),
  },
  account: {
    delete: () =>
      fetch("/api/account/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirm: "DELETE" }),
      }).then((r) => handle<{ ok: true }>(r)),
    exportData: () => fetch("/api/account/export-data").then((r) => r.blob()),
  },
  share: {
    getJson: async (token: string) => {
      const res = await fetch(`/api/export/share/${token}?format=json`);
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? "Ссылка недействительна или истекла");
      }
      return res.json();
    },
    getPdf: async (token: string) => {
      const res = await fetch(`/api/export/share/${token}?format=pdf`);
      if (!res.ok) throw new Error("Ссылка недействительна или истекла");
      return res.blob();
    },
  },
};
