import { expect, test, type Page } from "@playwright/test";
import path from "node:path";

const resultFixture = path.resolve(process.cwd(), "tests/fixtures/valid-result.json");
const routePaths = ["/", "/tests", "/tests/phq-9", "/tests/phq-9/run", "/results", "/diary", "/visit", "/about", "/help", "/privacy"];

async function gotoPath(page: Page, route: string) {
  await page.goto(route === "/" ? "./" : `.${route}`);
}

test.describe("MindTrack critical browser flows", () => {
  test("direct routes render without a not-found or application error", async ({ page }) => {
    for (const route of routePaths) {
      await gotoPath(page, route);
      await expect(page.locator("body")).not.toContainText("Application error");
      await expect(page.locator("body")).not.toContainText("This page could not be found");
      await expect(page.getByRole("button", { name: "Тесты", exact: true }).first()).toBeVisible();
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
  });

  test("diary and visit preparation persist through their UI", async ({ page }) => {
    await gotoPath(page, "/diary");
    await page.getByLabel("Комментарий", { exact: true }).fill("e2e smoke note");
    await page.getByRole("button", { name: "Сохранить запись", exact: true }).click();
    await expect(page.getByText("Запись сохранена", { exact: true }).first()).toBeVisible();
    await expect(page.getByRole("paragraph").filter({ hasText: "e2e smoke note" })).toBeVisible();

    await gotoPath(page, "/visit");
    const safetyField = page.locator("label").filter({ hasText: "Мысли о смерти, самоповреждении или безопасности" }).locator("textarea");
    await safetyField.fill("есть мысли о смерти");
    await expect(safetyField).toHaveValue("есть мысли о смерти");
    await page.getByRole("button", { name: "Сохранить", exact: true }).click();
    await expect(page.getByText("Сводка сохранена", { exact: true }).first()).toBeVisible();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible({ timeout: 10_000 });
    await expect(dialog.getByRole("button", { name: "Закрыть", exact: true })).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
  });

  test("mobile navigation stays inside the viewport", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await gotoPath(page, "/tests");
    await expect(page.getByRole("heading", { name: "Каталог тестов" })).toBeVisible();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    expect(overflow).toBe(false);
    await page.getByRole("button", { name: "Дневник", exact: true }).last().click();
    await expect(page).toHaveURL(/\/diary\/?$/);
    await expect(page.getByRole("heading", { name: "Дневник состояния" })).toBeVisible();
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
