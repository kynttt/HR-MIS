# rules.md

## Engineering Principles

---

## 1. Architecture First
Always design before coding.

---

## 2. Separation of Concerns
Never mix:
- UI
- validation
- data
- business logic

---

## 3. Strong Typing
- no `any`
- use TypeScript strictly

---

## 4. Validation
- Zod for forms
- validate all inputs

---

## 5. Security
- enforce RLS
- do not trust frontend
- protect storage

---

## 6. Clean Code
- readable
- small components
- descriptive names

---

## 7. Database Rules
- UUID primary keys
- created_at, updated_at
- foreign keys
- normalized design

---

## 8. Do NOT
- overengineer
- hardcode secrets
- skip validation
- mix concerns
- create giant components

---

## 9. UI Rules
- clean admin UI
- loading states
- error states
- empty states

---

## 10. Data Modeling Rule
IMPORTANT:

Applicant and Employee must be separate entities.

Use conversion flow.

---

## 11. Definition of Done
- works
- typed
- secure
- readable
- scalable