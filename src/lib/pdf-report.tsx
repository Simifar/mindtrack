import {
  Document,
  Page,
  View,
  Text,
  Rect,
  Line,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";
import { decryptSafe } from "./crypto";
import path from "node:path";

Font.register({
  family: "Roboto",
  fonts: [
    { src: path.join(process.cwd(), "public/fonts/Roboto-Regular.ttf"), fontWeight: 400 },
    { src: path.join(process.cwd(), "public/fonts/Roboto-Medium.ttf"), fontWeight: 500 },
    { src: path.join(process.cwd(), "public/fonts/Roboto-Bold.ttf"), fontWeight: 700 },
  ],
});

// ---------- Типы данных отчёта ----------
export interface ReportTestData {
  code: string;
  name: string;
  completedAt: string;
  totalScore: number;
  severity: string;
  label: string;
}

export interface ReportDiaryPoint {
  date: string;
  mood: number;
  sleepHours: number | null;
  energyLevel: number | null;
  notes: string;
  crisisDetected: boolean;
}

export interface ReportData {
  userEmail: string;
  dateFrom: string;
  dateTo: string;
  generatedAt: string;
  sections: string[];
  tests: ReportTestData[];
  diary: ReportDiaryPoint[];
  stats: {
    avgMood: number | null;
    avgSleep: number | null;
    diaryDays: number;
    totalTests: number;
  };
}

// ---------- Стили ----------
const styles = StyleSheet.create({
  page: { padding: 36, fontSize: 10, fontFamily: "Roboto", color: "#1f2937" },
  title: { fontSize: 18, fontWeight: "bold", marginBottom: 2 },
  subtitle: { fontSize: 9, color: "#6b7280", marginBottom: 12 },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "bold",
    marginTop: 14,
    marginBottom: 6,
    paddingBottom: 3,
    borderBottom: "1 solid #e5e7eb",
  },
  disclaimer: {
    fontSize: 8,
    color: "#991b1b",
    backgroundColor: "#fef2f2",
    border: "1 solid #fecaca",
    padding: 8,
    borderRadius: 4,
    marginTop: 8,
  },
  crisisNote: {
    fontSize: 8,
    color: "#7c2d12",
    backgroundColor: "#fff7ed",
    border: "1 solid #fed7aa",
    padding: 6,
    borderRadius: 4,
    marginTop: 4,
  },
  tableHeader: { flexDirection: "row", backgroundColor: "#f3f4f6", padding: 5 },
  tableRow: { flexDirection: "row", padding: 5, borderBottom: "1 solid #e5e7eb" },
  cell: { flex: 1, fontSize: 9 },
  cellSmall: { flex: 0.7, fontSize: 9 },
  statRow: { flexDirection: "row", gap: 10, marginTop: 6 },
  statCard: {
    flex: 1,
    border: "1 solid #e5e7eb",
    borderRadius: 4,
    padding: 8,
  },
  statValue: { fontSize: 16, fontFamily: "Roboto", fontWeight: "bold" },
  statLabel: { fontSize: 8, color: "#6b7280" },
  footer: {
    position: "absolute",
    bottom: 24,
    left: 36,
    right: 36,
    fontSize: 7,
    color: "#9ca3af",
    textAlign: "center",
  },
  chartBox: { marginTop: 6, padding: 6, border: "1 solid #e5e7eb", borderRadius: 4 },
  legend: { flexDirection: "row", gap: 12, marginTop: 4, fontSize: 8 },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 3 },
});

const COLORS = {
  mood: "#10b981",
  sleep: "#6366f1",
  energy: "#f59e0b",
  crisis: "#ef4444",
};

// ---------- Компонент графика ----------
function BarChart({
  data,
  field,
  color,
  max,
  label,
  unit = "",
}: {
  data: ReportDiaryPoint[];
  field: "mood" | "sleepHours" | "energyLevel";
  color: string;
  max: number;
  label: string;
  unit?: string;
}) {
  const chartW = 500;
  const chartH = 70;
  const barGap = data.length > 1 ? chartW / data.length : chartW;
  const barW = Math.max(2, Math.min(14, barGap * 0.7));

  return (
    <View style={{ marginTop: 6 }}>
      <Text style={{ fontSize: 9, fontFamily: "Roboto", fontWeight: "bold", marginBottom: 2 }}>
        {label} {unit ? `(${unit})` : ""}
      </Text>
      <View style={{ position: "relative", height: chartH + 14, width: chartW }}>
        {/* оси */}
        <Line x1={0} y1={chartH} x2={chartW} y2={chartH} style={{ stroke: "#d1d5db", strokeWidth: 0.5 }} />
        <Line x1={0} y1={0} x2={0} y2={chartH} style={{ stroke: "#d1d5db", strokeWidth: 0.5 }} />
        {/* бары */}
        {data.map((d, i) => {
          const v = d[field];
          if (v === null || v === undefined) return null;
          const h = Math.max(1, (v / max) * chartH);
          const x = i * barGap + (barGap - barW) / 2;
          return (
            <Rect
              key={i}
              x={x}
              y={chartH - h}
              width={barW}
              height={h}
              fill={color}
              opacity={d.crisisDetected ? 0.9 : 0.7}
            />
          );
        })}
      </View>
    </View>
  );
}

// ---------- Документ ----------
export function buildReportDocument(data: ReportData) {
  const dateFrom = new Date(data.dateFrom).toLocaleDateString("ru-RU");
  const dateTo = new Date(data.dateTo).toLocaleDateString("ru-RU");
  const generated = new Date(data.generatedAt).toLocaleString("ru-RU");

  return (
    <Document
      title={`MindTrack отчёт ${data.userEmail}`}
      author="MindTrack"
      subject="Отчёт self-tracker (не медицинский документ)"
    >
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>MindTrack — отчёт самонаблюдения</Text>
        <Text style={styles.subtitle}>
          Пользователь: {data.userEmail} · Период: {dateFrom} — {dateTo} · Сформирован: {generated}
        </Text>

        <View style={styles.disclaimer}>
          <Text>
            ВНИМАНИЕ: данный отчёт сформирован пользователем самостоятельно и НЕ является
            медицинским диагнозом. MindTrack не ставит диагнозы и не заменяет консультацию
            специалиста. Интерпретация результатов — предварительная и должна обсуждаться с
            лечащим врачом / психотерапевтом.
          </Text>
        </View>

        {data.sections.includes("summary") && (
          <>
            <Text style={styles.sectionTitle}>Сводка за период</Text>
            <View style={styles.statRow}>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{data.stats.avgMood ?? "—"}</Text>
                <Text style={styles.statLabel}>Среднее настроение (0–10)</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{data.stats.avgSleep ?? "—"}</Text>
                <Text style={styles.statLabel}>Средний сон (часов)</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{data.stats.diaryDays}</Text>
                <Text style={styles.statLabel}>Дней с записями</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{data.stats.totalTests}</Text>
                <Text style={styles.statLabel}>Пройдено тестов</Text>
              </View>
            </View>
          </>
        )}

        {data.sections.includes("tests") && (
          <>
            <Text style={styles.sectionTitle}>Результаты тестов</Text>
            <View style={styles.tableHeader}>
              <Text style={styles.cell}>Тест</Text>
              <Text style={styles.cellSmall}>Дата</Text>
              <Text style={styles.cellSmall}>Балл</Text>
              <Text style={styles.cell}>Интерпретация</Text>
            </View>
            {data.tests.length === 0 ? (
              <Text style={{ fontSize: 9, color: "#6b7280", padding: 5 }}>
                За период нет пройденных тестов.
              </Text>
            ) : (
              data.tests.map((t, i) => (
                <View key={i} style={styles.tableRow} wrap={false}>
                  <Text style={styles.cell}>
                    {t.name} ({t.code})
                  </Text>
                  <Text style={styles.cellSmall}>
                    {new Date(t.completedAt).toLocaleDateString("ru-RU")}
                  </Text>
                  <Text style={styles.cellSmall}>{t.totalScore}</Text>
                  <Text style={styles.cell}>{t.label}</Text>
                </View>
              ))
            )}
          </>
        )}

        {data.sections.includes("diary") && (
          <>
            <Text style={styles.sectionTitle}>Дневник настроения (записи)</Text>
            {data.diary.length === 0 ? (
              <Text style={{ fontSize: 9, color: "#6b7280", padding: 5 }}>
                За период нет записей дневника.
              </Text>
            ) : (
              <View style={styles.tableHeader}>
                <Text style={styles.cellSmall}>Дата</Text>
                <Text style={styles.cellSmall}>Настроение</Text>
                <Text style={styles.cellSmall}>Сон</Text>
                <Text style={styles.cellSmall}>Энергия</Text>
                <Text style={styles.cell}>Заметка</Text>
              </View>
            )}
            {data.diary.map((d, i) => (
              <View key={i} style={styles.tableRow} wrap={false}>
                <Text style={styles.cellSmall}>
                  {new Date(d.date).toLocaleDateString("ru-RU")}
                </Text>
                <Text style={styles.cellSmall}>{d.mood}/10</Text>
                <Text style={styles.cellSmall}>
                  {d.sleepHours !== null ? `${d.sleepHours}ч` : "—"}
                </Text>
                <Text style={styles.cellSmall}>
                  {d.energyLevel !== null ? `${d.energyLevel}/10` : "—"}
                </Text>
                <Text style={styles.cell}>
                  {d.notes.length > 80 ? d.notes.slice(0, 80) + "…" : d.notes || "—"}
                </Text>
              </View>
            ))}
          </>
        )}

        {data.sections.includes("charts") && data.diary.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Графики метрик</Text>
            <View style={styles.chartBox}>
              <BarChart
                data={data.diary}
                field="mood"
                color={COLORS.mood}
                max={10}
                label="Настроение"
                unit="0–10"
              />
              <BarChart
                data={data.diary}
                field="sleepHours"
                color={COLORS.sleep}
                max={12}
                label="Сон"
                unit="часы"
              />
              <BarChart
                data={data.diary}
                field="energyLevel"
                color={COLORS.energy}
                max={10}
                label="Энергия"
                unit="0–10"
              />
              <View style={styles.legend}>
                <View style={styles.legendItem}>
                  <Rect x={0} y={0} width={8} height={8} fill={COLORS.mood} />
                  <Text>Настроение</Text>
                </View>
                <View style={styles.legendItem}>
                  <Rect x={0} y={0} width={8} height={8} fill={COLORS.sleep} />
                  <Text>Сон</Text>
                </View>
                <View style={styles.legendItem}>
                  <Rect x={0} y={0} width={8} height={8} fill={COLORS.energy} />
                  <Text>Энергия</Text>
                </View>
              </View>
            </View>
          </>
        )}

        {/* Флаг кризисных записей — для внимания врача */}
        {data.diary.some((d) => d.crisisDetected) && (
          <View style={styles.crisisNote}>
            <Text>
              В отчёте присутствуют записи, в которых пользователь упоминал тяжёлые
              переживания. Психотерапевту рекомендуется обсудить эти эпизоды отдельно.
            </Text>
          </View>
        )}

        <Text style={styles.footer} fixed>
          MindTrack · self-tracker психического состояния · не медицинское ПО · отчёт создан
          пользователем по собственной инициативе · стр. {"${pageNumber} / ${totalPages}"}
        </Text>
      </Page>
    </Document>
  );
}

/** Собирает ReportData из БД-записей (с расшифровкой notes). */
export function buildReportData(opts: {
  userEmail: string;
  dateFrom: Date;
  dateTo: Date;
  sections: string[];
  tests: {
    testDefinition: { code: string; name: string };
    completedAt: Date;
    totalScore: number;
    interpretedSeverity: string;
    interpretedLabel: string;
  }[];
  diary: {
    date: Date;
    mood: number;
    sleepHours: number | null;
    energyLevel: number | null;
    notesCipher: string;
    crisisDetected: boolean;
  }[];
}): ReportData {
  const diaryPoints: ReportDiaryPoint[] = opts.diary.map((d) => ({
    date: d.date.toISOString(),
    mood: d.mood,
    sleepHours: d.sleepHours,
    energyLevel: d.energyLevel,
    notes: d.notesCipher ? decryptSafe(d.notesCipher) : "",
    crisisDetected: d.crisisDetected,
  }));
  const avgMood = diaryPoints.length
    ? Math.round((diaryPoints.reduce((s, x) => s + x.mood, 0) / diaryPoints.length) * 10) / 10
    : null;
  const avgSleep = diaryPoints.length
    ? Math.round(
        (diaryPoints.reduce((s, x) => s + (x.sleepHours ?? 0), 0) / diaryPoints.length) * 10
      ) / 10
    : null;

  return {
    userEmail: opts.userEmail,
    dateFrom: opts.dateFrom.toISOString(),
    dateTo: opts.dateTo.toISOString(),
    generatedAt: new Date().toISOString(),
    sections: opts.sections,
    tests: opts.tests.map((t) => ({
      code: t.testDefinition.code,
      name: t.testDefinition.name,
      completedAt: t.completedAt.toISOString(),
      totalScore: t.totalScore,
      severity: t.interpretedSeverity,
      label: t.interpretedLabel,
    })),
    diary: diaryPoints,
    stats: {
      avgMood,
      avgSleep,
      diaryDays: diaryPoints.length,
      totalTests: opts.tests.length,
    },
  };
}
