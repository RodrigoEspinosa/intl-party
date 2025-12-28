# no-hardcoded-strings

Disallow hardcoded strings in JSX elements and specific attributes. This rule helps identify text that should be internationalized.

## Rule Details

This rule checks for literal strings in JSX text and specific JSX attributes (like `placeholder`, `title`, etc.) and suggests replacing them with a translation function call.

### Examples

❌ **Incorrect**

```tsx
<div>Welcome to our app</div>
<input placeholder="Enter your name" />
```

✅ **Correct**

```tsx
<div>{t('welcome')}</div>
<input placeholder={t('enter_name')} />
```

## Options

### `attributes` (default: `['placeholder', 'title', 'aria-label', 'aria-description', 'alt']`)

An array of JSX attribute names to check for hardcoded strings.

### `ignorePattern`

A regex pattern for strings to ignore (e.g., for technical strings or brand names).

### `minLength` (default: 3)

The minimum length of a string before it's flagged as a hardcoded string.

### `allowedStrings`

An array of specific strings that are always allowed and won't be flagged.

