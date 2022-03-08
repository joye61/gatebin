import path from "path";

export default {
  clearMocks: true,
  collectCoverage: true,
  coverageDirectory: "coverage",
  coverageProvider: "v8",
  globals: {
    "ts-jest": {
      isolatedModules: true,
    },
  },
  preset: "ts-jest",
  rootDir: path.resolve(__dirname, "."),
  roots: ["<rootDir>/client", "<rootDir>/node_modules"],
  testEnvironment: "jsdom",
  testMatch: ["**/*.test.ts?(x)"],
  testPathIgnorePatterns: [
    "<rootDir>/node_modules/",
    "<rootDir>/dist/",
    "<rootDir>/server",
  ],
};
