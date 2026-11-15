import { describe, it, expect } from "vitest";
import { isDemoAddress, sendEmail } from "../lib/email";

describe("Email safety", () => {
  it("recognises demo accounts so no real mail is sent to them", () => {
    expect(isDemoAddress("margaret.demo@carecircle.app")).toBe(true);
    expect(isDemoAddress("someone@gmail.com")).toBe(false);
  });

  it("simulates delivery (never throws) for demo addresses", async () => {
    const result = await sendEmail({
      to: "sarah.demo@carecircle.app",
      subject: "Test",
      text: "Dose reminder",
      html: "<p>Dose reminder</p>",
    });
    expect(result.success).toBe(true);
    expect(result.simulated).toBe(true);
  });
});
