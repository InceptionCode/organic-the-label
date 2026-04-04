# Release Process

## Branch model

- `main` = production
- `dev` = development/staging
- `feat/*` = feature branches
- `fix/*` = bugfix branches

## Feature workflow

1. Branch from `dev`
2. Implement feature
3. Test local dev & prod (run pnpm serve for prod build testing)
4. Push branch
5. Open PR into `dev`
6. CI must pass
7. Merge into `dev`
8. Verify on `dev.organicsonics.com`

## Production release workflow

1. Ensure `dev` is stable
2. Open PR from `dev` into `main`
3. CI must pass
4. Run release checklist
5. Merge into `main`
6. Verify deployment on production

## Hotfix workflow

1. Branch from `main`
2. Create `fix/*` branch
3. Push and open PR into `main`
4. CI must pass
5. Merge into `main`
6. Back-merge the same fix into `dev`
