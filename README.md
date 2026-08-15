# Israt's World - Messenger Auto Reply Bot

## এই বট কী করে
Facebook Page-এ কেউ মেসেজ করলে, মেসেজের মধ্যে থাকা keyword অনুযায়ী স্বয়ংক্রিয়ভাবে রিপ্লাই পাঠায়।

## Keyword/Reply এডিট করতে চাইলে
`index.js` ফাইলে `replies` অ্যারেতে গিয়ে নতুন keyword ও reply যোগ/পরিবর্তন করা যাবে।

## Deploy করার ধাপ (Render.com দিয়ে - ফ্রি)

1. এই পুরো ফোল্ডারটা একটা GitHub repository-তে আপলোড করো
2. [render.com](https://render.com) এ গিয়ে ফ্রি অ্যাকাউন্ট বানাও
3. "New" > "Web Service" ক্লিক করো, তোমার GitHub repo সিলেক্ট করো
4. Build Command: `npm install`
5. Start Command: `npm start`
6. Environment Variables সেকশনে গিয়ে যোগ করো:
   - `VERIFY_TOKEN` = তোমার নিজের বানানো একটা গোপন শব্দ (যেমন: `isratsworld123`)
   - `PAGE_ACCESS_TOKEN` = Meta Developer Dashboard থেকে কপি করা টোকেন
7. Deploy হয়ে গেলে তুমি একটা URL পাবে, যেমন: `https://isratsworldbot.onrender.com`

## Meta Developer Dashboard-এ Webhook বসানো

1. Messenger API Settings > Webhooks সেকশনে যাও
2. Callback URL: `https://isratsworldbot.onrender.com/webhook`
3. Verify Token: ওই একই গোপন শব্দ যেটা তুমি `VERIFY_TOKEN`-এ দিয়েছ
4. "Verify and Save" ক্লিক করো
5. Webhook Fields-এ `messages` সাবস্ক্রাইব করো

## লোকালি টেস্ট করতে চাইলে
```
npm install
cp .env.example .env
# .env ফাইলে নিজের token বসাও
npm start
```
