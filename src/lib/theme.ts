export const getTheme = (isDark: boolean) => ({
  background: isDark ? '#111827' : '#f3f4f6',
  cardBackground: isDark ? '#1f2937' : '#ffffff',
  textPrimary: isDark ? '#f9fafb' : '#111827',
  textSecondary: isDark ? '#d1d5db' : '#4b5563',
  textMuted: isDark ? '#9ca3af' : '#6b7280',
  border: isDark ? '#374151' : '#e5e7eb',
  borderAccent: isDark ? '#4b5563' : '#d1d5db',
  toggleBg: isDark ? '#374151' : '#e5e7eb',
  toggleText: isDark ? '#e5e7eb' : '#1f2937',
  sliderBg: isDark ? '#4b5563' : '#d1d5db',
  sliderThumb: '#3b82f6',
  buttonPrimary: '#3b82f6',
  buttonSuccess: '#10b981',
  buttonDanger: '#ef4444',
  hoverOverlay: isDark ? 'rgba(55, 65, 81, 0.5)' : 'rgba(229, 231, 235, 0.5)',
});

export type Theme = ReturnType<typeof getTheme>;
