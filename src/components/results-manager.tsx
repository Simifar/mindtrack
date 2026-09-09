"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import type { Scale, TestResult } from "@/data/types";
import { createResult, parseImportedResults } from "@/lib/results";

const STORAGE_KEY = "mindtrack:test-results";

function readResults(): TestResult[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function ResultsManager({ scales, initialScaleId }: { scales: Scale[]; initialScaleId?: string }) {
  const searchParams = useSearchParams();
  const requestedScaleId = searchParams.get("test") ?? initialScaleId;
  const [results, setResults] = useState<TestResult[]>(readResults);
  const [message, setMessage] = useState("");
  const [scaleId, setScaleId] = useState(requestedScaleId && scales.some((scale) => scale.id === requestedScaleId) ? requestedScaleId : scales[0]?.id ?? "");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [score, setScore] = useState("");
  const [note, setNote] = useState("");

  function save(next: TestResult[]) {
    setResults(next);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }

  function addManualResult(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      save([createResult({ scaleId, date, score, note }), ...results]);
      setScore(""); setNote(""); setMessage("Результат сохранён на этом устройстве.");
    } catch {
      setMessage("Укажите дату и число баллов.");
    }
  }

  async function importFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const imported = parseImportedResults(await file.text()).map((item) => createResult(item));
      if (!imported.length) throw new Error("Файл не содержит строк с результатами.");
      save([...imported, ...results]);
      setMessage(`Импортировано результатов: ${imported.length}.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Не удалось прочитать файл.");
    } finally {
      event.target.value = "";
    }
  }

  function scaleTitle(id: string) {
    return scales.find((scale) => scale.id === id)?.title ?? id;
  }

  return (
    <div className="results-layout">
      <div>
        <div className="prose-block import-box">
          <h2>Импорт из файла</h2>
          <p>Поддерживаются JSON и CSV. В каждой записи нужны поля <code>scaleId</code>, <code>date</code> и <code>score</code>; поле <code>note</code> необязательно.</p>
          <label className="button button-primary file-button">Выбрать JSON или CSV<input type="file" accept=".json,.csv,application/json,text/csv" onChange={importFile} /></label>
          <p className="muted">Пример JSON: <code>{`[{"scaleId":"scale-phq9","date":"2026-09-09","score":8}]`}</code></p>
        </div>
        <form className="journal-form" onSubmit={addManualResult}>
          <h2>Добавить вручную</h2>
          <div className="field-grid">
            <label>Тест<select value={scaleId} onChange={(event) => setScaleId(event.target.value)}>{scales.map((scale) => <option key={scale.id} value={scale.id}>{scale.title}</option>)}</select></label>
            <label>Дата<input type="date" value={date} onChange={(event) => setDate(event.target.value)} required /></label>
          </div>
          <label>Баллы<input type="number" min="0" step="any" value={score} onChange={(event) => setScore(event.target.value)} required /></label>
          <label>Заметка (необязательно)<textarea value={note} onChange={(event) => setNote(event.target.value)} maxLength={500} /></label>
          <button className="button button-secondary" type="submit">Сохранить результат</button>
        </form>
        {message && <p className="result-line" role="status">{message}</p>}
      </div>
      <section className="journal-log">
        <div className="section-heading"><h2>Мои результаты</h2>{results.length > 0 && <button className="text-link" type="button" onClick={() => save([])}>Очистить</button>}</div>
        {results.length === 0 ? <div className="empty-state">Результаты появятся здесь после импорта или ручного добавления.</div> : <ul className="entry-list">{results.map((result) => <li key={result.id}><strong>{scaleTitle(result.scaleId)} — {result.score} баллов</strong><small>{result.date}</small>{result.note && <p>{result.note}</p>}<button className="text-link" type="button" onClick={() => save(results.filter((item) => item.id !== result.id))}>Удалить</button></li>)}</ul>}
      </section>
    </div>
  );
}
