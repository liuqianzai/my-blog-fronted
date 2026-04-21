/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{vue,js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                // 对应 UI 规范中的色彩
                primary: {
                    DEFAULT: '#2563EB',
                    dark: '#1D4ED8',
                },
                background: '#FAFBFC',
                'card-bg': '#FFFFFF',
                'text-main': '#1F2937',
                'text-sub': '#6B7280',
            },
            borderRadius: {
                '2xl': '16px', // 规范要求的卡片圆角
            }
        },
    },
    plugins: [],
}
