const styles = `
:host {
  --color-white: #ffffff;
  --color-gray-50: #f9fafb;
  --color-gray-100: #f3f4f6;
  --color-gray-200: #e5e7eb;
  --color-gray-300: #d1d5db;
  --color-gray-400: #9ca3af;
  --color-gray-500: #6b7280;
  --color-gray-600: #4b5563;
  --color-gray-700: #374151;
  --color-gray-800: #1f2937;
  --color-gray-900: #111827;
  --color-blue-300: #93c5fd;
  --color-blue-400: #60a5fa;
  --color-blue-500: #3b82f6;
  --color-blue-600: #2563eb;
  --color-green-500: #10b981;
  --color-green-600: #059669;
  --color-orange-500: #f97316;
  --color-yellow-500: #eab308;
  --color-yellow-600: #ca8a04;
  --color-yellow-800: #92400e;
  --color-yellow-900: #78350f;
  --color-red-500: #ef4444;
  --color-red-600: #dc2626;
  --spacing: 0.25rem;
  --radius-sm: 0.125rem;
  --radius: 0.25rem;
  --radius-md: 0.375rem;
  --radius-lg: 0.5rem;
  --radius-xl: 0.75rem;
  --text-xs: 0.75rem;
  --text-xs--line-height: 1rem;
  --text-sm: 0.875rem;
  --text-sm--line-height: 1.25rem;
  --text-base: 1rem;
  --text-base--line-height: 1.5rem;
  --text-lg: 1.125rem;
  --text-lg--line-height: 1.75rem;
  --text-xl: 1.25rem;
  --text-xl--line-height: 1.75rem;
  --text-2xl: 1.5rem;
  --text-2xl--line-height: 2rem;
  --text-4xl: 2.25rem;
  --text-4xl--line-height: 2.5rem;
  --font-weight-medium: 500;
  --font-weight-semibold: 600;
  --font-weight-bold: 700;
  --tracking-wider: 0.05em;
  --font-geist-sans: ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji";
  --font-geist-mono: ui-monospace, SFMono-Regular, "Menlo", "Monaco", "Cascadia Code", "Segoe UI Mono", "Roboto Mono", "Oxygen Mono", "Ubuntu Monospace", "Source Code Pro", "Fira Mono", "Droid Sans Mono", "Courier New", monospace;
}

/* Base Styles */
*,
*::before,
*::after {
  box-sizing: border-box;
  border-width: 0;
  border-style: solid;
  border-color: currentcolor;
  margin: 0;
  padding: 0;
}

html,
:host {
  line-height: 1.5;
  -webkit-text-size-adjust: 100%;
  tab-size: 4;
  font-family: var(--font-geist-sans);
  font-feature-settings: normal;
  font-variation-settings: normal;
  -webkit-tap-highlight-color: transparent;
}

/* Dark mode support */
:host(.dark) {
  color-scheme: dark;
}

/* Transition utilities */
.transition-colors {
  transition-property: color, background-color, border-color, outline-color, text-decoration-color, fill, stroke;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 150ms;
}

.duration-200 {
  transition-duration: 200ms;
}

/* Animation utilities */
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.animate-spin {
  animation: spin 1s linear infinite;
}

/* Layout utilities */
.min-h-screen {
  min-height: 100vh;
}

.container {
  width: 100%;
}

@media (min-width: 40rem) {
  .container {
    max-width: 40rem;
  }
}

@media (min-width: 48rem) {
  .container {
    max-width: 48rem;
  }
}

@media (min-width: 64rem) {
  .container {
    max-width: 64rem;
  }
}

@media (min-width: 80rem) {
  .container {
    max-width: 80rem;
  }
}

@media (min-width: 96rem) {
  .container {
    max-width: 96rem;
  }
}

.mx-auto {
  margin-left: auto;
  margin-right: auto;
}

.flex {
  display: flex;
}

.inline-flex {
  display: inline-flex;
}

.grid {
  display: grid;
}

.block {
  display: block;
}

.hidden {
  display: none;
}

/* Flexbox utilities */
.flex-col {
  flex-direction: column;
}

.items-center {
  align-items: center;
}

.justify-center {
  justify-content: center;
}

.justify-between {
  justify-content: space-between;
}

/* Grid utilities */
.grid-cols-1 {
  grid-template-columns: repeat(1, minmax(0, 1fr));
}

.grid-cols-2 {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.grid-cols-4 {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.grid-cols-5 {
  grid-template-columns: repeat(5, minmax(0, 1fr));
}

@media (min-width: 40rem) {
  .sm\\:flex-row {
    flex-direction: row;
  }
  .sm\\:grid-cols-2 {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (min-width: 64rem) {
  .lg\\:grid-cols-2 {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .lg\\:grid-cols-4 {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}

@media (min-width: 80rem) {
  .xl\\:grid-cols-5 {
    grid-template-columns: repeat(5, minmax(0, 1fr));
  }
}

/* Gap utilities */
.gap-4 {
  gap: calc(var(--spacing) * 4);
}

/* Position utilities */
.relative {
  position: relative;
}

.absolute {
  position: absolute;
}

.bottom-full {
  bottom: 100%;
}

.left-0 {
  left: 0;
}

.top-full {
  top: 100%;
}

/* Z-index utilities */
.z-10 {
  z-index: 10;
}

/* Spacing utilities */
.p-2 {
  padding: calc(var(--spacing) * 2);
}

.p-3 {
  padding: calc(var(--spacing) * 3);
}

.p-4 {
  padding: calc(var(--spacing) * 4);
}

.p-6 {
  padding: calc(var(--spacing) * 6);
}

.px-2 {
  padding-left: calc(var(--spacing) * 2);
  padding-right: calc(var(--spacing) * 2);
}

.px-3 {
  padding-left: calc(var(--spacing) * 3);
  padding-right: calc(var(--spacing) * 3);
}

.px-4 {
  padding-left: calc(var(--spacing) * 4);
  padding-right: calc(var(--spacing) * 4);
}

.px-6 {
  padding-left: calc(var(--spacing) * 6);
  padding-right: calc(var(--spacing) * 6);
}

.py-0\\.5 {
  padding-top: calc(var(--spacing) * 0.5);
  padding-bottom: calc(var(--spacing) * 0.5);
}

.py-2 {
  padding-top: calc(var(--spacing) * 2);
  padding-bottom: calc(var(--spacing) * 2);
}

.py-3 {
  padding-top: calc(var(--spacing) * 3);
  padding-bottom: calc(var(--spacing) * 3);
}

.py-4 {
  padding-top: calc(var(--spacing) * 4);
  padding-bottom: calc(var(--spacing) * 4);
}

.py-16 {
  padding-top: calc(var(--spacing) * 16);
  padding-bottom: calc(var(--spacing) * 16);
}

.mb-1 {
  margin-bottom: calc(var(--spacing) * 1);
}

.mb-2 {
  margin-bottom: calc(var(--spacing) * 2);
}

.mb-4 {
  margin-bottom: calc(var(--spacing) * 4);
}

.mb-6 {
  margin-bottom: calc(var(--spacing) * 6);
}

.mb-8 {
  margin-bottom: calc(var(--spacing) * 8);
}

.mr-2 {
  margin-right: calc(var(--spacing) * 2);
}

.ml-1\\.5 {
  margin-left: calc(var(--spacing) * 1.5);
}

.mt-1 {
  margin-top: calc(var(--spacing) * 1);
}

.mt-2 {
  margin-top: calc(var(--spacing) * 2);
}

.mt-4 {
  margin-top: calc(var(--spacing) * 4);
}

/* Sizing utilities */
.w-4 {
  width: calc(var(--spacing) * 4);
}

.w-5 {
  width: calc(var(--spacing) * 5);
}

.w-8 {
  width: calc(var(--spacing) * 8);
}

.w-10 {
  width: calc(var(--spacing) * 10);
}

.w-full {
  width: 100%;
}

.w-72 {
  width: calc(var(--spacing) * 72);
}

.h-2 {
  height: calc(var(--spacing) * 2);
}

.h-4 {
  height: calc(var(--spacing) * 4);
}

.h-5 {
  height: calc(var(--spacing) * 5);
}

.h-8 {
  height: calc(var(--spacing) * 8);
}

.h-10 {
  height: calc(var(--spacing) * 10);
}

.h-screen {
  height: 100vh;
}

.min-w-\\[150px\\] {
  min-width: 150px;
}

.min-w-\\[200px\\] {
  min-width: 200px;
}

/* Text utilities */
.text-center {
  text-align: center;
}

.text-left {
  text-align: left;
}

.text-right {
  text-align: right;
}

.text-xs {
  font-size: var(--text-xs);
  line-height: var(--text-xs--line-height);
}

.text-sm {
  font-size: var(--text-sm);
  line-height: var(--text-sm--line-height);
}

.text-base {
  font-size: var(--text-base);
  line-height: var(--text-base--line-height);
}

.text-lg {
  font-size: var(--text-lg);
  line-height: var(--text-lg--line-height);
}

.text-xl {
  font-size: var(--text-xl);
  line-height: var(--text-xl--line-height);
}

.text-2xl {
  font-size: var(--text-2xl);
  line-height: var(--text-2xl--line-height);
}

.text-4xl {
  font-size: var(--text-4xl);
  line-height: var(--text-4xl--line-height);
}

.font-medium {
  font-weight: var(--font-weight-medium);
}

.font-semibold {
  font-weight: var(--font-weight-semibold);
}

.font-bold {
  font-weight: var(--font-weight-bold);
}

.font-sans {
  font-family: var(--font-geist-sans);
}

.uppercase {
  text-transform: uppercase;
}

.tracking-wider {
  letter-spacing: var(--tracking-wider);
}

.leading-tight {
  line-height: 1.25;
}

/* Color utilities - Light mode */
.text-white {
  color: var(--color-white);
}

.text-gray-100 {
  color: var(--color-gray-100);
}

.text-gray-200 {
  color: var(--color-gray-200);
}

.text-gray-300 {
  color: var(--color-gray-300);
}

.text-gray-400 {
  color: var(--color-gray-400);
}

.text-gray-500 {
  color: var(--color-gray-500);
}

.text-gray-600 {
  color: var(--color-gray-600);
}

.text-gray-700 {
  color: var(--color-gray-700);
}

.text-gray-800 {
  color: var(--color-gray-800);
}

.text-gray-900 {
  color: var(--color-gray-900);
}

.text-blue-300 {
  color: var(--color-blue-300);
}

.text-blue-400 {
  color: var(--color-blue-400);
}

.text-blue-500 {
  color: var(--color-blue-500);
}

.text-blue-600 {
  color: var(--color-blue-600);
}

/* Dark mode color utilities */
:host(.dark) .dark\\:text-gray-100 {
  color: var(--color-gray-100);
}

:host(.dark) .dark\\:text-gray-200 {
  color: var(--color-gray-200);
}

:host(.dark) .dark\\:text-gray-400 {
  color: var(--color-gray-400);
}

:host(.dark) .dark\\:text-gray-500 {
  color: var(--color-gray-500);
}

:host(.dark) .dark\\:text-gray-600 {
  color: var(--color-gray-600);
}

:host(.dark) .dark\\:text-gray-700 {
  color: var(--color-gray-700);
}

:host(.dark) .dark\\:text-gray-800 {
  color: var(--color-gray-800);
}

:host(.dark) .dark\\:text-gray-900 {
  color: var(--color-gray-900);
}

:host(.dark) .dark\\:text-blue-300 {
  color: var(--color-blue-300);
}

:host(.dark) .dark\\:text-blue-600 {
  color: var(--color-blue-600);
}

:host(.dark) .dark\\:text-red-600 {
  color: var(--color-red-600);
}

/* Background utilities - Light mode */
.bg-gray-50 {
  background-color: var(--color-gray-50);
}

.bg-gray-100 {
  background-color: var(--color-gray-100);
}

.bg-gray-200 {
  background-color: var(--color-gray-200);
}

.bg-gray-500 {
  background-color: var(--color-gray-500);
}

.bg-gray-600 {
  background-color: var(--color-gray-600);
}

.bg-gray-700 {
  background-color: var(--color-gray-700);
}

.bg-gray-800 {
  background-color: var(--color-gray-800);
}

.bg-gray-900 {
  background-color: var(--color-gray-900);
}

.bg-blue-500 {
  background-color: var(--color-blue-500);
}

.bg-blue-600 {
  background-color: var(--color-blue-600);
}

.bg-green-500 {
  background-color: var(--color-green-500);
}

.bg-green-600 {
  background-color: var(--color-green-600);
}

.bg-orange-500 {
  background-color: var(--color-orange-500);
}

.bg-yellow-500 {
  background-color: var(--color-yellow-500);
}

.bg-yellow-900\\/20 {
  background-color: rgba(120, 53, 15, 0.2);
}

/* Dark mode background utilities */
:host(.dark) .dark\\:bg-gray-50 {
  background-color: var(--color-gray-50);
}

:host(.dark) .dark\\:bg-gray-100 {
  background-color: var(--color-gray-100);
}

:host(.dark) .dark\\:bg-gray-400 {
  background-color: var(--color-gray-400);
}

:host(.dark) .dark\\:bg-gray-500 {
  background-color: var(--color-gray-500);
}

:host(.dark) .dark\\:bg-gray-600 {
  background-color: var(--color-gray-600);
}

:host(.dark) .dark\\:bg-gray-700 {
  background-color: var(--color-gray-700);
}

:host(.dark) .dark\\:bg-blue-500 {
  background-color: var(--color-blue-500);
}

:host(.dark) .dark\\:bg-blue-600 {
  background-color: var(--color-blue-600);
}

:host(.dark) .dark\\:bg-green-500 {
  background-color: var(--color-green-500);
}

:host(.dark) .dark\\:bg-green-600 {
  background-color: var(--color-green-600);
}

:host(.dark) .dark\\:bg-yellow-800\\/20 {
  background-color: rgba(146, 64, 14, 0.2);
}

/* Border utilities */
.border {
  border-width: 1px;
}

.border-b {
  border-bottom-width: 1px;
}

.border-gray-200 {
  border-color: var(--color-gray-200);
}

.border-gray-300 {
  border-color: var(--color-gray-300);
}

.border-gray-600 {
  border-color: var(--color-gray-600);
}

.border-gray-700 {
  border-color: var(--color-gray-700);
}

.border-yellow-600 {
  border-color: var(--color-yellow-600);
}

:host(.dark) .dark\\:border-gray-200 {
  border-color: var(--color-gray-200);
}

:host(.dark) .dark\\:border-gray-300 {
  border-color: var(--color-gray-300);
}

:host(.dark) .dark\\:border-yellow-500 {
  border-color: var(--color-yellow-500);
}

/* Rounded utilities */
.rounded {
  border-radius: var(--radius);
}

.rounded-full {
  border-radius: 9999px;
}

.rounded-lg {
  border-radius: var(--radius-lg);
}

.rounded-md {
  border-radius: var(--radius-md);
}

/* Shadow utilities */
.shadow-lg {
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1);
}

/* Divide utilities */
.divide-y > * + * {
  border-top-width: 1px;
}

.divide-gray-200 > * + * {
  border-color: var(--color-gray-200);
}

.divide-gray-600 > * + * {
  border-color: var(--color-gray-600);
}

:host(.dark) .dark\\:divide-gray-200 > * + * {
  border-color: var(--color-gray-200);
}

/* Overflow utilities */
.overflow-hidden {
  overflow: hidden;
}

.overflow-x-auto {
  overflow-x: auto;
}

/* Table utilities */
.whitespace-nowrap {
  white-space: nowrap;
}

/* Opacity utilities */
.opacity-0 {
  opacity: 0;
}

.opacity-50 {
  opacity: 0.5;
}

/* Focus utilities */
.focus\\:outline-none:focus {
  outline: 2px solid transparent;
  outline-offset: 2px;
}

.focus\\:ring-2:focus {
  --tw-ring-offset-shadow: var(--tw-ring-inset) 0 0 0 var(--tw-ring-offset-width) var(--tw-ring-offset-color);
  --tw-ring-shadow: var(--tw-ring-inset) 0 0 0 calc(2px + var(--tw-ring-offset-width)) var(--tw-ring-color);
  box-shadow: var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow, 0 0 #0000);
}

.focus\\:ring-blue-500:focus {
  --tw-ring-color: var(--color-blue-500);
}

.focus\\:ring-green-500:focus {
  --tw-ring-color: var(--color-green-500);
}

/* Hover utilities */
.hover\\:bg-gray-300:hover {
  background-color: var(--color-gray-300);
}

.hover\\:bg-gray-600:hover {
  background-color: var(--color-gray-600);
}

.hover\\:bg-blue-700:hover {
  background-color: var(--color-blue-600);
}

.hover\\:bg-green-700:hover {
  background-color: var(--color-green-600);
}

.hover\\:bg-red-500\\/10:hover {
  background-color: rgba(239, 68, 68, 0.1);
}

.hover\\:bg-gray-700\\/50:hover {
  background-color: rgba(55, 65, 81, 0.5);
}

.hover\\:text-blue-400:hover {
  color: var(--color-blue-400);
}

.hover\\:text-red-500:hover {
  color: var(--color-red-500);
}

:host(.dark) .dark\\:hover\\:bg-gray-50:hover {
  background-color: var(--color-gray-50);
}

:host(.dark) .dark\\:hover\\:bg-gray-500:hover {
  background-color: var(--color-gray-500);
}

:host(.dark) .dark\\:hover\\:bg-gray-600:hover {
  background-color: var(--color-gray-600);
}

:host(.dark) .dark\\:hover\\:bg-blue-600:hover {
  background-color: var(--color-blue-600);
}

:host(.dark) .dark\\:hover\\:bg-green-600:hover {
  background-color: var(--color-green-600);
}

:host(.dark) .dark\\:hover\\:bg-red-500\\/10:hover {
  background-color: rgba(239, 68, 68, 0.1);
}

:host(.dark) .dark\\:hover\\:text-red-600:hover {
  color: var(--color-red-600);
}

/* Disabled utilities */
.disabled\\:opacity-50:disabled {
  opacity: 0.5;
}

.disabled\\:cursor-not-allowed:disabled {
  cursor: not-allowed;
}

/* Pointer events */
.pointer-events-none {
  pointer-events: none;
}

/* Cursor utilities */
.cursor-pointer {
  cursor: pointer;
}

.cursor-help {
  cursor: help;
}

/* Custom range input styles */
.range-thumb {
  appearance: none;
  background: var(--color-blue-500);
}

.range-thumb::-webkit-slider-thumb {
  appearance: none;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: var(--color-blue-500);
  cursor: pointer;
}

.range-thumb::-moz-range-thumb {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: var(--color-blue-500);
  cursor: pointer;
  border: none;
}

/* Form input styles */
input[type="text"],
input[type="range"] {
  appearance: none;
}

input[type="text"]:focus {
  outline: none;
}

/* Placeholder styles */
input::placeholder {
  opacity: 1;
}

:host(.dark) input::placeholder {
  color: var(--color-gray-500);
}

/* Group hover utilities */
.group:hover .group-hover\\:opacity-100 {
  opacity: 1;
}

/* Space utilities */
.space-x-2 > * + * {
  margin-left: calc(var(--spacing) * 2);
}
`;

export default styles;
