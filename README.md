# Ujwal's portfolio

Static React + Vite portfolio. Recruiter landing page at `/`; the Systems project view is at `/systems` (`/explore` remains an alias), and the blog preview is at `/blog`.

## Local development

```sh
npm install
npm run dev
```

## Content

- `src/content/profile.json`: public profile, education, training, awards, and contact links.
- `src/content/skills.json`: concise skill groups.
- `src/content/project-registry.json`: manually curated public project list. `visible`, `featured`, and `technical_exploration` are independent; homepage shows at most five featured projects.
- `src/content/github-cache.json`: cached metadata for only the repositories in the registry.
- `public/resume.pdf`: the supplied CV, linked for viewing and download.

GitHub repositories are never discovered or published automatically. Only repositories explicitly entered in `project-registry.json` are queried by `npm run sync:github`. Custom titles and descriptions in the registry take precedence over GitHub metadata. An optional `GITHUB_TOKEN` is used only by the build-time sync script, never sent to site visitors.

The Systems navigation button uses a short native Web Animations API + CSS clip-path portal transition. Direct URL navigation stays immediate; reduced-motion settings skip the animation.

Use honest, owner-reviewed details in the registry and profile. Do not add private contact information unless it is intended to be public.
