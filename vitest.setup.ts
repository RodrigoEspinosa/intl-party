import { beforeEach, vi } from "vitest";
import "@testing-library/jest-dom";

// Mock window and navigator for browser-specific tests
Object.defineProperty(window, "location", {
  value: {
    href: "http://localhost:3000",
    pathname: "/",
    search: "",
    hash: "",
  },
  writable: true,
});

Object.defineProperty(window, "navigator", {
  value: {
    language: "en-US",
    languages: ["en-US", "en"],
    userAgent: "Mozilla/5.0 (Node.js) Test",
  },
  writable: true,
});

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn(),
};

Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
  writable: true,
});

// Mock sessionStorage
Object.defineProperty(window, "sessionStorage", {
  value: localStorageMock,
  writable: true,
});

// Reset mocks before each test
beforeEach(() => {
  vi.clearAllMocks();
  localStorageMock.getItem.mockReturnValue(null);
});
