// Israt's World - Messenger Auto Reply Bot
// এই ফাইলটাই মূল সার্ভার, এখানে Facebook Messenger থেকে আসা মেসেজ রিসিভ ও রিপ্লাই পাঠানো হয়

const express = require("express");
const axios = require("axios");
require("dotenv").config();

const app = express();
app.use(express.json());

// ==== এনভায়রনমেন্ট ভ্যারিয়েবল (এইগুলা .env ফাইলে বা Render/Railway-এর Environment Settings-এ বসাবে) ====
const VERIFY_TOKEN = process.env.VERIFY_TOKEN;       // তুমি নিজে বানানো একটা গোপন শব্দ, Facebook Webhook verify করার সময় লাগবে
const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN; // Meta Developer Dashboard থেকে পাওয়া Page Access Token

// ==== Keyword অনুযায়ী রিপ্লাই লিস্ট (এখানে এডিট করে নতুন keyword/reply যোগ করতে পারবে) ====
const replies = [
  {
    keywords: ["hi", "hello", "হাই", "হ্যালো"],
    reply: "হ্যালো! Israt's World-এ স্বাগতম 😊 আপনাকে কীভাবে সাহায্য করতে পারি?",
  },
  {
    keywords: ["price", "দাম", "কত"],
    reply: "আমাদের প্রোডাক্টের দাম সম্পর্কে জানতে অনুগ্রহ করে কোন প্রোডাক্টটি সম্পর্কে জানতে চান তা জানান।",
  },
  {
    keywords: ["location", "ঠিকানা", "কোথায়"],
    reply: "আমাদের লোকেশন: [তোমার ঠিকানা এখানে বসাবে]",
  },
];

// কোনো keyword না মিললে এই ডিফল্ট রিপ্লাই যাবে
const DEFAULT_REPLY =
  "ধন্যবাদ মেসেজ করার জন্য! আমাদের টিম শীঘ্রই আপনার সাথে যোগাযোগ করবে।";

// ইনকামিং মেসেজ টেক্সট চেক করে সঠিক রিপ্লাই খুঁজে বের করা
function findReply(messageText) {
  const text = messageText.toLowerCase();
  for (const item of replies) {
    if (item.keywords.some((kw) => text.includes(kw.toLowerCase()))) {
      return item.reply;
    }
  }
  return DEFAULT_REPLY;
}

// ==== ধাপ ১: Webhook Verification (Facebook এই GET request পাঠিয়ে চেক করে তোমার সার্ভার আসল কিনা) ====
app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("Webhook verified successfully!");
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});

// ==== ধাপ ২: মেসেজ রিসিভ করা এবং অটো রিপ্লাই পাঠানো ====
app.post("/webhook", async (req, res) => {
  const body = req.body;

  if (body.object === "page") {
    for (const entry of body.entry) {
      const webhookEvent = entry.messaging[0];
      const senderId = webhookEvent.sender.id;

      if (webhookEvent.message && webhookEvent.message.text) {
        const messageText = webhookEvent.message.text;
        const replyText = findReply(messageText);
        await sendMessage(senderId, replyText);
      }
    }
    res.status(200).send("EVENT_RECEIVED");
  } else {
    res.sendStatus(404);
  }
});

// ==== Facebook Send API দিয়ে ইউজারকে রিপ্লাই পাঠানো ====
async function sendMessage(senderId, text) {
  try {
    await axios.post(
      `https://graph.facebook.com/v21.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`,
      {
        recipient: { id: senderId },
        message: { text: text },
      }
    );
    console.log(`Reply sent to ${senderId}: ${text}`);
  } catch (error) {
    console.error("Error sending message:", error.response?.data || error.message);
  }
}

// সার্ভার সচল আছে কিনা চেক করার জন্য একটা সিম্পল রুট
app.get("/", (req, res) => {
  res.send("Israt's World Messenger Bot is running ✅");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
