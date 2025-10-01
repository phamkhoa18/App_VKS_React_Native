/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all files that contain Nativewind classes.
  content: ["./App.js", "./components/**/*.{js,jsx,ts,tsx}" , './screens/**/*.{js,jsx,ts,tsx}'],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      fontFamily: {
        sans: ['SFPro-Regular'],
        'sf-black': ['SFPro-Black'],
        'sf-bold': ['SFPro-Bold'],
        'sf-regular': ['SFPro-Regular'],
        'sf-medium': ['SFPro-Medium'],
        'sf-light': ['SFPro-Light'],
      },
    },
  },
  plugins: [],
}