# CountCoin

**Every Spend, in Sight.**

A calm, warm personal finance tracker built with plain HTML, CSS, and JavaScript. Track income and expenses, browse and filter your transaction history, and see a monthly breakdown of where your money goes — all stored locally in your browser, no backend required.

---

## Features

- **Add, edit, and delete transactions** — income or expense, with amount, category, date, and an optional description.
- **Type-aware categories** — the category list updates automatically based on whether you're logging Income or an Expense, so mismatched combinations (e.g. an Expense tagged "Salary") aren't possible.
- **Dashboard summary** — Available Funds, Total Inflows, and Total Outflows, calculated live from your transactions.
- **Filtering & search** — filter by type (All / Income / Expense), by category, and free-text search across category and description, with sort options (newest/oldest, highest/lowest amount).
- **Monthly Overview** — income, expenses, and balance for any month, plus a weekly spending trend chart for the selected month.
- **Expenses by Category** — a horizontal bar chart of spending by category, built from real transaction data (not hardcoded), with a graceful empty state when there's nothing to show yet.
- **Delete confirmation modal** — accidental deletes are one extra click away from being undone.
- **Toast notifications** — lightweight confirmation on add/update/delete.
- **Form validation** — required amount (> 0), category, and date, with inline error messages.
- **Persistent storage** — everything is saved to `localStorage`, so your data survives a page refresh or browser restart.
- **Responsive layout** — tested at 1440, 1200, 1024, 768, 480, 390, and 375px wide, with no horizontal scrolling at any size.

## Tech Stack

- HTML5
- CSS3 (custom properties / design tokens, CSS Grid & Flexbox — no framework)
- Vanilla JavaScript (no build step, no dependencies)
- Browser `localStorage` for persistence

## Project Structure

```
.
├── index.html   # Markup and app shell
├── style.css    # All styling, design tokens, and responsive rules
├── script.js    # App logic: state, rendering, validation, storage
└── README.md
```

## Getting Started

No build tools or installation required.

1. Download the three files (`index.html`, `style.css`, `script.js`) into the same folder.
2. Open `index.html` directly in a browser — or, for the most consistent experience (some browsers restrict `localStorage` on `file://` pages), serve the folder locally:

   ```bash
   # from the project folder
   python3 -m http.server 8000
   ```

   Then visit `http://localhost:8000` in your browser.

That's it — no `npm install`, no build step.

## How Data Is Stored

Transactions are saved under the `expenseTracker.transactions` key in `localStorage`, as a JSON array of objects shaped like:

```json
{
  "id": "tx_...",
  "type": "expense",
  "amount": 1200,
  "category": "Food",
  "date": "2026-09-10",
  "description": "Groceries",
  "createdAt": 1234567890
}
```

Clearing your browser's site data for this page (or clearing `localStorage`) will reset the app to empty.

## Categories

**Income:** Salary, Freelance, Business, Investment, Bonus, Other Income
**Expense:** Food, Transport, Shopping, Bills, Entertainment, Health, Education, Rent, Other Expense

## Browser Support

Built with standard, widely-supported CSS and JS (Grid, Flexbox, `<dialog>`-free modal, `Intl`/`toLocaleDateString`). Works in current versions of Chrome, Firefox, Safari, and Edge.

## Notes

- The app ships with no pre-loaded sample data — it starts empty for every new user/browser.
- All calculations (`Available Funds = Total Inflows − Total Outflows`, monthly totals, category breakdowns) are derived live from stored transactions; nothing is hardcoded.