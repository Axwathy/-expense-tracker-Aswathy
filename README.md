# CountCoin
### Every Spend, in Sight.

CountCoin is a personal expense tracker for logging income and expenses, seeing where your money is going, and keeping a running balance , all in the browser, with no backend required.

## Features

- Add income and expense transactions with amount, category, date, and description
- Edit existing transactions
- Delete transactions, with a confirmation dialog before removal
- Dynamic categories — the category dropdown updates based on whether Income or Expense is selected, and resets on switch
- Financial summary: Available Funds, Total Inflows, Total Outflows
- Filter transactions by type (All / Income / Expense) and by category
- Search transactions by category or description
- Sort by newest first, oldest first, highest amount, or lowest amount
- Monthly overview with a month selector, showing that month's income, expenses, and balance
- Weekly spending trend chart for the selected month
- Expense breakdown by category, shown as a bar chart
- Form validation for amount, category, date, and description
- Data persistence via the browser's Local Storage
- Responsive layout for desktop, tablet, and mobile

## Category System

Categories depend on the transaction type:

**Income categories:** Salary, Freelance, Business, Investment, Bonus, Other Income

**Expense categories:** Food, Transport, Shopping, Bills, Entertainment, Health, Education, Rent, Other Expense

Switching between Income and Expense in the form updates the available categories and clears the current selection, so a category from one type can't be saved against the other.

## Financial Summary

The dashboard shows three figures, calculated live from stored transactions:

- **Available Funds** — Total Inflows minus Total Outflows
- **Total Inflows** — sum of all income transactions
- **Total Outflows** — sum of all expense transactions

## Data Persistence

Transaction data is persisted using the browser's Local Storage, so it remains available after refreshing the page. There is no backend or database — everything runs client-side.

## Validation

Before a transaction is saved, the form checks:

- **Amount** — must be a valid number greater than 0
- **Category** — must be selected, and must belong to the currently selected type (Income/Expense)
- **Date** — required
- **Description** — required; empty or whitespace-only descriptions are rejected

Validation errors are shown inline next to each field.

## Analytics

**Monthly Overview** — pick a month and see that month's income, expenses, and balance, calculated from the transactions dated within it.

**Spending by week** — the selected month's expenses are grouped into weekly buckets and shown as a bar chart.

**Expenses by category** — total expenses per category are shown as horizontal bars, sorted from highest to lowest. Both charts update automatically as transactions are added, edited, or deleted, and show an empty state when there's no expense data yet.

## Responsive Design

The layout adapts across desktop, tablet, and mobile widths, with breakpoints for the form/list layout, summary cards, filters, and transaction rows.

## Tech Stack

- HTML5
- CSS3 (custom properties for the design system)
- Vanilla JavaScript (no frameworks or libraries)
- Browser Local Storage
- Google Fonts (Inter, Source Serif 4)

## Project Structure

```
index.html
style.css
script.js
```

## Getting Started

1. Clone the repository
2. Open the project folder
3. Open `index.html` in a browser

No build step or dependencies are required.

## How It Works

1. User adds an income or expense using the form.
2. The form validates amount, category, date, and description.
3. The transaction is saved to Local Storage.
4. The transaction list, financial summary, monthly overview, and charts update.
5. Users can edit or delete transactions, or filter, search, and sort the list.

## Design

CountCoin uses a warm cream background with an olive green primary color, and restrained green/rust accents for income and expense amounts. The layout is card-based, with the Available Funds figure set apart as the primary metric. The interface is built around the CountCoin wordmark and its "Every Spend, in Sight." tagline.

## Future Improvements

These are ideas for later, not current functionality:

- Backend/database support for syncing across devices
- Export/import of transaction data
- Additional financial reports (e.g. yearly trends)
