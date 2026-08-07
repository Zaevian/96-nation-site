import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

function formatViolations(
  violations: { id: string; impact?: string | null; help: string; nodes: { length: number }[] }[],
) {
  if (violations.length === 0) return "clean";
  return violations
    .map(
      (v) =>
        `[${v.impact ?? "unknown"}] ${v.id}: ${v.help} (${v.nodes.length} node(s))`,
    )
    .join("\n");
}

test.describe("accessibility smoke", () => {
  async function expectNoSeriousAxeViolations(
    page: import("@playwright/test").Page,
  ) {
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
      .analyze();

    // Hard gate: serious + critical. Full list is always in the failure message.
    const serious = results.violations.filter(
      (v) => v.impact === "serious" || v.impact === "critical",
    );

    expect(
      serious,
      [
        "Serious/critical violations:",
        formatViolations(serious),
        "",
        "All violations (including moderate/minor):",
        formatViolations(results.violations),
      ].join("\n"),
    ).toEqual([]);
  }

  test("home page has no serious axe violations", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expectNoSeriousAxeViolations(page);
  });

  test("privacy page has no serious axe violations", async ({ page }) => {
    await page.goto("/privacy");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expectNoSeriousAxeViolations(page);
  });

  test("terms page has no serious axe violations", async ({ page }) => {
    await page.goto("/terms");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expectNoSeriousAxeViolations(page);
  });

  test("skip link targets main content", async ({ page }) => {
    await page.goto("/");
    const skip = page.getByRole("link", { name: "Skip to main content" });
    await skip.focus();
    await expect(skip).toBeVisible();
    await skip.click();
    await expect(page.locator("#main-content")).toBeFocused();
  });

  test("layout is usable at 320px width", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 640 });
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByRole("button", { name: /menu/i })).toBeVisible();

    const scrollWidth = await page.evaluate(
      () => document.documentElement.scrollWidth,
    );
    const clientWidth = await page.evaluate(
      () => document.documentElement.clientWidth,
    );
    // Allow 1px subpixel tolerance
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1);
  });

  test("mobile menu opens, Escape closes and restores focus to toggle", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 320, height: 640 });
    await page.goto("/");

    const toggle = page.getByRole("button", { name: /menu/i });
    await expect(toggle).toBeVisible();
    await expect(toggle).toHaveAttribute("aria-expanded", "false");

    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-expanded", "true");
    await expect(
      page.getByRole("navigation", { name: "Primary mobile" }).getByRole("link").first(),
    ).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    await expect(toggle).toBeFocused();
  });
});
