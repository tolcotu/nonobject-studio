# Verification and delivery

## Result
The final production build succeeds. Thirteen domain/API tests pass. Browser interaction checks pass against an isolated server and temporary data directory. No real emails or Telegram messages were sent.

## Visual evidence
Local visual captures in `docs/screenshots/` include the opening, four intermediate/resolved story positions, gallery and pricing at:

- Desktop: 1440 × 1000
- Large desktop: 1920 × 1080
- Tablet: 834 × 1112
- Mobile: 390 × 844
- Compact mobile: 360 × 640
- Reduced motion: 390 × 844

All six final runs report no document overflow, broken images, browser runtime errors or automated WCAG A/AA violations. The automated accessibility check is a useful baseline, not a full accessibility certification. Production-package, no-JavaScript, form-success, mobile-form and ending captures are also included.

## Defects found and resolved
1. The first gallery offset covered part of the preceding caption. Reduced the overlap and inspected the corrected composition.
2. The compact phone story stage extended beyond the viewport. Added a separate short-screen composition so the complete object, buyer questions, caption and action fit together.
3. The initial image check ran before lazy images loaded and included a deliberately empty dialog image. Changed the check to decode actual `img[src]` assets before inspection. The final result contains no broken images.
4. The first tablet accessibility sample captured an entrance mid-transition. The final harness waits for the completed state; all tested viewport scans pass.
5. Running a second development server exposed a Vite HMR socket collision. Attached HMR to each server's actual HTTP instance; the final isolated interaction run has no runtime errors.
6. No-JavaScript inspection prompted an explicit stylesheet link so the complete site remains styled when scripting is unavailable. The form remains disabled, provides an explanation and never falls back to sending personal data in a URL.

Initial reports are preserved in `verification-initial.json` and `interactions-initial.json`. `verification.json` and `interactions.json` supersede them. The initial interaction report's premature `passed` flag is superseded by the final error-sensitive result.

## Functional checks
Verified buyer-question selection carries into the enquiry; gallery and legal dialogs open and close with Escape; FAQs expand; products can be added and removed; quantity validation blocks fewer than 3 images; exactly 9 costs €65; rush adds 30%; 10+ produces a custom-quote state; uploads reject unsupported file types; every SKU requires photos; failed requests preserve inputs and selected files; retry persists a single enquiry; per-SKU files remain independent; preview success does not claim email delivery; summary download works; new brief resets; mobile menu closes on navigation.

Domain/API tests additionally cover invalid contact data, missing consent, duplicate SKUs/IDs, unsupported URLs, mismatched image contents, safe file paths, missing files, rate limiting, origin checks and persistent retry deduplication.

## Production package
The built `dist/` was served by the real Express production entry point on a separate local port. Images, fonts, CSS, scroll engine and form modules loaded without failed requests. Private data/config/server-source paths returned 404. Unconfigured production enquiries returned 503. The no-JavaScript layout remained styled and its submit button disabled.

`npm audit` reported zero vulnerabilities during dependency review.

## Feel check
Intended curve: curiosity → recognition → delight → interest → trust → clarity → resolve.

First visual review: the orange/chrome opening carried curiosity immediately; the quiet statement gave a useful pause; the desktop assembly made the intended visual turn. The initial compact-phone composition obstructed the turn's controls, and the gallery overlap undermined clarity. Those were concrete composition failures, not changes to the intended curve. After correcting them, the sampled frames preserve the object, annotations and useful controls together, then settle into readable commercial information and a real brief. The orange wordmark close remains a stable final frame.

Peak: an isolated object gains a frame, detail and explanatory context under the visitor's scroll. The story stage receives the longest deliberate motion span. Administrative sections use normal flow. No blank dwell screens were added.

Grammar: custom studio contact sheet, documented with alternatives and constraints in `scrollcraft/builds/nonobject/BRIEF.md`. Fingerprint registry was empty at planning; the delivered build now has its first row. Brief/design decisions were self-authored from the supplied PRD and the user's request to choose a studio name and build.

## Not verified or connected
No real SMTP/Telegram credentials or delivery were tested. No Google Drive integration, public deployment, real iPhone hardware test, independent screen-reader audit, legal approval, automated deletion or malware scanning is claimed. Enquiry storage works locally; production requires a persistent private volume and the documented owner configuration. Live portfolio cases and company/contact details remain intentionally absent until supplied.

## GitHub Pages mode

The Pages build uses a `/nonobject-studio/` base path and a separate explicit demo flag. It never requests `/api/config` or posts enquiry files. After browser-only validation, it downloads a locally generated JSON brief and labels it clearly as unsent and unsaved. The standard local/server build keeps the real Express API.
