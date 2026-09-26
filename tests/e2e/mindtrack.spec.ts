import { expect, test, type Download, type Page } from "@playwright/test";
import path from "node:path";
import { readFile } from "node:fs/promises";

const resultFixture = path.resolve(process.cwd(), "tests/fixtures/valid-result.json");
const routePaths = ["/", "/tests", "/tests/phq-9", "/tests/phq-9/run", "/results", "/diary", "/visit", "/about", "/help", "/privacy"];

async function gotoPath(page: Page, route: string) {
  await page.goto(route === "/" ? "./" : `.${route}`);
}

async function downloadedText(download: Download) {
  const filePath = await download.path();
  if (!filePath) throw new Error("Download path was not available");
  return readFile(filePath, "utf8");
}

test.describe("MindTrack critical browser flows", () => {
  test("direct routes render without a not-found or application error", async ({ page }) => {
    for (const route of routePaths) {
      await gotoPath(page, route);
      await expect(page.locator("body")).not.toContainText("Application error");
      await expect(page.locator("body")).not.toContainText("This page could not be found");
      await expect(page.getByRole("link", { name: "Тесты", exact: true }).first()).toBeVisible();
    }
  });

  test("draft survives navigation and reload", async ({ page }) => {
    await gotoPath(page, "/tests/phq-9/run");
    await expect(page.getByText(/1\s*\/\s*9/)).toBeVisible();
    await page.getByRole("radio").first().click();
    await page.getByRole("button", { name: "Далее", exact: true }).click();
    await expect(page.getByText(/2\s*\/\s*9/)).toBeVisible();

    await page.reload();
    await expect(page.getByText(/2\s*\/\s*9/)).toBeVisible();
    await page.getByRole("button", { name: "Назад", exact: true }).click();
    await expect(page.getByRole("radio").first()).toHaveAttribute("aria-checked", "true");
  });

  test("completing a test produces a result", async ({ page }) => {
    await gotoPath(page, "/tests/phq-9/run");
    for (let index = 0; index < 9; index += 1) {
      await page.getByRole("radio").first().click();
      if (index < 8) {
        const nextButton = page.getByRole("button", { name: "Далее", exact: true });
        await expect(nextButton).toBeEnabled();
        await nextButton.click();
      } else {
        const finishButton = page.getByRole("button", { name: "Завершить", exact: true });
        await expect(finishButton).toBeEnabled();
        await finishButton.click();
      }
    }
    await expect(page).toHaveURL(/\/tests\/phq-9\/run\/?$/);
    await expect(page.getByText("Результат сохранён в вашем браузере.", { exact: false })).toBeVisible();
    await expect(page.getByText("PHQ-9 — шкала депрессии", { exact: true })).toBeVisible();
  });

  test("all seven questionnaires can be completed and saved", async ({ page }) => {
    const flows = [
      ["phq-9", "PHQ-9 — шкала депрессии", 9],
      ["gad-7", "GAD-7 — шкала тревожности", 7],
      ["mdq", "MDQ — скрининг биполярного спектра", 15],
      ["asrs", "ASRS-v1.1 — скрининг СДВГ у взрослых", 6],
      ["pss-10", "PSS-10 — шкала воспринимаемого стресса", 10],
      ["isi", "ISI — индекс тяжести бессонницы", 7],
      ["who-5", "WHO-5 — индекс благополучия", 5],
    ] as const;

    for (const [slug, title, questionCount] of flows) {
      await gotoPath(page, `/tests/${slug}/run`);
      for (let index = 0; index < questionCount; index += 1) {
        await page.getByRole("radio").first().click();
        const action = page.getByRole("button", { name: index === questionCount - 1 ? "Завершить" : "Далее", exact: true });
        await expect(action).toBeEnabled();
        await action.click();
      }
      await expect(page.getByText(title, { exact: true })).toBeVisible();
      await expect(page.getByText("Результат сохранён в вашем браузере.", { exact: false })).toBeVisible();
    }
  });

  test("incomplete imported answers are never shown as a score", async ({ page }) => {
    await gotoPath(page, "/results");
    const partial = {
      source: "MindTrack",
      version: 2,
      results: [{
        id: "partial-e2e",
        code: "PHQ9",
        testName: "PHQ-9 — шкала депрессии",
        dateISO: "2026-09-26T10:00:00.000Z",
        totalScore: 2,
        maxScore: 27,
        severity: "none",
        label: "Минимум / нет симптоматики",
        advice: "Продолжайте наблюдение в обычном режиме.",
        crisisDetected: false,
        answers: { 0: 2 },
      }],
    };
    await page.locator('input[type="file"]').setInputFiles({
      name: "partial.json",
      mimeType: "application/json",
      buffer: Buffer.from(JSON.stringify(partial)),
    });

    await expect(page.getByText("PHQ-9 — шкала депрессии", { exact: true }).first()).toBeVisible();
    await expect(page.getByText(/Неполный результат.*1 из 9 ответов/).first()).toBeVisible();
    await expect(page.getByText("Минимум / нет симптоматики", { exact: true })).toHaveCount(0);
    await expect(page.getByText(/2 из 27|2 \/ 27/)).toHaveCount(0);
  });

  test("diary and visit drafts survive reload and can be discarded", async ({ page }) => {
    await gotoPath(page, "/diary");
    await expect(page.getByLabel("Комментарий", { exact: true })).toBeEnabled();
    await page.getByLabel("Комментарий", { exact: true }).fill("unfinished diary draft");
    await expect.poll(() => page.evaluate(() => localStorage.getItem("mindtrack.diary-draft.v1"))).toContain("unfinished diary draft");
    await page.reload();
    const diaryNotes = page.locator('textarea[placeholder="Дополнительные детали для обсуждения с врачом"]');
    await expect(diaryNotes).toBeEnabled({ timeout: 10_000 });
    await expect(diaryNotes).toHaveValue("unfinished diary draft", { timeout: 10_000 });
    page.once("dialog", (dialog) => dialog.accept());
    await page.getByRole("button", { name: "Удалить черновик", exact: true }).click();
    await expect(page.getByLabel("Комментарий", { exact: true })).toHaveValue("");

    await gotoPath(page, "/visit");
    const priorityField = page.locator("label").filter({ hasText: "Что сейчас беспокоит сильнее всего" }).locator("textarea");
    await expect(priorityField).toBeEnabled();
    await priorityField.fill("unfinished appointment draft");
    await expect.poll(() => page.evaluate(() => localStorage.getItem("mindtrack.visit-prep-draft.v1"))).toContain("unfinished appointment draft");
    await page.reload();
    await expect(priorityField).toBeEnabled({ timeout: 10_000 });
    await expect(priorityField).toHaveValue("unfinished appointment draft", { timeout: 10_000 });
    page.once("dialog", (dialog) => dialog.accept());
    await page.getByRole("button", { name: "Удалить черновик", exact: true }).click();
    await expect(priorityField).toHaveValue("");
  });

  test("diary and appointment print actions do not print editing controls", async ({ page }) => {
    for (const route of ["/diary", "/visit"] as const) {
      await gotoPath(page, route);
      await page.emulateMedia({ media: "print" });
      await expect(page.getByRole("button", { name: "Печать", exact: true })).toBeHidden();
      await expect(page.locator("main")).toBeVisible();
      await page.emulateMedia({ media: "screen" });
    }
  });

  test("privacy page clears MindTrack data but leaves unrelated site storage", async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem("mindtrack:results:v2", "[]");
      localStorage.setItem("mindtrack:draft:v1:PHQ9", "draft");
      localStorage.setItem("mindtrack.diary-draft.v1", "draft");
      localStorage.setItem("another-app:data", "keep");
    });
    await gotoPath(page, "/privacy");
    page.once("dialog", (dialog) => dialog.accept());
    await page.getByRole("button", { name: "Удалить все данные MindTrack", exact: true }).click();
    await expect(page.getByText("Данные MindTrack удалены из этого браузера", { exact: true })).toBeVisible();
    const values = await page.evaluate(() => ({
      results: localStorage.getItem("mindtrack:results:v2"),
      testDraft: localStorage.getItem("mindtrack:draft:v1:PHQ9"),
      diaryDraft: localStorage.getItem("mindtrack.diary-draft.v1"),
      otherApp: localStorage.getItem("another-app:data"),
    }));
    expect(values).toEqual({ results: null, testDraft: null, diaryDraft: null, otherApp: "keep" });
  });

  test("results import, export and clear confirmation work", async ({ page }) => {
    await gotoPath(page, "/results");
    await page.locator('input[type="file"]').setInputFiles(resultFixture);
    await expect(page.getByText("Импортировано результатов: 1", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("PHQ-9 — шкала депрессии", { exact: true }).first()).toBeVisible();

    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: "Экспорт JSON", exact: true }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/mindtrack-results-.*\.json/);

    let confirmation = "";
    page.once("dialog", async (dialog) => {
      confirmation = dialog.message();
      await dialog.dismiss();
    });
    await page.getByRole("button", { name: "Очистить всё", exact: true }).click();
    expect(confirmation).toContain("Удалить всю историю результатов");
    await expect(page.getByText("PHQ-9 — шкала депрессии", { exact: true }).first()).toBeVisible();

    await page.getByRole("button", { name: "Удалить результат", exact: true }).click();
    await expect(page.getByText("PHQ-9 — шкала депрессии", { exact: true })).toHaveCount(0);
  });

  test("diary and visit preparation persist through their UI", async ({ page }) => {
    await gotoPath(page, "/diary");
    await page.getByLabel("Комментарий", { exact: true }).fill("e2e smoke note");
    await page.getByRole("button", { name: "Сохранить запись", exact: true }).click();
    await expect(page.getByText("Запись сохранена", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("e2e smoke note", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Удалить", exact: true }).click();
    await expect(page.getByText("e2e smoke note", { exact: true })).toHaveCount(0);

    await gotoPath(page, "/visit");
    const safetyField = page.locator("label").filter({ hasText: "Мысли о смерти, самоповреждении или безопасности" }).locator("textarea");
    await safetyField.fill("Я не хочу жить");
    await expect(safetyField).toHaveValue("Я не хочу жить");
    const saveButton = page.getByRole("button", { name: "Сохранить", exact: true });
    await page.setViewportSize({ width: 390, height: 844 });
    await saveButton.click();
    await expect(page.getByText("Сводка сохранена", { exact: true }).first()).toBeVisible();
    const dialog = page.getByRole("dialog", { name: "Если вам тяжело — вы не одни" });
    await expect(dialog).toBeVisible({ timeout: 10_000 });
    await expect(dialog).toHaveAttribute("aria-describedby", "crisis-dialog-description");
    await expect(dialog.getByRole("button", { name: "Закрыть", exact: true })).toBeFocused();
    const lastContact = dialog.getByRole("link").last();
    await page.keyboard.press("Shift+Tab");
    await expect(lastContact).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(dialog.getByRole("button", { name: "Закрыть", exact: true })).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(saveButton).toBeFocused();
    page.once("dialog", (confirm) => confirm.accept());
    await page.getByRole("button", { name: "Удалить сводку", exact: true }).click();
    await expect(safetyField).toHaveValue("");
  });

  test("PHQ-9 safety response offers support and the modal returns focus", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await gotoPath(page, "/tests/phq-9/run");
    for (let index = 0; index < 8; index += 1) {
      await page.getByRole("radio").first().click();
      await page.getByRole("button", { name: "Далее", exact: true }).click();
    }
    const safetyAnswer = page.getByRole("radio").nth(1);
    await safetyAnswer.click();
    const dialog = page.getByRole("dialog", { name: "Если вам тяжело — вы не одни" });
    await expect(dialog).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(safetyAnswer).toBeFocused();
  });

  test("narrative text about another person does not open a crisis modal", async ({ page }) => {
    await gotoPath(page, "/visit");
    await page.locator("label").filter({ hasText: "Мысли о смерти, самоповреждении или безопасности" }).locator("textarea")
      .fill("Мой родственник когда-то говорил, что не хочет жить");
    await page.getByRole("button", { name: "Сохранить", exact: true }).click();
    await expect(page.getByText("Сводка сохранена", { exact: true }).first()).toBeVisible();
    await expect(page.getByRole("dialog")).toHaveCount(0);
  });

  test("appointment export includes diary notes only after an explicit choice", async ({ page }) => {
    await gotoPath(page, "/diary");
    await page.getByLabel("Комментарий", { exact: true }).fill("private diary note");
    await page.getByRole("button", { name: "Сохранить запись", exact: true }).click();
    await expect(page.getByText("Запись сохранена", { exact: true }).first()).toBeVisible();

    await gotoPath(page, "/visit");
    const firstDownload = page.waitForEvent("download");
    await page.getByRole("button", { name: "Скачать сводку", exact: true }).click();
    const omitted = await downloadedText(await firstDownload);
    expect(omitted).not.toContain("private diary note");

    await page.locator("label").filter({ hasText: "Добавить последние записи дневника в файл" }).locator('input[type="checkbox"]').check();
    const secondDownload = page.waitForEvent("download");
    await page.getByRole("button", { name: "Скачать сводку", exact: true }).click();
    const included = await downloadedText(await secondDownload);
    expect(included).toContain("private diary note");
  });

  test("mobile navigation stays inside the viewport", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await gotoPath(page, "/tests");
    await expect(page.getByRole("heading", { name: "Каталог тестов" })).toBeVisible();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    expect(overflow).toBe(false);
    await page.getByRole("link", { name: "Дневник", exact: true }).click();
    await expect(page).toHaveURL(/\/diary\/?$/);
    await expect(page.getByRole("heading", { name: "Дневник состояния" })).toBeVisible();
  });

  test("browser back and forward follow static route links", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await gotoPath(page, "/tests");
    await page.getByRole("link", { name: "Дневник", exact: true }).first().click();
    await expect(page).toHaveURL(/\/diary\/?$/);
    await page.goBack();
    await expect(page).toHaveURL(/\/tests\/?$/);
    await page.goForward();
    await expect(page).toHaveURL(/\/diary\/?$/);
  });

  test("diary, visit draft, and results views update after another tab changes local storage", async ({ page, context }) => {
    const secondPage = await context.newPage();

    await gotoPath(page, "/diary");
    await gotoPath(secondPage, "/diary");
    await expect(page.getByLabel("Комментарий", { exact: true })).toBeEnabled();
    await expect(secondPage.getByLabel("Комментарий", { exact: true })).toBeEnabled();
    await secondPage.getByLabel("Комментарий", { exact: true }).fill("second tab diary draft");
    await expect.poll(() => secondPage.evaluate(() => localStorage.getItem("mindtrack.diary-draft.v1"))).toContain("second tab diary draft");
    const firstTabDiaryNote = page.locator('textarea[placeholder="Дополнительные детали для обсуждения с врачом"]');
    await expect(firstTabDiaryNote).toHaveValue("second tab diary draft", { timeout: 10_000 });

    await gotoPath(page, "/visit");
    await gotoPath(secondPage, "/visit");
    const localPriority = page.locator("label").filter({ hasText: "Что сейчас беспокоит сильнее всего" }).locator("textarea");
    const remotePriority = secondPage.locator("label").filter({ hasText: "Что сейчас беспокоит сильнее всего" }).locator("textarea");
    await expect(localPriority).toBeEnabled();
    await expect(remotePriority).toBeEnabled();
    await remotePriority.fill("second tab visit draft");
    await expect.poll(() => secondPage.evaluate(() => localStorage.getItem("mindtrack.visit-prep-draft.v1"))).toContain("second tab visit draft");
    await expect(localPriority).toHaveValue("second tab visit draft", { timeout: 10_000 });

    await gotoPath(page, "/results");
    await gotoPath(secondPage, "/tests/phq-9/run");
    for (let index = 0; index < 9; index += 1) {
      await secondPage.getByRole("radio").first().click();
      await secondPage.getByRole("button", { name: index === 8 ? "Завершить" : "Далее", exact: true }).click();
    }
    await expect(page.getByText("PHQ-9 — шкала депрессии", { exact: true }).first()).toBeVisible();
    await secondPage.close();
  });

  test("floating bottom navigation is accessible and keeps the page content clear", async ({ page }, testInfo) => {
    const basePath = new URL(testInfo.project.use.baseURL || "http://127.0.0.1/").pathname.replace(/\/$/, "");
    const viewports = [
      { width: 320, height: 700, showBottomNavigation: true },
      { width: 390, height: 844, showBottomNavigation: true },
      { width: 768, height: 900, showBottomNavigation: true },
      { width: 1280, height: 900, showBottomNavigation: false },
    ];

    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      await gotoPath(page, "/results");

      const navigation = page.getByRole("navigation", { name: "Основная навигация" });
      if (viewport.showBottomNavigation) {
        await expect(navigation).toBeVisible();
      } else {
        await expect(navigation).toBeHidden();
        continue;
      }
      await expect(navigation.locator('[aria-current="page"]')).toHaveText("Результаты");

      const geometry = await navigation.evaluate((element) => {
        const rect = element.getBoundingClientRect();
        const style = getComputedStyle(element);
        return {
          position: style.position,
          bottom: Number.parseFloat(style.bottom),
          borderRadius: style.borderRadius,
          boxShadow: style.boxShadow,
          backdropFilter: style.backdropFilter,
          left: rect.left,
          right: rect.right,
          width: rect.width,
          viewportWidth: window.innerWidth,
        };
      });

      expect(geometry.position).toBe("fixed");
      expect(geometry.bottom).toBeGreaterThanOrEqual(12);
      expect(geometry.borderRadius).not.toBe("0px");
      expect(geometry.boxShadow).not.toBe("none");
      expect(geometry.backdropFilter).toContain("blur");
      expect(geometry.left).toBeGreaterThan(0);
      expect(geometry.right).toBeLessThan(geometry.viewportWidth);
      expect(geometry.width).toBeLessThan(geometry.viewportWidth);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);

      const tabs = navigation.getByRole("link");
      await expect(tabs).toHaveCount(5);
      for (const tab of await tabs.all()) {
        const tabGeometry = await tab.evaluate((element) => {
          const rect = element.getBoundingClientRect();
          const style = getComputedStyle(element);
          return {
            height: rect.height,
            left: rect.left,
            right: rect.right,
            navLeft: element.parentElement?.parentElement?.getBoundingClientRect().left ?? 0,
            navRight: element.parentElement?.parentElement?.getBoundingClientRect().right ?? 0,
            minHeight: Number.parseFloat(style.minHeight),
          };
        });
        expect(tabGeometry.height).toBeGreaterThanOrEqual(44);
        expect(tabGeometry.minHeight).toBeGreaterThanOrEqual(44);
        expect(tabGeometry.left).toBeGreaterThanOrEqual(tabGeometry.navLeft);
        expect(tabGeometry.right).toBeLessThanOrEqual(tabGeometry.navRight);

        const labelGeometry = await tab.locator("span").evaluate((element) => {
          const range = document.createRange();
          range.selectNodeContents(element);
          const lineRects = Array.from(range.getClientRects());
          const labelRect = element.getBoundingClientRect();
          return {
            lineCount: lineRects.length,
            labelWidth: labelRect.width,
            labelRight: labelRect.right,
            tabRight: element.parentElement?.getBoundingClientRect().right ?? 0,
          };
        });
        expect(labelGeometry.lineCount).toBe(1);
        expect(labelGeometry.labelRight).toBeLessThanOrEqual(labelGeometry.tabRight + 1);
      }
    }

    await page.setViewportSize({ width: 390, height: 844 });
    const routes = [
      ["Тесты", "/tests"],
      ["Дневник", "/diary"],
      ["К врачу", "/visit"],
      ["Результаты", "/results"],
      ["Методики", "/about"],
    ] as const;

    for (const [label, route] of routes) {
      await gotoPath(page, "/results");
      await expect(
        page.getByRole("navigation", { name: "Основная навигация" }).getByRole("link", { name: label, exact: true }),
      ).toHaveAttribute("href", `${basePath}${route}`);
    }

    await gotoPath(page, "/diary");
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    const contentVisibility = await page.evaluate(() => {
      const navigation = document.querySelector('nav[aria-label="Основная навигация"]');
      const footer = document.querySelector("footer");
      if (!navigation || !footer) return null;
      return {
        navigationTop: navigation.getBoundingClientRect().top,
        footerBottom: footer.getBoundingClientRect().bottom,
      };
    });
    expect(contentVisibility).not.toBeNull();
    expect(contentVisibility?.footerBottom).toBeLessThanOrEqual((contentVisibility?.navigationTop ?? 0) + 1);

    const activeTab = page.getByRole("navigation", { name: "Основная навигация" }).getByRole("link", { name: "Дневник", exact: true });
    await activeTab.focus();
    await expect(activeTab).toBeFocused();
    expect(await activeTab.evaluate((element) => {
      const style = getComputedStyle(element);
      return style.outlineStyle !== "none" || style.boxShadow !== "none";
    })).toBe(true);

    await page.emulateMedia({ media: "print" });
    await expect(page.getByRole("navigation", { name: "Основная навигация" })).toBeHidden();
  });

  test("homepage exposes basic Web Vitals timing", async ({ page }) => {
    await gotoPath(page, "/");
    await expect(page.getByRole("heading", { name: "Каталог тестов" })).toBeVisible();
    const metrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
      const lcp = performance.getEntriesByType("largest-contentful-paint").at(-1)?.startTime ?? null;
      const cls = performance
        .getEntriesByType("layout-shift")
        .reduce((sum, entry) => sum + ((entry as PerformanceEntry & { value?: number }).value || 0), 0);
      return { domContentLoaded: navigation?.domContentLoadedEventEnd || 0, lcp, cls };
    });
    test.info().annotations.push({ type: "web-vitals", description: JSON.stringify(metrics) });
    expect(metrics.domContentLoaded).toBeLessThan(10_000);
    if (metrics.lcp !== null) expect(metrics.lcp).toBeLessThan(10_000);
    expect(metrics.cls).toBeLessThan(0.25);
  });

  test("base path remains part of direct URLs when configured", async ({ page }, testInfo) => {
    const basePath = new URL(testInfo.project.use.baseURL || "http://127.0.0.1/").pathname.replace(/\/$/, "");
    test.skip(!basePath, "base-path smoke is enabled in the CI job");
    await gotoPath(page, "/tests/phq-9");
    await expect(page).toHaveURL(new RegExp(`${basePath.replaceAll("/", "\\/")}\\/tests\\/phq-9\\/?$`));
    await expect(page.getByRole("button", { name: "Начать тест", exact: true })).toBeVisible();
  });
});
