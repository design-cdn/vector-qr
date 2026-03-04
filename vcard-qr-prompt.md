# vCard QR Generator — Extension Prompt

## Context

I have an existing Next.js application called "QR to Vector" that converts QR code images to crisp SVG vectors. The app supports drag & drop, paste, and URL input, and has a persistent history of the last 10 generated QR codes (stored in localStorage) displayed in a "Recent Generations" grid at the bottom of the page.

I want to extend this application with a **vCard QR Generator** module. Here is the full specification:

---

## 1. Navigation — Two tabs under the main title

- `QR from Image` — the existing functionality, unchanged
- `vCard Generator` — the new module described below

Each tab has its own independent UI and history. Nothing is shared visually between them.

---

## 2. vCard Generator — Top section: The Form

A clean, dark-styled form consistent with the existing UI, with two logical field groups:

### Company fields (template — saved per company)

| Field | vCard property |
|---|---|
| Company Name | `ORG` |
| Address | `ADR` — single text field, not structured |
| Website | `URL` |
| Company Phone | `TEL` type WORK |

### Individual fields (per person — not saved in company template)

| Field | vCard property |
|---|---|
| First Name + Last Name | `N` / `FN` |
| Job Title | `TITLE` |
| Role / Department | `ROLE` |
| Mobile Phone | `TEL` type CELL |
| Direct Line | `TEL` type WORK DIRECT |
| Email | `EMAIL` |
| Notes (optional) | `NOTE` |

### Form actions

- `Save Company` — saves the company fields as a named template in localStorage
- `Generate vCard QR` — generates a vCard 3.0 string from all filled fields, converts it to an SVG QR code, and displays it in a Result panel (same style as the existing result panel), with Copy SVG and Download SVG buttons

---

## 3. vCard Generator — Bottom section: Company Grid

A responsive grid of saved company cards, visible only on the vCard tab.

Each card displays:
- A generic vCard icon (clean, consistent with the dark UI)
- The company name
- An **Edit** button (pencil icon) — loads the company data back into the company fields of the form for editing, then re-saving
- A **Delete** button (trash icon) — removes the company from localStorage, with a confirmation step

Clicking the card (not the edit/delete buttons) preloads the company fields into the form above and clears the individual fields, ready for a new person entry.

---

## 4. Per-company accordion — Generation history

Below each company card, an expandable accordion section showing the history of individual vCards generated for that company.

Each history entry shows:
- A small preview of the generated SVG QR code
- Person's full name
- Job title / role
- Copy SVG button
- Download SVG button

At the bottom of the accordion: a **"+ New Person"** button that:
- Preloads the company data into the form
- Scrolls to the form
- Clears and focuses the First Name field

History per company is stored in localStorage. Keep the last **20 entries per company**.

---

## 5. vCard format

Generate **vCard 3.0** format. Example structure:

```
BEGIN:VCARD
VERSION:3.0
FN:John Doe
N:Doe;John;;;
ORG:Acme SRL
TITLE:Sales Manager
ROLE:Sales
TEL;TYPE=CELL:+40721000000
TEL;TYPE=WORK:+40221000000
TEL;TYPE=WORK:+40221000001
EMAIL:john.doe@acme.ro
ADR;TYPE=WORK:;;Str. Exemplu 1;București;;010000;România
URL:https://acme.ro
NOTE:Optional note here
END:VCARD
```

---

## 6. Design requirements

- Match the existing dark theme exactly (background, card styles, border radius, typography, button styles)
- The company grid and accordion should feel native to the existing "Recent Generations" section style
- Use the same Copy and Download button icon style as the existing history items
- The two tabs should be styled as **pill-style toggle buttons**, centered under the main title/subtitle
- All localStorage keys for vCard data must be **namespaced separately** from the existing QR history keys to avoid conflicts

---

## 7. Technical notes

- Do not modify any existing functionality
- QR generation from vCard string: use the same QR generation library already used in the project
- All new state and persistence must be isolated in new hooks or utility files
- The form should be a controlled React component with proper validation:
  - Required fields: Company Name, Full Name, at least one phone or email
