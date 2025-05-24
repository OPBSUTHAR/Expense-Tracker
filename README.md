# NeoFinance Expense Tracker

**NeoFinance Expense Tracker** is a modern, user-friendly web application designed to help you efficiently track your income and expenses. It offers detailed transaction management, visualization through charts, data import/export, and cloud backup simulation for data safety.

---

## Features

- **Add, Edit, and Delete Transactions:** Easily manage your income and expenses with intuitive forms and modals.
- **Dynamic Categories:** Categories update based on transaction type (income or expense).
- **Transaction Filtering and Sorting:** Sort transactions by date, amount, or category for better overview.
- **LocalStorage Persistence:** Transactions are saved in the browser for persistent data storage.
- **Import and Export:** Export transactions as JSON files or import from valid JSON backups.
- **Responsive Charts:** Visualize your finances dynamically with color-coded charts that adjust on window resize.
- **Notifications:** Real-time success/error messages for user feedback.
- **Animations:** Smooth UI transitions and highlighting for updates and modals.
- **Keyboard Accessibility:** Use keyboard shortcuts like Escape to close modals and Enter to submit forms.
- **Currency Formatting:** Automatic locale-based currency formatting.
- **Mock Cloud Backup:** Simulated cloud backup every 5 minutes to prevent data loss.

---

## Usage

1. **Adding a Transaction:**
   - Fill in the date, type (income or expense), amount, category, and description.
   - Click submit to add the transaction.

2. **Editing a Transaction:**
   - Click the edit button next to a transaction.
   - Modify the details in the modal that appears.
   - Save changes or delete the transaction.

3. **Importing Transactions:**
   - Use the file input to upload a `.json` file exported from the app.
   - The app merges valid transactions avoiding duplicates.

4. **Exporting Transactions:**
   - Click the export button to download all transactions as a `.json` file.

5. **Viewing Charts and Summary:**
   - The app displays income and expense summaries.
   - Charts update dynamically with color coding based on CSS variables.

6. **Keyboard Shortcuts:**
   - Press `Escape` to close modals.
   - Press `Enter` to submit forms when focused inside form fields.

---

## Installation

No installation needed — just open `index.html` in any modern browser.

---

## File Structure

- **index.html** — Main HTML structure and elements.
- **styles.css** — Styles including variables, layout, animations, and responsiveness.
- **script.js** — JavaScript logic handling transactions, UI updates, validation, notifications, and chart rendering.

---

## Technical Details

- Uses **CSS Custom Properties** (`--chart-colors`, `--income-color`, `--expense-color`, etc.) for theming and chart color management.
- Utilizes **LocalStorage** for persistent transaction storage.
- Implements **FileReader API** for importing JSON files.
- Uses **Blob API** and download links for exporting data.
- Includes **Animate.css** classes for smooth modal and notification animations.
- Chart rendering logic adapts colors dynamically with window resizing.
- Provides real-time input validation with visual feedback.

---

## Contribution

Feel free to fork the repository and submit pull requests with improvements or bug fixes.

---

## License

MIT License — free to use and modify.

---

## Author

NeoFinance Development Team

## Preview

![alt text](image.png)
