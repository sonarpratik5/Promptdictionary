import { describe, expect, it } from "vitest";
import { renderTemplate } from "./template";

const variables = [
  { name: "topic", label: "Topic", description: "", required: true },
  { name: "reader", label: "Reader", description: "", defaultValue: "everyone" },
];

describe("renderTemplate", () => {
  it("uses values and declared defaults", () => {
    expect(renderTemplate("Explain {{topic}} to {{reader}}.", variables, { topic: "cookies" })).toEqual({ text: "Explain cookies to everyone.", missingRequired: [] });
  });
  it("preserves unknown tokens as inert literal text", () => {
    expect(renderTemplate("{{unknown}} {{topic}}", variables, { topic: "x" }).text).toBe("{{unknown}} x");
  });
  it("keeps an empty required token visible and reports it", () => {
    expect(renderTemplate("{{topic}}", variables, {}).missingRequired).toEqual(["topic"]);
  });
  it("preserves intentional whitespace in a supplied value", () => {
    expect(renderTemplate("{{topic}}", variables, { topic: "  code sample\n  " }).text).toBe("  code sample\n  ");
  });
});
