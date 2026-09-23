import { describe, expect, it } from "vitest";
import { getHomeDestination } from "./home-navigation";

describe("home navigation", () => {
  it("opens the business create flow from the primary CTA", () => {
    expect(getHomeDestination("business")).toEqual({ role: "business", view: "create" });
  });

  it("opens the student marketplace from the discovery CTA", () => {
    expect(getHomeDestination("student")).toEqual({ role: "student", view: "market" });
  });
});
