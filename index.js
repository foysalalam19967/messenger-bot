// Israt's World - Messenger Auto Reply Bot (AI-powered version)
// এই ফাইলটাই মূল সার্ভার, এখানে Facebook Messenger থেকে আসা মেসেজ রিসিভ করে AI দিয়ে স্মার্ট রিপ্লাই পাঠানো হয়

const express = require("express");
const axios = require("axios");
require("dotenv").config();

const app = express();
app.use(express.json());

// ==== এনভায়রনমেন্ট ভ্যারিয়েবল (এইগুলা Render-এর Environment Settings-এ বসাবে) ====
const VERIFY_TOKEN = process.env.VERIFY_TOKEN;
const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY; // OpenAI থেকে পাওয়া API key

// ==== তোমার বিজনেসের তথ্য (এখানে এডিট করে নতুন প্রোডাক্ট/দাম যোগ করতে পারবে) ====
const BUSINESS_INFO = `
তুমি "Israt's World" নামের একটা দেশি ফ্যাশন শপের কাস্টমার সার্ভিস সহকারী। তুমি বাংলায় কথা বলবে, বন্ধুত্বপূর্ণ ও সংক্ষিপ্তভাবে উত্তর দেবে।

নিচে দোকানের প্রোডাক্ট ও দামের তথ্য দেওয়া আছে। শুধু এই তথ্যের ভিত্তিতেই উত্তর দেবে। যদি কোনো প্রশ্নের উত্তর এই তথ্যের মধ্যে না থাকে, তাহলে বলবে: "এই বিষয়ে সঠিক তথ্যের জন্য আমাদের টিমের সাথে যোগাযোগ করুন, তারা শীঘ্রই আপনাকে জানাবে।" কখনো নিজে থেকে তথ্য বানিয়ে বলবে না।

=== প্রোডাক্ট তালিকা ===

১. শাল (দেশি, উলের বুনন):
- ৬ হাত শাল: ৭৫০-১১০০ টাকা
- ৫ হাত শাল: ৪৫০-৬৫০ টাকা
- বৈশিষ্ট্য: আঁশ ওঠে না, ১০০% ফিনিশিং কোয়ালিটি, নরম ও আরামদায়ক

২. খাদি পাঞ্জাবি:
- এক কালার (প্লেইন): ৪৫০ টাকা
- ডিজাইন করা: ৫৫০-১১৫০ টাকা

৩. টাঙ্গাইল শাড়ি: ১০০০-১৫০০ টাকা

৪. থ্রি-পিস:
- বাটিক থ্রি-পিস: ৭০০ টাকা
- কাজ করা (এমব্রয়ডারি) থ্রি-পিস: ১০৫০ টাকা
- ১০০% কটন কাপড়

=== নির্দেশনা ===
- সংক্ষিপ্ত ও স্পষ্টভাবে উত্তর দেবে (২-৩ বাক্যের বেশি না)
- দাম জিজ্ঞেস করলে সঠিক দাম বলবে
- অর্ডার করতে চাইলে বলবে পেজে ইনবক্সে বিস্তারিত (নাম, ঠিকানা, ফোন নম্বর) জানাতে
- ভদ্র ও আন্তরিক টোনে কথা বলবে, ইমোজি মাঝে মাঝে ব্যবহার করতে পারো 😊
`;

// ==== OpenAI API দিয়ে স্মার্ট রিপ্লাই তৈরি করা ====
async function getAIReply(userMessage) {
  try {
    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-4o-mini", // সাশ্রয়ী ও দ্রুত মডেল
        messages: [
          { role: "system", content: BUSINESS_INFO },
          { role: "user", content: userMessage },
        ],
        max_tokens: 300,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
      }
    );
    return response.data.choices[0].message.content.trim();
  } catch (error) {
    console.error("OpenAI error:", error.response?.data || error.message);
    return "দুঃখিত, এই মুহূর্তে উত্তর দিতে সমস্যা হচ্ছে। একটু পরে আবার চেষ্টা করুন।";
  }
}

// ==== ধাপ ১: Webhook Verification ====
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

// ==== ধাপ ২: মেসেজ রিসিভ করা এবং AI দিয়ে রিপ্লাই পাঠানো ====
app.post("/webhook", async (req, res) => {
  const body = req.body;

  if (body.object === "page") {
    for (const entry of body.entry) {
      const webhookEvent = entry.messaging[0];
      const senderId = webhookEvent.sender.id;

      if (webhookEvent.message && webhookEvent.message.attachments) {
        // ইউজার ছবি/ফাইল পাঠালে এই রিপ্লাই যাবে
        await sendMessage(
          senderId,
          "অনুগ্রহ করে প্রোডাক্টের নাম, কালার অথবা কোড নম্বর লিখে জানান, আমরা দাম জানিয়ে দিচ্ছি 😊"
        );
      } else if (webhookEvent.message && webhookEvent.message.text) {
        const messageText = webhookEvent.message.text;
        const replyText = await getAIReply(messageText);
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
  res.send("Israt's World Messenger Bot (AI-powered) is running ✅");
});

// Meta App Review-এর জন্য প্রয়োজনীয় Privacy Policy পেজ
app.get("/privacy", (req, res) => {
  res.sendFile(__dirname + "/privacy.html");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
