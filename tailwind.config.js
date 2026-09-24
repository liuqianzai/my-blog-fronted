/** @type {import('tailwindcss').Config} */
export default {
    darkMode: 'class',
    content: [
        "./index.html",
        "./src/**/*.{vue,js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: {
                    DEFAULT: '#2563EB',
                    dark: '#1D4ED8',
                },
                background: 'var(--bg-main)',
                'card-bg': 'var(--card-bg)',
                'text-main': 'var(--text-main)',
                'text-sub': 'var(--text-sub)',
            },
            borderRadius: {
                '2xl': '16px', // 规范要求的卡片圆角
            }
        },
    },
    plugins: [],
}
