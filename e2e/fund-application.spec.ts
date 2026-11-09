import { expect, test } from "@playwright/test";

// The public short application form on the General Opportunity Fund page.
// No account is needed; the fund opened on 1 November 2026, so the form is shown.
test("visitor submits the short fund application form and gets a reference", async ({ page }) => {
  await page.goto("/fund");
  await expect(page.getByRole("heading", { name: "Apply to the General Opportunity Fund" })).toBeVisible();

  // The form must never ask for sensitive data.
  await expect(page.getByLabel(/social security/i)).toHaveCount(0);
  await expect(page.getByLabel(/bank/i)).toHaveCount(0);
  await expect(page.getByLabel(/date of birth/i)).toHaveCount(0);

  await page.getByLabel("Full name").fill("Jamie Example");
  await page.getByLabel("Email address").fill(`e2e-fund-${Date.now()}@example.test`);
  await page.getByLabel("Country you are located in").fill("United States");
  await page.getByLabel("Which best describes you?").selectOption("ENTREPRENEUR");
  await page.getByLabel("What is the funding for?").fill("Fund a community training programme for young people.");
  await page.getByLabel("How would the money be used?").fill("Pay for a venue, materials and two part-time tutors.");
  await page.getByLabel("Amount requested (USD)").fill("75000");
  await page.getByLabel("Budget summary").fill("Venue 15,000; materials 20,000; tutors 40,000.");
  await page.getByLabel(/I have read the/).check();

  await page.getByRole("button", { name: "Submit application" }).click();
  await expect(page.getByText(/your application was received/i)).toBeVisible();
  await expect(page.getByText(/NEN-APP-\d{4}-[A-Z2-9]{6}/)).toBeVisible();
});

test("visitor in an African country is told the fund is not open there", async ({ page }) => {
  await page.goto("/fund");
  await page.getByLabel("Full name").fill("Jamie Example");
  await page.getByLabel("Email address").fill(`e2e-fund-africa-${Date.now()}@example.test`);
  await page.getByLabel("Country you are located in").fill("Nigeria");
  await page.getByLabel("Which best describes you?").selectOption("INDIVIDUAL");
  await page.getByLabel("What is the funding for?").fill("Fund a community training programme for young people.");
  await page.getByLabel("How would the money be used?").fill("Pay for a venue, materials and two part-time tutors.");
  await page.getByLabel("Amount requested (USD)").fill("75000");
  await page.getByLabel("Budget summary").fill("Venue 15,000; materials 20,000; tutors 40,000.");
  await page.getByLabel(/I have read the/).check();
  await page.getByRole("button", { name: "Submit application" }).click();
  await expect(page.getByText(/except to applicants located in Africa/i).first()).toBeVisible();
});
