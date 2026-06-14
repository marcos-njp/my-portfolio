# Nihilita Typography Design Guide

This guide details the typography system used in the Nihilita finance app, inspired by the high-contrast, minimalist **Nothing Company** design aesthetic. It explains the roles of the font families, details the custom CSS rules (sizes, weights, letter-spacing, and line-heights), and provides standard Google Fonts alternatives so you can easily replicate this exact layout on your website.

---

## Typography Hierarchy & Roles

Nihilita uses a strict four-font typography system. Each font family is assigned a single, clear role:

| Font Family | Visual Style | App Role | Web Safe Google Font Alternative |
| :--- | :--- | :--- | :--- |
| **Ndot55** | Dot-matrix LED grid | Brand titles, Large display items | [Silkscreen](https://fonts.google.com/specimen/Silkscreen) or [VT323](https://fonts.google.com/specimen/VT323) |
| **LetteraMonoLL** | Condensed editorial mono | UI labels, Buttons, Field labels (All-caps) | [Share Tech Mono](https://fonts.google.com/specimen/Share+Tech+Mono) or [Space Mono](https://fonts.google.com/specimen/Space+Mono) |
| **NType82Regular**| Geometric sans-serif | Readable copy, user notes, form inputs | [Outfit](https://fonts.google.com/specimen/Outfit) or [Inter](https://fonts.google.com/specimen/Inter) |
| **NType82Mono** | Monospaced digits | Currency numbers, dates, tabular lists | [JetBrains Mono](https://fonts.google.com/specimen/JetBrains+Mono) or [Space Mono](https://fonts.google.com/specimen/Space+Mono) |

---

## Key Web Design Principles

To recreate this signature look on a website, follow these visual rules:
1. **High Contrast**: Pure black background (`#000000` or `#0A0A0A`), stark white text (`#FFFFFF` or `#F5F5F5`), and dark gray borders (`#2E2E2E`).
2. **Uppercase Spacing**: UI labels must be `UPPERCASE` with wide letter-spacing (`1.5px` to `2.5px`).
3. **Tabular Monospace Figures**: Amount displays must use tabular numbers (`font-variant-numeric: tabular-nums`) so decimal points and digits align vertically in lists.
4. **Thin Borders**: Use thin, non-elevated borders (`1px solid #2E2E2E`) and spacious negative space instead of cards, fills, or shadows.

---

## Replicating the System on a Website (HTML/CSS)

You can load equivalent open-source Google Fonts and replicate the design tokens with the following copy-pasteable template.

### 1. CSS Custom Properties & Classes

Add this to your website's stylesheet:

```css
/* Import Google Fonts equivalents */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500&family=JetBrains+Mono:wght@400;500;600&family=Share+Tech+Mono&family=Silkscreen&display=swap');

:root {
  /* Colors */
  --bg-primary: #0A0A0A;
  --bg-secondary: #1A1A1A;
  --border-color: #2E2E2E;
  --text-primary: #F5F5F5;
  --text-secondary: #9A9A9A;
  --accent-white: #FFFFFF;
  --accent-green: #4ADE80;
  --error-red: #FF4444;

  /* Font Families */
  --font-brand: 'Silkscreen', monospace;
  --font-label: 'Share Tech Mono', monospace;
  --font-body: 'Inter', sans-serif;
  --font-mono: 'JetBrains Mono', monospace;
}

/* Base resets */
body {
  background-color: var(--bg-primary);
  color: var(--text-primary);
  font-family: var(--font-body);
  margin: 0;
  padding: 0;
  -webkit-font-smoothing: antialiased;
}

/* ── Typography Classes ── */

/* App Logo/Large Brand moments (Ndot55 alternative) */
.brand-title {
  font-family: var(--font-brand);
  font-size: 48px;
  color: var(--accent-white);
  letter-spacing: 4px;
  text-transform: uppercase;
  margin: 0 0 16px 0;
}

/* Field labels and section headers (LetteraMonoLL alternative) */
.field-label {
  font-family: var(--font-label);
  font-size: 12px;
  font-weight: 400;
  color: var(--text-secondary);
  letter-spacing: 2px;
  text-transform: uppercase;
  display: block;
}

/* Large numbers (NType82Mono alternative) */
.amount-hero {
  font-family: var(--font-mono);
  font-size: 38px;
  font-weight: 600;
  color: var(--accent-white);
  /* Force monospaced numeric spacing for tabular columns */
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.5px;
}

/* List amounts */
.amount-list {
  font-family: var(--font-mono);
  font-size: 18px;
  font-weight: 500;
  font-variant-numeric: tabular-nums;
}

/* Body / metadata */
.body-text {
  font-family: var(--font-body);
  font-size: 15px;
  font-weight: 400;
  color: var(--text-primary);
  line-height: 1.5;
}

.text-meta {
  font-family: var(--font-body);
  font-size: 13px;
  color: var(--text-secondary);
}

/* Buttons */
.button-primary {
  font-family: var(--font-label);
  font-size: 13px;
  font-weight: 500;
  letter-spacing: 1.8px;
  text-transform: uppercase;
  background-color: var(--accent-white);
  color: var(--bg-primary);
  border: none;
  padding: 14px 28px;
  cursor: pointer;
  width: 100%;
}

.button-primary:hover {
  background-color: var(--text-secondary);
}
```

### 2. Example HTML Implementation

Here is an example layout demonstrating how these CSS definitions align:

```html
<div style="max-width: 400px; margin: 40px auto; padding: 24px; border: 1px solid var(--border-color); background-color: var(--bg-primary);">
  
  <!-- Logo/Title -->
  <h1 class="brand-title">NIHILITA</h1>
  
  <!-- Section Title -->
  <div style="border-bottom: 1px solid var(--border-color); padding-bottom: 12px; margin-bottom: 24px;">
    <span class="field-label">TOTAL EXPENSES</span>
    <div class="amount-hero" style="color: var(--error-red);">₱ 1,480.50</div>
  </div>

  <!-- Row Item 1 -->
  <div style="display: flex; justify-content: space-between; align-items: center; padding: 16px 0; border-bottom: 1px solid var(--border-color);">
    <div>
      <span class="field-label">FOOD</span>
      <div class="text-meta">Lunch at Bistro</div>
    </div>
    <div class="amount-list" style="color: var(--error-red);">-₱ 450.00</div>
  </div>

  <!-- Row Item 2 -->
  <div style="display: flex; justify-content: space-between; align-items: center; padding: 16px 0; border-bottom: 1px solid var(--border-color);">
    <div>
      <span class="field-label">SAVINGS</span>
      <div class="text-meta">Monthly Deposit</div>
    </div>
    <div class="amount-list" style="color: var(--accent-green);">+₱ 1,000.00</div>
  </div>

  <div style="margin-top: 32px;">
    <button class="button-primary">ADD TRANSACTION</button>
  </div>
</div>
```
