/**
 * Tests for the per-product document checklist generator.
 *
 * The most important guarantee these tests pin: unknown visa types must
 * never silently produce a DNV checklist. The previous behaviour (default to
 * DNV) was the highest-impact route-mismatch bug — an EU Registration case
 * with a malformed visaType would receive 8 DNV-specific documents.
 */
import { describe, it, expect } from "vitest";
import { getChecklistForVisaType } from "./documentChecklists";
import type { PaidVisaProduct } from "../shared/visaRoutes";

describe("getChecklistForVisaType", () => {
  it("returns the EU Registration checklist for eu-registration", () => {
    const slots = getChecklistForVisaType("eu-registration");
    const types = slots.map((s) => s.documentType);
    // EU-specific slots that DNV does not have.
    expect(types).toContain("proof_of_address");
    expect(types).toContain("ex18_form");
    // DNV-specific slots must NOT appear.
    expect(types).not.toContain("employment_letter");
    expect(types).not.toContain("company_registration");
    expect(types).not.toContain("degree_or_experience");
  });

  it("returns the DNV checklist for digital-nomad-visa", () => {
    const slots = getChecklistForVisaType("digital-nomad-visa");
    const types = slots.map((s) => s.documentType);
    expect(types).toContain("employment_letter");
    expect(types).toContain("company_registration");
    expect(types).toContain("degree_or_experience");
    // EU-specific slots must NOT appear.
    expect(types).not.toContain("ex18_form");
    expect(types).not.toContain("proof_of_address");
  });

  it("returns the NLV checklist for non-lucrative-visa", () => {
    const slots = getChecklistForVisaType("non-lucrative-visa");
    const types = slots.map((s) => s.documentType);
    expect(types).toContain("medical_certificate");
    expect(types).toContain("accommodation_proof");
  });

  it("returns the Student checklist for student-visa", () => {
    const slots = getChecklistForVisaType("student-visa");
    const types = slots.map((s) => s.documentType);
    expect(types).toContain("acceptance_letter");
  });

  it("returns the Work checklist for work-visa", () => {
    const slots = getChecklistForVisaType("work-visa");
    const types = slots.map((s) => s.documentType);
    expect(types).toContain("job_offer");
    expect(types).toContain("employer_registration");
  });

  it("each paid product produces a non-empty checklist", () => {
    const products: PaidVisaProduct[] = [
      "eu-registration",
      "digital-nomad-visa",
      "non-lucrative-visa",
      "student-visa",
      "work-visa",
    ];
    for (const p of products) {
      const slots = getChecklistForVisaType(p);
      expect(slots.length).toBeGreaterThan(0);
    }
  });

  it("throws (does NOT silently return DNV) when a caller bypasses the type and passes 'unknown'", () => {
    // The TypeScript signature prevents this at compile time. The runtime
    // throw is defence-in-depth for unsafe casts and runtime data drift.
    expect(() => getChecklistForVisaType("unknown" as unknown as PaidVisaProduct)).toThrow(
      /Unknown visa product/
    );
  });

  it("throws when a caller passes a display name (the pre-PR-2 attack vector)", () => {
    // adminCreateCase used to accept arbitrary strings — staff could type
    // "EU Registration Certificate" and silently get a DNV checklist.
    expect(() =>
      getChecklistForVisaType("EU Registration Certificate" as unknown as PaidVisaProduct)
    ).toThrow(/Unknown visa product/);
    expect(() =>
      getChecklistForVisaType("Digital Nomad Visa (DNV)" as unknown as PaidVisaProduct)
    ).toThrow(/Unknown visa product/);
  });

  it("throws on null and empty string", () => {
    expect(() => getChecklistForVisaType(null as unknown as PaidVisaProduct)).toThrow();
    expect(() => getChecklistForVisaType("" as unknown as PaidVisaProduct)).toThrow();
  });
});
