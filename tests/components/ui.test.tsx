// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useForm } from "react-hook-form";
import { DemoBadge, DisbursementBadge, StatusBadge } from "@/components/ui/badge";
import { Pagination, ProgressBar, Unconfirmed } from "@/components/ui/misc";
import { FormMessage, TextField } from "@/components/ui/form";
import { Timeline } from "@/components/dashboard/timeline";
import { AwardPanel } from "@/components/dashboard/award-panel";
import { QuestionField } from "@/components/application/question-field";
import type { WizardQuestion, WizardValues } from "@/components/application/types";

describe("badges and labels", () => {
  it("DemoBadge always spells out that the opportunity is not live", () => {
    render(<DemoBadge />);
    expect(screen.getByText("DEMO — NOT A LIVE FUNDING OPPORTUNITY")).toBeInTheDocument();
  });
  it("status badges use human labels, never raw enum values", () => {
    render(<><StatusBadge status="INFO_REQUESTED" /><DisbursementBadge status="PAID_MANUAL" /></>);
    expect(screen.getByText("Additional information requested")).toBeInTheDocument();
    expect(screen.getByText("Paid — manually recorded")).toBeInTheDocument();
  });
  it("Unconfirmed shows 'Details to be confirmed' instead of inventing a value", () => {
    render(<p><Unconfirmed /></p>);
    expect(screen.getByText("Details to be confirmed")).toBeInTheDocument();
    render(<p><Unconfirmed>Real value</Unconfirmed></p>);
    expect(screen.getByText("Real value")).toBeInTheDocument();
  });
});

describe("accessible widgets", () => {
  it("progress bar exposes its value to assistive technology", () => {
    render(<ProgressBar label="Profile completion" value={42.4} />);
    const bar = screen.getByRole("progressbar", { name: "Profile completion" });
    expect(bar).toHaveAttribute("aria-valuenow", "42");
  });
  it("pagination marks the current page and hides itself for a single page", () => {
    const { container, rerender } = render(<Pagination page={2} pages={5} hrefFor={(n) => `?page=${n}`} />);
    expect(screen.getByRole("link", { name: "2" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Next" })).toHaveAttribute("href", "?page=3");
    rerender(<Pagination page={1} pages={1} hrefFor={(n) => `?page=${n}`} />);
    expect(container).toBeEmptyDOMElement();
  });
  it("form fields link labels, hints and errors", () => {
    render(<TextField label="Email" hint="We never share it" error={["Enter a valid email."]} required />);
    const input = screen.getByLabelText(/Email/);
    expect(input).toBeRequired();
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input.getAttribute("aria-describedby")).toMatch(/hint.*err|err.*hint/);
    expect(screen.getByText("Enter a valid email.")).toBeInTheDocument();
  });
  it("FormMessage reports only real results and uses alert vs status roles", () => {
    const { rerender } = render(<FormMessage state={null} />);
    expect(screen.queryByRole("alert")).toBeNull();
    rerender(<FormMessage state={{ ok: false, message: "Could not save." }} />);
    expect(screen.getByRole("alert")).toHaveTextContent("Could not save.");
    rerender(<FormMessage state={{ ok: true, message: "Saved." }} />);
    expect(screen.getAllByRole("status").some((n) => n.textContent === "Saved.")).toBe(true);
  });
});

describe("timeline and award panel", () => {
  it("timeline lists events chronologically with public notes only", () => {
    render(<Timeline events={[
      { toStatus: "DRAFT", publicNote: "Draft started.", createdAt: new Date("2026-01-01T10:00:00Z") },
      { toStatus: "SUBMITTED", publicNote: "Application submitted.", createdAt: new Date("2026-01-02T10:00:00Z") },
    ]} />);
    const items = screen.getAllByRole("listitem");
    expect(items).toHaveLength(2);
    expect(items[1]).toHaveTextContent("Application submitted.");
  });
  it("award panel states these are staff records and marks manual payments as unverified", () => {
    render(<AwardPanel award={{
      reference: "NEN-AWD-DEMO-2026-AAAAAA", amountMinor: 300000, currency: "USD", status: "ACTIVE", acceptanceStatus: "ACCEPTED", conditions: null, applicantSummary: null, approvedAt: new Date("2026-01-01"),
      disbursements: [
        { id: "1", reference: "D1", amountMinor: 100000, currency: "USD", plannedDate: new Date("2026-02-01"), milestone: null, status: "PAID_MANUAL", applicantNote: null, updatedAt: new Date() },
        { id: "2", reference: "D2", amountMinor: 100000, currency: "USD", plannedDate: new Date("2026-03-01"), milestone: null, status: "SCHEDULED", applicantNote: null, updatedAt: new Date() },
      ],
    }} />);
    expect(screen.getByText(/does not move money/)).toBeInTheDocument();
    expect(screen.getByText("Entered by staff; not provider-verified.")).toBeInTheDocument();
    expect(screen.getAllByText("USD 3,000.00").length).toBeGreaterThan(0);
    expect(screen.getByText(/USD 1,000.00 — no instalment planned yet/)).toBeInTheDocument();
  });
});

function Harness({ q, initial }: { q: WizardQuestion; initial?: WizardValues["answers"] }) {
  const { register } = useForm<WizardValues>({ defaultValues: { answers: initial ?? {} } });
  return <QuestionField q={q} register={register} />;
}
const base: WizardQuestion = { key: "k", label: "Question", helpText: "Help me", type: "SHORT_TEXT", optionList: [], required: false, section: "GENERAL" };

describe("question renderer", () => {
  it("renders the right control per question type", () => {
    const { unmount } = render(<Harness q={{ ...base, type: "LONG_TEXT", required: true }} />);
    expect(screen.getByLabelText(/Question/).tagName).toBe("TEXTAREA");
    expect(screen.getByLabelText(/Question/)).toHaveAttribute("aria-required", "true");
    unmount();
    const r2 = render(<Harness q={{ ...base, type: "DATE" }} />);
    expect(screen.getByLabelText("Question")).toHaveAttribute("type", "date");
    r2.unmount();
    const r3 = render(<Harness q={{ ...base, type: "URL" }} />);
    expect(screen.getByLabelText("Question")).toHaveAttribute("type", "url");
    r3.unmount();
  });
  it("single choice is a radio group and multi choice is a checkbox group", async () => {
    const user = userEvent.setup();
    const { unmount } = render(<Harness q={{ ...base, type: "SINGLE_CHOICE", optionList: ["A", "B"] }} />);
    expect(screen.getByRole("group", { name: /Question/ })).toBeInTheDocument();
    await user.click(screen.getByLabelText("B"));
    expect(screen.getByLabelText("B")).toBeChecked();
    expect(screen.getByLabelText("A")).not.toBeChecked();
    unmount();
    render(<Harness q={{ ...base, type: "MULTI_CHOICE", optionList: ["X", "Y"] }} initial={{ k: ["X"] }} />);
    expect(screen.getByLabelText("X")).toBeChecked();
    await user.click(screen.getByLabelText("Y"));
    expect(screen.getByLabelText("Y")).toBeChecked();
  });
  it("yes/no offers exactly two options", () => {
    render(<Harness q={{ ...base, type: "YES_NO" }} />);
    expect(screen.getAllByRole("radio")).toHaveLength(2);
  });
});
