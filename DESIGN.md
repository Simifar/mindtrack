# MindTrack design system

## Product direction

MindTrack is a quiet, local-first companion for noticing patterns and preparing for a conversation with a clinician. The interface should feel steady and private, not clinical or diagnostic. It should make the next useful action easy to find and leave enough room for sensitive wording.

## Visual language

- Use warm paper and soft stone surfaces in light mode, with deep charcoal and muted green surfaces in dark mode.
- Use muted teal as the main action color. Keep red, amber, and green for meaning such as urgent help and score categories; never use color as the only cue.
- Use the system sans-serif stack. Do not load fonts or assets from a third party.
- Prefer clear section headings, short descriptions, readable line lengths, and generous spacing over decoration.
- Cards group related information; use light borders and restrained shadows. Avoid a grid of identical, strongly outlined panels.
- Keep motion short and subtle. Respect `prefers-reduced-motion` and preserve visible keyboard focus.

## Layout and navigation

- Keep the existing static Next.js export, explicit base-path support, and browser-only storage.
- At desktop widths, use one persistent left navigation rail and a compact top bar.
- At mobile widths, keep one bottom navigation with five destinations, safe-area spacing, 44px minimum targets, and enough page padding to scroll the last content clear of it.
- Let long forms use a readable single-column flow with optional grouped sections. Keep page content within a comfortable reading width.
- Check 320px, 390px, tablet, desktop, and print layouts. Long labels and text must wrap without horizontal scrolling.

## Components and interaction

- Buttons name the action and have visible hover, focus, disabled, and pressed states.
- Test cards show name, purpose, question count, estimated time, and prior status without suggesting a diagnosis.
- Test questions show one item at a time, the time frame, answer progress, and a clear Back/Next action. A saved draft can be resumed or deliberately restarted.
- Results distinguish a complete scored questionnaire from an incomplete record. Never show a calculated category, normalized score, or advice for unanswered items.
- Diary and appointment-preparation forms keep an unsaved local draft, show whether it is saved, and offer a clear way to discard it. Saving an entry remains a separate, explicit action.
- Sensitive crisis support is immediately reachable, states that MindTrack does not assess risk or contact anyone, and offers region-labeled resources.
- Dialogs have an accessible name and description, move and trap focus, close with Escape, and return focus to the opener.

## Privacy and content

- User content stays in this browser. No account, server storage, analytics, or external AI service is part of the product.
- Clearly say which data is stored, how to export it, and how to delete results, drafts, diary entries, and appointment notes.
- Keep instrument wording intact unless a source-verified correction and its tests are available. Describe translations and licenses honestly.
- A score is a screening or self-observation result, never a diagnosis or a risk assessment. Do not invent cutoffs or imply that a result is within a healthy range when the instrument has no validated cutoff.
- Use calm, direct Russian copy. Avoid judgment, pressure, and promises about outcomes.

## Accessibility and verification

- Use semantic landmarks, headings, labels, and links. All core flows must work by keyboard.
- Preserve focus indicators, sufficient text contrast, reduced-motion preferences, and reflow at 320px.
- Automated coverage checks scoring boundaries, incomplete data, storage failures, import validation, drafts, crisis behavior, and route navigation.
- Browser review checks real wrapping, focus movement, viewport fit, print output, and the visible states of forms, results, and support.
