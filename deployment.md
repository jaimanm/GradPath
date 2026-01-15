# Deploying GradPath to GitHub Pages

Since you already have the code pushed to `github.com/jaimanm/gradpath` and your personal site is `jaimanm.github.io`, you can deploy this project as a subdirectory site (`jaimanm.github.io/gradpath`).

## Steps

1.  **Go to GitHub Repository Settings**:
    *   Navigate to your repository: [https://github.com/jaimanm/gradpath](https://github.com/jaimanm/gradpath)
    *   Click on the **Settings** tab.

2.  **Configure Pages**:
    *   On the left sidebar, click on **Pages** (under the "Code and automation" section).
    *   Under **Build and deployment** > **Source**, select **Deploy from a branch**.
    *   Under **Branch**, select `main` (or whichever branch your code is on, e.g., `gh-pages-demo` if that's what you are using) and ensure the folder is set to `/` (root).
    *   Click **Save**.

3.  **Wait for Build**:
    *   GitHub Actions will automatically kick off a deployment. You can watch the progress in the **Actions** tab.

4.  **Verify**:
    *   Once the action creates the deployment, your site will be live at:
        `https://jaimanm.github.io/gradpath/`

## Troubleshooting
-   **Subdirectory Issues**: Since this is a vanilla JS/HTML app using relative paths (`src="app.js"`), it should work perfectly in a subdirectory without extra config.
-   **Caching**: If you don't see changes immediately, try doing a hard refresh (Cmd+Shift+R) or clearing your cache.
