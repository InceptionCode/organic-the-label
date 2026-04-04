# Pull Request

> Select the PR type below, then use the matching URL if you want GitHub to prefill the more specific template.
>
> Replace:
>
> - `YOUR_BRANCH` with your branch name

---

## PR Type

- [ ] **Feature branch into `dev`**

  - Use when merging `feature/*` into `dev`
  - Prefill URL:
    ```text
    https://github.com/InceptionCode/organic-the-label/compare/dev...YOUR_BRANCH?expand=1&template=feature.md
    ```

- [ ] **`dev` into `main`**

  - Use when promoting the integrated `dev` branch into production
  - Prefill URL:
    ```text
    https://github.com/InceptionCode/organic-the-label/compare/main...dev?expand=1&template=dev-to-main.md
    ```

- [ ] **Hotfix branch into `main`**
  - Use when merging a non-`dev` branch directly into `main`
  - Prefill URL:
    ```text
    https://github.com/InceptionCode/organic-the-label/compare/main...YOUR_BRANCH?expand=1&template=hotfix-main.md
    ```

---

## Summary

Describe what this PR changes and why.

-
-
-

---

## Related Issue / Ticket

- Closes #
- Related to #

---

## Testing

Describe how this was tested.

- [ ] Tested locally
- [ ] Added or updated tests
- [ ] Verified happy path
- [ ] Verified edge cases

Notes:

-
-
-

---

## Screenshots / Video

Include screenshots or recordings for UI changes.

- N/A

---

## Deployment Notes

Anything reviewers or deployers should know.

- N/A

---

## Hotfix Justification

Required only if this PR goes directly into `main` from a non-`dev` branch.

- N/A

---

## Risk / Rollback

What could be affected, and how would this be rolled back if needed?

- Risk:
- Rollback plan:

---

## Checklist

- [ ] I selected the correct PR type above
- [ ] My branch targets the correct base branch
- [ ] I updated documentation if needed
- [ ] I removed debug code / console logs
- [ ] No secrets or sensitive data were added
- [ ] This PR is appropriately scoped and ready for review
