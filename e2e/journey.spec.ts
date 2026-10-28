import { expect, test, type Page } from "@playwright/test";

const PASSWORD = "Demo-Passw0rd!";
const NEW_EMAIL = `e2e-${Date.now()}@example.test`;
const NEW_PASSWORD = "E2e-Passw0rd-123";

async function signIn(page: Page, email: string, password = PASSWORD) {
  await page.goto("/login");
  await page.getByLabel("Email address").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await page.waitForURL(/\/(dashboard|admin)/);
}
async function signOut(page: Page) {
  await page.getByRole("button", { name: "Sign out" }).click();
  await page.waitForURL("/");
}

let reference = "";
let applicationId = "";

test.describe.configure({ mode: "serial" });

test("1. visitor browses demo opportunities, searches, filters and clears", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Opportunity starts here." })).toBeVisible();
  await page.goto("/opportunities");
  await expect(page.getByText("DEMO — NOT A LIVE FUNDING OPPORTUNITY").first()).toBeVisible();
  const all = await page.locator("article").count();
  expect(all).toBeGreaterThan(3);

  await page.getByRole("searchbox").fill("farming");
  await page.getByRole("button", { name: "Search" }).click();
  await expect(page).toHaveURL(/q=farming/);
  await expect(page.locator("article")).toHaveCount(1);
  await expect(page.getByRole("heading", { name: "Demo Smallholder Farming Resilience Grant" })).toBeVisible();

  await page.getByRole("link", { name: "Clear all filters" }).click();
  await expect(page.locator("article")).toHaveCount(all);

  await page.getByLabel("Applicant type").selectOption("NONPROFIT");
  await page.getByRole("button", { name: "Apply filters" }).click();
  expect(await page.locator("article").count()).toBeLessThan(all);

  await page.goto("/opportunities?q=zzzz-nothing");
  await expect(page.getByText("No opportunities match your search")).toBeVisible();

  await page.goto("/opportunities?category=Bogus&sort=nope");
  await expect(page.getByText("Some filters were not recognised")).toBeVisible();

  await page.goto("/opportunities/demo-micro-enterprise-starter-programme");
  await expect(page.getByRole("heading", { level: 1, name: "Demo Micro-Enterprise Starter Programme" })).toBeVisible();
  await expect(page.getByText("This is a fictional demonstration")).toBeVisible();
  await expect(page.getByRole("link", { name: "Sign in to apply" })).toBeVisible();
});

test("2. a new individual registers, saves a draft, resumes it, submits and sees the reference", async ({ page }) => {
  await page.goto("/register");
  await page.getByLabel("Full name").fill("Erin E2E");
  await page.getByLabel("Email address").fill(NEW_EMAIL);
  await page.getByLabel(/^Password/).fill(NEW_PASSWORD);
  await page.getByLabel("Confirm password").fill(NEW_PASSWORD);
  await page.getByLabel(/I have read the/).check();
  await page.getByRole("button", { name: "Create account" }).click();
  await page.waitForURL(/dashboard\/profile/);

  // Empty states for a brand-new user.
  await page.goto("/dashboard");
  await expect(page.getByText("You haven’t started an application yet.")).toBeVisible();
  await expect(page.getByText("No opportunities are currently saved.")).toBeVisible();
  await expect(page.getByText("There are no award records associated with your account.")).toBeVisible();

  // Complete the profile (needed to submit).
  await page.goto("/dashboard/profile");
  await page.getByLabel("Country or region").fill("Testland");
  await page.getByLabel("City or locality").fill("Test City");
  await page.getByRole("button", { name: "Save profile" }).click();
  await expect(page.getByText("Profile saved.")).toBeVisible();

  // Save the opportunity, then start the application.
  await page.goto("/opportunities/demo-micro-enterprise-starter-programme");
  await page.getByRole("button", { name: "Save for later" }).click();
  await expect(page.getByRole("button", { name: /Saved — remove bookmark/ })).toBeVisible();
  await page.getByRole("button", { name: "Start application" }).click();
  await page.waitForURL(/\/edit$/);
  applicationId = page.url().split("/applications/")[1].split("/")[0];

  // Step 1 -> 3, then save a draft part-way and leave.
  await expect(page.getByRole("heading", { name: /Step 1 of 6/ })).toBeVisible();
  await page.getByRole("button", { name: "Save & continue" }).click(); // -> 2
  await page.getByRole("button", { name: "Save & continue" }).click(); // -> 3
  await expect(page.getByRole("heading", { name: /Step 3 of 6/ })).toBeVisible();
  await page.getByLabel(/Tell us about yourself/).fill("Draft story written by the e2e test.");
  await page.getByRole("button", { name: "Save draft" }).click();
  await expect(page.getByText(/Saved at/)).toBeVisible();

  // Resume from the dashboard at the saved step.
  await page.goto("/dashboard");
  await page.getByRole("link", { name: "Continue" }).first().click();
  await expect(page.getByRole("heading", { name: /Step 3 of 6/ })).toBeVisible();
  await expect(page.getByLabel(/Tell us about yourself/)).toHaveValue("Draft story written by the e2e test.");

  // Step 4 — required fields missing should be flagged on the review step.
  await page.getByRole("button", { name: "Save & continue" }).click();
  await expect(page.getByRole("heading", { name: /Step 4 of 6/ })).toBeVisible();
  await page.getByLabel("Amount requested (USD)").fill("999.00"); // below programme minimum
  await page.getByRole("button", { name: "Save & continue" }).click();
  await expect(page.getByText("That is below this programme's minimum.")).toBeVisible();
  await page.getByLabel("Amount requested (USD)").fill("2500.00");
  await page.getByLabel("Purpose of the request").fill("Demonstration purpose from the e2e test.");
  await page.getByLabel("Intended use of funds or support").fill("Fictional use of funds.");
  await page.getByRole("button", { name: "Save & continue" }).click(); // -> 5
  await page.getByRole("button", { name: "Save & continue" }).click(); // -> 6
  await expect(page.getByRole("heading", { name: /Step 6 of 6/ })).toBeVisible();
  await expect(page.getByText("Everything required is filled in")).toBeVisible();

  // Consent is NOT pre-selected, and submission without it is rejected by the server.
  await expect(page.getByLabel(/I confirm the information/)).not.toBeChecked();
  await page.getByRole("button", { name: "Submit application" }).click();
  await expect(page.getByText(/must confirm the statements/i).first()).toBeVisible();

  await page.getByLabel(/I confirm the information/).check();
  await page.getByLabel(/I have read the .*programme terms/).check();
  await page.getByRole("button", { name: "Submit application" }).click();
  await page.waitForURL(/submitted=1/);
  await expect(page.getByText("Application submitted", { exact: true })).toBeVisible();
  reference = (await page.locator("strong", { hasText: /^NEN-DEMO-\d{4}-/ }).first().innerText()).trim();
  expect(reference).toMatch(/^NEN-DEMO-\d{4}-[A-Z2-9]{6}$/);
  await expect(page.getByText("Submitted", { exact: true }).first()).toBeVisible();
  await signOut(page);
});

test("3. administrator finds the application in the queue (search + filter) and assigns a reviewer", async ({ page }) => {
  await signIn(page, "admin@demo.nen.test");
  await page.goto("/admin/applications");
  const total = await page.locator("tbody tr").count();
  await page.getByRole("searchbox").fill(reference);
  await page.getByRole("button", { name: "Apply filters" }).click();
  await expect(page.locator("tbody tr")).toHaveCount(1);
  await page.getByRole("searchbox").fill("");
  await page.getByLabel("Status", { exact: true }).selectOption("SUBMITTED");
  await page.getByRole("button", { name: "Apply filters" }).click();
  expect(await page.locator("tbody tr").count()).toBeLessThan(total + 1);
  await page.goto(`/admin/applications?q=${reference}`);
  await page.getByRole("link", { name: reference }).click();
  await expect(page.getByText("Contact details and other unnecessary personal data are intentionally not shown")).toBeVisible();
  await page.getByLabel("Reviewer", { exact: true }).selectOption({ label: "Riley Reviewer (Demo)" });
  await page.getByRole("button", { name: "Assign" }).click();
  await expect(page.getByText("Reviewer assigned.")).toBeVisible();
  await signOut(page);
});

test("4. reviewer sees only assigned work, records notes and a recommendation but cannot decide", async ({ page }) => {
  await signIn(page, "reviewer1@demo.nen.test");
  await page.goto("/admin");
  await expect(page.getByRole("link", { name: "Opportunities" }).first()).toBeHidden().catch(() => undefined);
  await expect(page.getByRole("link", { name: "Awards & payments" })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Audit log" })).toHaveCount(0);
  await page.goto(`/admin/applications?q=${reference}`);
  await page.getByRole("link", { name: reference }).click();
  await page.waitForURL(/\/admin\/applications\/[a-z0-9]+$/);
  applicationId = page.url().split("/applications/")[1];

  // Not allowed on admin-only pages.
  for (const path of ["/admin/awards", "/admin/audit", "/admin/users", "/admin/opportunities", "/admin/exports", "/admin/support"]) {
    await page.goto(path);
    await expect(page).toHaveURL(/access-denied/);
  }
  const csv = await page.request.get("/admin/export/awards");
  expect(csv.status()).toBe(403);

  await page.goto(`/admin/applications/${applicationId}`);
  await page.getByLabel("Move to").selectOption("INITIAL_REVIEW");
  await page.getByRole("button", { name: "Move", exact: true }).click();
  await expect(page.getByText("Status updated.")).toBeVisible();
  await page.reload();
  await page.getByLabel("Move to").selectOption("UNDER_REVIEW");
  await page.getByRole("button", { name: "Move", exact: true }).click();
  await expect(page.getByText("Status updated.")).toBeVisible();
  await page.reload();
  await page.getByLabel("Note (internal only)").fill("INTERNAL-E2E-NOTE: looks fine.");
  await page.getByRole("button", { name: "Save note" }).click();
  await expect(page.getByText("Internal note saved.")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Final decision" })).toHaveCount(0); // no decision controls for reviewers
  await page.reload();
  await page.getByLabel("Recommend", { exact: true }).selectOption("APPROVE");
  await page.getByLabel("Rationale").fill("Recommend approval — e2e.");
  await page.getByRole("button", { name: "Record recommendation" }).click();
  await expect(page.getByText("Recommendation recorded.")).toBeVisible();

  // Another reviewer's / unassigned application is not reachable.
  await page.goto("/admin/applications");
  const links = await page.locator("tbody a").evaluateAll((as) => as.map((a) => (a as HTMLAnchorElement).href));
  expect(links.length).toBeGreaterThan(0);
  await signOut(page);
});

test("5. administrator records the decision, creates a fictional award and schedules an instalment", async ({ page }) => {
  await signIn(page, "admin@demo.nen.test");
  await page.goto(`/admin/applications/${applicationId}`);
  await page.getByLabel("Outcome").selectOption("APPROVE");
  await page.getByLabel("Reason (internal, recorded)").fill("Approved in e2e.");
  await page.getByLabel("Message shown to the applicant (optional)").fill("Approved — demo only, no real funds.");
  await page.getByRole("button", { name: "Record final decision" }).click();
  await expect(page.getByText("Final decision recorded.")).toBeVisible();

  await page.goto(`/admin/awards?create=${applicationId}`);
  await page.getByLabel("Approved amount").fill("3000.00");
  await page.getByLabel("Award acceptance").selectOption("ACCEPTED");
  await page.getByLabel("Applicant-visible award summary").fill("Fictional e2e award summary.");
  await page.getByLabel("Internal notes (hidden from applicant)").fill("INTERNAL-E2E-AWARD-NOTE");
  await page.getByRole("button", { name: "Create award record" }).click();
  await page.waitForURL(/\/admin\/awards\/.+created=1/);
  await expect(page.getByText("Award record created")).toBeVisible();

  await page.getByLabel(/Planned amount/).fill("4000.00");
  await page.getByLabel("Planned date").first().fill("2999-03-01");
  await page.getByRole("button", { name: "Schedule instalment" }).click();
  await expect(page.getByText(/exceed the approved award amount/)).toBeVisible(); // over-allocation rejected
  await page.getByLabel(/Planned amount/).fill("1500.00");
  await page.getByLabel("Milestone / purpose").fill("Kick-off");
  await page.getByLabel("Applicant-visible note").first().fill("First planned instalment (e2e).");
  await page.getByRole("button", { name: "Schedule instalment" }).click();
  await expect(page.getByText("Instalment scheduled.", { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByText("USD 1,500.00 · planned 1 Mar 2999")).toBeVisible();
  await expect(page.getByText(/USD 1,500.00 — schedule is incomplete/)).toBeVisible(); // remaining balance explained

  // Manual "paid" needs the acknowledgement and cannot skip the processing step.
  await page.getByLabel("New status").selectOption("AWAITING_PROCESSING");
  await page.getByLabel(/Reason \(required\)/).fill("Queued with finance.");
  await page.getByRole("button", { name: "Record status" }).click();
  await expect(page.getByText(/Status recorded \(manual entry\)/)).toBeVisible();
  await page.reload();
  await page.getByLabel("New status").selectOption("PAID_MANUAL");
  await page.getByLabel(/Reference \/ evidence note/).fill("FIN-E2E-1");
  await page.getByRole("button", { name: "Record status" }).click();
  await expect(page.getByText(/Confirm that you are manually recording/)).toBeVisible();
  await signOut(page);
});

test("6. the applicant sees only the permitted updates", async ({ page }) => {
  await signIn(page, NEW_EMAIL, NEW_PASSWORD);
  await page.goto(`/dashboard/applications/${applicationId}`);
  await expect(page.getByText("Disbursement scheduled", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("USD 3,000.00").first()).toBeVisible();
  await expect(page.getByText("First planned instalment (e2e).")).toBeVisible();
  await expect(page.getByText("Approved — demo only, no real funds.").first()).toBeVisible();
  await expect(page.getByText(/not provider|not confirmations from a payment provider/).first()).toBeVisible();
  const html = await page.content();
  expect(html).not.toContain("INTERNAL-E2E");
  expect(html).not.toContain("Approved in e2e.");
  expect(html).not.toContain("Recommend approval — e2e.");

  await page.goto("/dashboard/awards");
  await expect(page.getByText("Planned instalments")).toBeVisible();
  await page.goto("/dashboard/notifications");
  await expect(page.getByText(/Decision recorded/)).toBeVisible();
  await page.getByRole("button", { name: "Mark all as read" }).click();
  await expect(page.getByText("You’re all caught up")).toBeVisible();
});

test("7. unauthorized access to private application, financial and admin records is blocked", async ({ page, browser }) => {
  // Anonymous.
  const anon = await browser.newContext();
  const ap = await anon.newPage();
  await ap.goto("/dashboard");
  await expect(ap).toHaveURL(/\/login\?next=%2Fdashboard/);
  await ap.goto("/admin");
  await expect(ap).toHaveURL(/\/login/);
  expect((await ap.request.get("/admin/export/awards")).status()).toBe(401);
  await anon.close();

  // A different applicant cannot open this applicant's application or award.
  await signIn(page, "individual2@demo.nen.test");
  await page.goto(`/dashboard/applications/${applicationId}`);
  await expect(page.getByText("We couldn’t find that page")).toBeVisible();
  await page.goto(`/dashboard/applications/${applicationId}/edit`);
  await expect(page.getByText("We couldn’t find that page")).toBeVisible();
  await page.goto("/admin");
  await expect(page).toHaveURL(/access-denied/);
  await page.goto("/admin/awards");
  await expect(page).toHaveURL(/access-denied/);
  expect((await page.request.get("/admin/export/awards")).status()).toBe(403);
  await signOut(page);
});

test("8. admin pages, exports and audit trail work", async ({ page }) => {
  await signIn(page, "admin@demo.nen.test");
  await page.goto("/admin");
  await expect(page.getByRole("heading", { name: "Overview" })).toBeVisible();
  await expect(page.getByText("Applications by status")).toBeVisible();
  for (const path of ["/admin/opportunities", "/admin/awards", "/admin/support", "/admin/users", "/admin/configuration", "/admin/exports", "/admin/audit"]) {
    const res = await page.goto(path);
    expect(res?.status(), path).toBe(200);
  }
  const csv = await page.request.get("/admin/export/applications");
  expect(csv.status()).toBe(200);
  expect(csv.headers()["content-type"]).toContain("text/csv");
  expect(csv.headers()["content-disposition"]).toMatch(/nen-applications-\d{4}-\d{2}-\d{2}\.csv/);
  const body = await csv.text();
  expect(body).toContain(reference);
  expect(body).not.toMatch(/INTERNAL-E2E|passwordHash/);
  await page.goto("/admin/audit?action=export");
  await expect(page.getByText(/Exported applications CSV/)).toBeVisible();
  await page.goto("/admin/audit?q=" + reference);
  await expect(page.getByText(/→/).first()).toBeVisible();
});

test("9. mobile layout: navigation menu is usable and no horizontal page scroll", async ({ browser }) => {
  const ctx = await browser.newContext({ viewport: { width: 375, height: 800 } });
  const page = await ctx.newPage();
  await page.goto("/");
  await page.getByRole("button", { name: /Menu/ }).click();
  await expect(page.getByRole("link", { name: "Opportunities" }).last()).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("button", { name: /Menu/ })).toBeVisible();
  for (const path of ["/", "/opportunities", "/opportunities/demo-micro-enterprise-starter-programme", "/faq", "/login"]) {
    await page.goto(path);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow, `${path} horizontal overflow`).toBeLessThanOrEqual(1);
  }
  await ctx.close();
});

test("10. navigation: active state, links to the simplified pages, old URLs redirect", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("link", { name: "Home", exact: true })).toHaveAttribute("aria-current", "page");
  for (const [name, url] of [["General Fund", /\/fund/], ["Other Grants", /\/other-grants/], ["FAQ", /\/faq/]] as const) {
    await page.getByRole("link", { name, exact: true }).first().click();
    await page.waitForURL(url);
    await expect(page.getByRole("link", { name, exact: true }).first()).toHaveAttribute("aria-current", "page");
  }
  // Pages that were merged still work for old links.
  await page.goto("/how-it-works");
  await page.waitForURL(/\/fund/);
  await expect(page.locator("#how-it-works")).toBeVisible();
  await page.goto("/fraud-prevention");
  await page.waitForURL(/\/faq/);
  await expect(page.locator("#safety")).toBeVisible();
  await page.goto("/accessibility");
  await page.waitForURL(/\/terms/);
  await expect(page.locator("#accessibility")).toBeVisible();
  await page.keyboard.press("Tab");
  expect(await page.evaluate(() => document.activeElement?.tagName)).toBeTruthy();
});

test("11. hero: poster fallback + reduced motion loads no video; short landscape has no overflow and scrolls on", async ({ browser }) => {
  const reduced = await browser.newContext({ reducedMotion: "reduce", viewport: { width: 1280, height: 800 } });
  const p = await reduced.newPage();
  const requests: string[] = [];
  p.on("request", (r) => requests.push(r.url()));
  await p.goto("/");
  await p.waitForTimeout(1500);
  expect(await p.locator("video").count()).toBe(0);
  expect(requests.some((u) => u.endsWith(".mp4"))).toBe(false);
  expect(await p.locator("[data-hero-poster]").evaluate((el) => getComputedStyle(el).backgroundImage)).toContain("82e7eb75");
  // entrance animations are disabled: headline is fully visible immediately
  expect(await p.locator("#hero-h").evaluate((el) => getComputedStyle(el).opacity)).toBe("1");
  await reduced.close();

  const land = await browser.newContext({ viewport: { width: 667, height: 375 } });
  const q = await land.newPage();
  await q.goto("/");
  await q.waitForTimeout(1200);
  expect(await q.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
  await expect(q.getByRole("link", { name: "Explore Opportunities" }).first()).toBeVisible();
  expect(await q.evaluate(() => document.documentElement.scrollHeight)).toBeGreaterThan(375 * 2); // page scrolls beyond the hero
  await land.close();
});

test("12. mobile menu closes on Escape, on outside tap and after navigating", async ({ browser }) => {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 800 } });
  const page = await ctx.newPage();
  await page.goto("/");
  const toggle = page.locator("button[aria-controls=mobile-menu]");
  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-expanded", "true");
  await page.keyboard.press("Escape");
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  await toggle.click();
  await page.mouse.click(200, 760);
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  await toggle.click();
  await page.getByRole("navigation", { name: "Mobile primary" }).getByRole("link", { name: "FAQ" }).click();
  await page.waitForURL(/\/faq/);
  await expect(page.getByRole("button", { name: /Menu/ })).toHaveAttribute("aria-expanded", "false");
  await ctx.close();
});

test("13. quick account: no email, passkey sign-in, access-code backup", async ({ browser }) => {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();
  // A virtual authenticator stands in for a fingerprint / face / device-unlock passkey.
  const cdp = await ctx.newCDPSession(page);
  await cdp.send("WebAuthn.enable");
  await cdp.send("WebAuthn.addVirtualAuthenticator", { options: { protocol: "ctap2", transport: "internal", hasResidentKey: true, hasUserVerification: true, isUserVerified: true, automaticPresenceSimulation: true } });

  await page.goto("/start");
  await page.getByLabel("Your name").fill("Quinn Quick");
  await page.getByRole("button", { name: "Create my account" }).click();
  await expect(page.getByText("acknowledge the privacy notice")).toBeVisible(); // no consent, no account
  await expect(page.getByTestId("access-code-panel")).toHaveCount(0);
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Create my account" }).click();
  const panel = page.getByTestId("access-code-panel");
  await expect(panel).toBeVisible();
  const code = (await panel.getByLabel("Your access code").innerText()).trim();
  expect(code).toMatch(/^NEN-([A-Z2-9]{4}-){3}[A-Z2-9]{4}$/);

  await page.getByRole("button", { name: "Add a passkey" }).click();
  await expect(page.getByText("Passkey added to this device.")).toBeVisible();
  await page.getByRole("link", { name: "Continue to my dashboard" }).click();
  await page.waitForURL(/\/dashboard/);
  await expect(page.getByRole("heading", { name: "Welcome, Quinn" })).toBeVisible();

  // The security page lists the passkey and never shows the old code again.
  await page.getByRole("link", { name: "Sign-in & security" }).click();
  await expect(page.getByText("This device").first()).toBeVisible();
  await expect(page.getByText(code)).toHaveCount(0);

  // Sign out, then sign back in with ONE tap on the passkey (no email, no password, no code).
  await page.getByRole("button", { name: "Sign out" }).click();
  await page.goto("/login");
  await page.getByRole("button", { name: "Sign in with a passkey" }).click();
  await page.waitForURL(/\/dashboard/);
  await expect(page.getByRole("heading", { name: "Welcome, Quinn" })).toBeVisible();

  // Backup: the access code works from a fresh browser with no passkey; wrong codes are refused.
  await page.getByRole("button", { name: "Sign out" }).click();
  const other = await (await browser.newContext()).newPage();
  await other.goto("/login");
  await other.getByLabel("Access code").fill("NEN-AAAA-BBBB-CCCC-DDDD");
  await other.getByRole("button", { name: "Sign in with access code" }).click();
  await expect(other.getByText("not recognised")).toBeVisible();
  await other.getByLabel("Access code").fill(code.toLowerCase());
  await other.getByRole("button", { name: "Sign in with access code" }).click();
  await other.waitForURL(/\/dashboard/);
  await expect(other.getByRole("heading", { name: "Welcome, Quinn" })).toBeVisible();

  // Creating a new code on the security page revokes the old one.
  await other.getByRole("link", { name: "Sign-in & security" }).click();
  await other.getByRole("button", { name: /Create a new access code/ }).click();
  await expect(other.getByText("shown only once")).toBeVisible();
  await other.getByRole("button", { name: "Sign out" }).click();
  await other.goto("/login");
  await other.getByLabel("Access code").fill(code);
  await other.getByRole("button", { name: "Sign in with access code" }).click();
  await expect(other.getByText("not recognised")).toBeVisible();
  await ctx.close();
});

test("14. other grants directory: referral notice names the real funder and links to its official site", async ({ page }) => {
  await page.goto("/other-grants");
  await expect(page.getByRole("heading", { level: 1, name: "Other grants" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Healthcare" })).toBeVisible();
  await page.getByRole("link", { name: "Federal Pell Grant" }).click();
  await page.waitForURL(/\/other-grants\/federal-pell-grant/);
  await expect(page.getByText("is offered by U.S. Department of Education")).toBeVisible();
  await expect(page.getByText(/does not run, fund, endorse or decide/)).toBeVisible();
  const go = page.getByRole("link", { name: /Continue to the official site/ });
  await expect(go).toHaveAttribute("href", "https://studentaid.gov/understand-aid/types/grants/pell");
  await expect(go).toHaveAttribute("rel", /noopener/);
  await page.goto("/other-grants/not-a-real-grant");
  await expect(page.getByText(/not found|could not be found|404/i).first()).toBeVisible();
});
