import { expect,test } from "@playwright/test";
test("landing page is reachable",async({page})=>{await page.goto("/");await expect(page).toHaveTitle(/BrandCanvas/i)});
test("admin login is reachable",async({page})=>{await page.goto("/admin/login");await expect(page.getByRole("heading")).toBeVisible()});
