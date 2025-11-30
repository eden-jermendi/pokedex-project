# Project Overview

This project is a React application that demonstrates how to consume external APIs. It uses the Pokemon API as an example. The application is built with Vite and uses TypeScript.

## Building and Running

To get the project running locally, follow these steps:

1.  **Install dependencies:**
    ```bash
    npm install
    ```
2.  **Run the development server:**

    Prompt the user to run the development server themselves in a separate terminal window.

    ```bash
    npm run dev
    ```
3.  **Build for production:**
    ```bash
    npm run build
    ```
4.  **Run tests:**
    ```bash
    npm test -- --run
    ```

## Development Conventions

*   **Component-Based Architecture:** The application is built using a component-based architecture with React. Components are located in the `client/components` directory.
*   **Styling:** The project uses CSS for styling. The main stylesheet is located at `client/styles/main.css`.
*   **API Interaction:** The project uses the `superagent` library for making HTTP requests to the Pokemon API. The API client is located at `client/apiClient.ts`.
*   **Data Management:** The data models for the application are defined as TypeScript interfaces in the `models` directory.
*   **Linting and Formatting:** The project uses ESLint for linting and Prettier for code formatting. You can run the linter and formatter with the following commands:
    ```bash
    npm run lint
    npm run format
    ```

## PromptKit Quick Reference
- Review the available artefacts when the student requests them:
  - Protocol: `promptkit/protocols/setup.md` — instructions for updating these CLI briefings.
  - Workflow: `promptkit/workflows/tutor.md` — guide for tutoring/explanation sessions.
  - Workflow: `promptkit/workflows/reflect.md` — guide for documenting outcomes and next steps.
- Student notes live in `promptkit/notes/`; The table in `progress-journal.md` is main place to update with reflections. Instructor Activities are in `promptkit/activities/` (read-only).
- When new workflows arrive, expect additional files under `promptkit/workflows/`.