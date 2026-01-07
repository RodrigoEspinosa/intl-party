import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { initializeNextjsProject } from "./nextjs";
import * as fs from "node:fs";
import * as path from "node:path";

vi.mock("node:fs", () => ({
  existsSync: vi.fn(),
  writeFileSync: vi.fn(),
  mkdirSync: vi.fn(),
  readFileSync: vi.fn(),
}));

vi.mock("node:path", () => ({
  join: vi.fn((...args) => args.join("/")),
}));

const consoleLog = vi.spyOn(console, "log").mockImplementation(() => {});
const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
const consoleWarn = vi.spyOn(console, "warn").mockImplementation(() => {});
const processExit = vi.spyOn(process, "exit").mockImplementation((code) => {
  throw new Error(`Process exit with code ${code}`);
});

describe("nextjsCommand", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("initializeNextjsProject", () => {
    it("should initialize a Next.js project with simplified setup", async () => {
      const fileExistenceValues = [
        false,
        false,
        false,
        false,
        false,
        false,
        false,
        true,
        false,
        true,
      ];

      fileExistenceValues.forEach((value) => {
        vi.mocked(fs.existsSync).mockReturnValueOnce(value);
      });

      vi.mocked(fs.readFileSync).mockReturnValue(Buffer.from("node_modules"));

      const result = await initializeNextjsProject(true);

      expect(fs.writeFileSync).toHaveBeenCalledWith(
        "intl-party.config.ts",
        expect.stringContaining("Simplified IntlParty configuration"),
      );

      expect(fs.mkdirSync).toHaveBeenCalledWith("messages", {
        recursive: true,
      });
      expect(fs.mkdirSync).toHaveBeenCalledWith("messages/en", {
        recursive: true,
      });
      expect(fs.mkdirSync).toHaveBeenCalledWith("messages/es", {
        recursive: true,
      });
      expect(fs.mkdirSync).toHaveBeenCalledWith("messages/fr", {
        recursive: true,
      });

      expect(fs.writeFileSync).toHaveBeenCalledWith(
        "middleware.ts",
        expect.stringContaining("createSimplifiedSetup"),
      );

      expect(fs.writeFileSync).toHaveBeenCalledWith(
        "messages/en/common.json",
        expect.any(String),
      );

      expect(consoleLog).toHaveBeenCalledWith(
        expect.stringContaining("IntlParty initialized successfully"),
      );

      expect(result).toBe(true);
    });

    it("should skip initialization if config already exists", async () => {
      vi.mocked(fs.existsSync).mockReturnValueOnce(true);

      const result = await initializeNextjsProject(true);

      expect(consoleLog).toHaveBeenCalledWith(
        expect.stringContaining("IntlParty already initialized"),
      );

      expect(fs.writeFileSync).not.toHaveBeenCalled();

      expect(result).toBe(true);
    });

    it("should handle src directory structure", async () => {
      const fileExistenceValues = [
        false,
        false,
        true,
        false,
        false,
        false,
        false,
        false,
        false,
        false,
      ];

      fileExistenceValues.forEach((value) => {
        vi.mocked(fs.existsSync).mockReturnValueOnce(value);
      });

      await initializeNextjsProject(true);

      expect(fs.writeFileSync).toHaveBeenCalledWith(
        "src/middleware.ts",
        expect.stringContaining("createSimplifiedSetup"),
      );

      expect(fs.writeFileSync).toHaveBeenCalledWith(
        "src/middleware.ts",
        expect.stringContaining('import config from "../intl-party.config"'),
      );

      expect(path.join).toHaveBeenCalledWith("src", "app");
    });

    it("should overwrite existing config when force flag is true", async () => {
      const fileExistenceValues = [
        true,
        false,
        false,
        true,
        true,
        true,
        true,
        false,
        false,
        false,
      ];

      fileExistenceValues.forEach((value) => {
        vi.mocked(fs.existsSync).mockReturnValueOnce(value);
      });

      const result = await initializeNextjsProject(true, true);

      expect(fs.writeFileSync).toHaveBeenCalledWith(
        "intl-party.config.ts",
        expect.stringContaining("Simplified IntlParty configuration"),
      );

      expect(fs.writeFileSync).toHaveBeenCalledWith(
        "middleware.ts",
        expect.stringContaining("createSimplifiedSetup"),
      );

      expect(result).toBe(true);
      expect(consoleLog).toHaveBeenCalledWith(
        expect.stringContaining("IntlParty initialized successfully"),
      );
    });
  });
});
