/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          sidebar: '#142653',
          dark: '#172554',
          card: '#1E293B',
          deep: '#0B132B',
        },
        brand: {
          blue: '#2563EB',
          'blue-secondary': '#3B82F6',
          'blue-light': '#EFF6FF',
          purple: '#8B5CF6',
          'purple-light': '#F5F3FF',
          green: '#10B981',
          'green-light': '#ECFDF5',
          orange: '#F59E0B',
          'orange-light': '#FFFBEB',
          red: '#EF4444',
          'red-light': '#FEF2F2',
        },
        surface: {
          bg: '#F4F7FC',
          card: '#FFFFFF',
          border: '#E2E8F0',
          'text-primary': '#0F172A',
          'text-secondary': '#64748B',
          'text-muted': '#94A3B8',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        'glass': '0 8px 30px rgba(20, 38, 83, 0.06)',
        'glass-hover': '0 12px 35px rgba(20, 38, 83, 0.1)',
        'card': '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.05)',
        'card-hover': '0 4px 6px -1px rgba(0, 0, 0, 0.07), 0 2px 4px -2px rgba(0, 0, 0, 0.05)',
        'modal': '0 20px 25px -5px rgba(0, 0, 0, 0.12), 0 8px 10px -6px rgba(0, 0, 0, 0.08)',
      },
      borderRadius: {
        'card': '14px',
      }
    },
  },
  plugins: [],
}
