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
    await page.getByRole("link", { name: "Дневник", exact: true }).click();
    await expect(page).toHaveURL(/\/diary\/?$/);
    await expect(page.getByRole("heading", { name: "Дневник состояния" })).toBeVisible();
  });

  test("floating bottom navigation is accessible and keeps the page content clear", async ({ page }, testInfo) => {
    const basePath = new URL(testInfo.project.use.baseURL || "http://127.0.0.1/").pathname.replace(/\/$/, "");
    const viewports = [
      { width: 320, height: 700, showBottomNavigation: true },
      { width: 390, height: 844, showBottomNavigation: true },
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
