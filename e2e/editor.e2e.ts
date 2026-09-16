import { expect, test } from "@playwright/test";

test("production editor boots and core modes render", async ({ page }) => {
  const pageErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));

  const response = await page.goto("/", { waitUntil: "networkidle" });
  expect(response?.ok()).toBeTruthy();
  await expect(page).toHaveURL(/\/editor$/);

  await expect(page.getByRole("textbox", { name: "Project name" })).toBeVisible();
  await expect(page.getByRole("button", { name: "design", exact: true })).toBeVisible();

  await page.getByRole("button", { name: "code", exact: true }).click();
  await expect(page.getByText("Generated files", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: "flow", exact: true }).click();
  await expect(page.locator(".react-flow")).toBeVisible();

  expect(pageErrors).toEqual([]);
});
