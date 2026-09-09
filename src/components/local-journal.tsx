"use client";

import { useState } from "react";

const STORAGE_KEY = "mindtrack:journal";

type JournalEntry = {
  id: number;
  emotion: string;
  intensity: string;
  situation: string;
  thoughts: string;
  body: string;
  action: string;
  helped: string;
  createdAt: string;
};

type JournalForm = Omit<JournalEntry, "id" | "createdAt">;

const initialForm: JournalForm = {
  emotion: "",
  intensity: "",
  situation: "",
  thoughts: "",
  body: "",
  action: "",
  helped: "",
};

export function LocalJournal() {
  const [entries, setEntries] = useState<JournalEntry[]>(() => {
    if (typeof window === "undefined") return [];

    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];

    try {
      const parsed = JSON.parse(stored) as JournalEntry[];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
      return [];
    }
  });
  const [form, setForm] = useState<JournalForm>(initialForm);

  function updateField(field: keyof JournalForm, value: string) {
    setForm((previous) => ({ ...previous, [field]: value }));
  }

  function persist(nextEntries: JournalEntry[]) {
    setEntries(nextEntries);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextEntries));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextEntry: JournalEntry = {
      ...form,
      id: Date.now(),
      createdAt: new Date().toISOString(),
    };

    const nextEntries = [nextEntry, ...entries].slice(0, 8);
    persist(nextEntries);
    setForm(initialForm);
  }

  function clearEntries() {
    const shouldClear = window.confirm("Удалить все локальные записи дневника? Это не отменить.");
    if (!shouldClear) return;

    setEntries([]);
    window.localStorage.removeItem(STORAGE_KEY);
  }

  return (
    <div className="journal-layout">
      <form className="journal-form" onSubmit={handleSubmit}>
        <div className="field-grid">
          <label>
            <span>Эмоция</span>
            <input value={form.emotion} onChange={(event) => updateField("emotion", event.target.value)} placeholder="Например: тревога" />
          </label>
          <label>
            <span>Интенсивность</span>
            <select value={form.intensity} onChange={(event) => updateField("intensity", event.target.value)}>
              <option value="">Выбрать</option>
              <option value="1">1 / очень слабо</option>
              <option value="2">2</option>
              <option value="3">3</option>
              <option value="4">4</option>
              <option value="5">5 / очень сильно</option>
            </select>
          </label>
        </div>

        <label>
          <span>Ситуация</span>
          <input value={form.situation} onChange={(event) => updateField("situation", event.target.value)} placeholder="Что происходило?" />
        </label>

        <label>
          <span>Мысли</span>
          <textarea value={form.thoughts} onChange={(event) => updateField("thoughts", event.target.value)} placeholder="Какие мысли появились?" rows={3} />
        </label>

        <label>
          <span>Ощущения в теле</span>
          <textarea value={form.body} onChange={(event) => updateField("body", event.target.value)} placeholder="Что чувствует тело?" rows={3} />
        </label>

        <label>
          <span>Действие</span>
          <textarea value={form.action} onChange={(event) => updateField("action", event.target.value)} placeholder="Что сделал, что хочу сделать дальше?" rows={3} />
        </label>

        <label>
          <span>Что помогло</span>
          <textarea value={form.helped} onChange={(event) => updateField("helped", event.target.value)} placeholder="Что уменьшило напряжение или помогло разобраться?" rows={3} />
        </label>

        <div className="button-row">
          <button className="button button-primary" type="submit">Сохранить запись</button>
          <button className="button button-secondary" type="button" onClick={clearEntries} disabled={entries.length === 0}>
            Очистить дневник
          </button>
        </div>
      </form>

      <aside className="journal-log">
        <h3>Последние записи</h3>
        <p className="muted">Данные хранятся только в браузере и не отправляются на сервер.</p>

        {entries.length === 0 ? (
          <div className="empty-state">Пока нет сохранённых записей.</div>
        ) : (
          <ul className="entry-list">
            {entries.map((entry) => (
              <li key={entry.id}>
                <strong>{entry.emotion || "Проверка состояния"}</strong>
                <span>{entry.intensity ? `Интенсивность: ${entry.intensity}/5` : "Интенсивность не указана"}</span>
                <small>{new Date(entry.createdAt).toLocaleString("ru-RU", { dateStyle: "medium", timeStyle: "short" })}</small>
                {entry.situation && <p>{entry.situation}</p>}
              </li>
            ))}
          </ul>
        )}
      </aside>
    </div>
  );
}
