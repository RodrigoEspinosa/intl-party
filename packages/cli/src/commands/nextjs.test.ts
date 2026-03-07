import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { initializeNextjsProject } from "./nextjs";
import * as fs from "node:fs";
import * as path from "node:path";

vi.mock("node:fs", () => ({
  default: {
    existsSync: vi.fn(),
    writeFileSync: vi.fn(),
    mkdirSync: vi.fn(),
    readFileSync: vi.fn(),
  },
  existsSync: vi.fn(),
  writeFileSync: vi.fn(),
  mkdirSync: vi.fn(),
  readFileSync: vi.fn(),
}));

vi.mock("node:path", () => ({
  default: {
    join: vi.fn((...args: string[]) => args.join("/")),
  },
  join: vi.fn((...args: string[]) => args.join("/")),
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
    it("should initialize a Next.js project", async () => {
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

      const result = await initializeNextjsProject();

      expect(fs.writeFileSync).toHaveBeenCalledWith(
        "intl-party.config.ts",
        expect.stringContaining("IntlParty configuration"),
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
        expect.stringContaining("createSetup"),
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
      // First call is for intl-party.config.ts check
      vi.mocked(fs.existsSync).mockReturnValueOnce(true);

      const result = await initializeNextjsProject();

      expect(consoleLog).toHaveBeenCalledWith(
        expect.stringContaining("already initialized"),
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

      await initializeNextjsProject();

      expect(fs.writeFileSync).toHaveBeenCalledWith(
        "src/middleware.ts",
        expect.stringContaining("createSetup"),
      );

      expect(fs.writeFileSync).toHaveBeenCalledWith(
        "src/middleware.ts",
        expect.stringContaining('import config from "../intl-party.config"'),
      );

      expect(path.join).toHaveBeenCalledWith("src", "app");
    });

    it("should overwrite existing config when force flag is true", async () => {
      // Mock existsSync calls:
      // 1. intl-party.config.ts check - true (exists)
      // 2. intl-party.config.js check - false
      // 3. src directory check - false (no src dir)
      // 4-7. messages dirs - some exist
      // 8. next.config.js check - false
      // 9. appDir check - false
      // 10. .gitignore check - false
      vi.mocked(fs.existsSync)
        .mockReturnValueOnce(true)   // intl-party.config.ts
        .mockReturnValueOnce(false)  // src dir
        .mockReturnValueOnce(false)  // messages dir
        .mockReturnValueOnce(false)  // messages/en
        .mockReturnValueOnce(false)  // messages/es
        .mockReturnValueOnce(false)  // messages/fr
        .mockReturnValueOnce(false)  // next.config.js
        .mockReturnValueOnce(false)  // app dir
        .mockReturnValueOnce(false); // .gitignore

      const result = await initializeNextjsProject(true);

      expect(fs.writeFileSync).toHaveBeenCalledWith(
        "intl-party.config.ts",
        expect.stringContaining("IntlParty configuration"),
      );

      expect(fs.writeFileSync).toHaveBeenCalledWith(
        "middleware.ts",
        expect.stringContaining("createSetup"),
      );

      expect(result).toBe(true);
      expect(consoleLog).toHaveBeenCalledWith(
        expect.stringContaining("IntlParty initialized successfully"),
      );
    });
  });
});
