import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
    plugins: [react()],

    test: {
        environment: "jsdom",

        globals: true,

        setupFiles: ["./test/setup.js"],

        include: [
            "test/**/*.{test,spec}.{js,jsx}",
            "src/**/*.{test,spec}.{js,jsx}",
        ],

        coverage: {
            provider: "v8",

            reporter: ["text", "html", "lcov"],

            reportsDirectory: "./coverage",

            include: ["src/**/*.{js,jsx}"],

            exclude: [
                "src/**/*.test.{js,jsx}",
                "src/**/*.spec.{js,jsx}",
                "src/main.jsx",
                "src/test/**",
            ],
        },
    },
});