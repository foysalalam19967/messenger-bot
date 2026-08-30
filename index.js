// Israt's World - Messenger Auto Reply Bot
// এই ফাইলটাই মূল সার্ভার, এখানে Facebook Messenger থেকে আসা মেসেজ রিসিভ ও রিপ্লাই পাঠানো হয়

const express = require("express");
const axios = require("axios");
require("dotenv").config();

const app = express();
app.use(express.json());

// ==== এনভায়রনমেন্ট ভ্যারিয়েবল (এইগুলা Render-এর Environment Settings-এ বসাবে) ====
const VERIFY_TOKEN = process.env.VERIFY_TOKEN;
const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;

// ==== Keyword অনুযায়ী রিপ্লাই লিস্ট ====
// গুরুত্বপূর্ণ: লিস্টের যেই আইটেম আগে আছে সেটা আগে চেক হয়, তাই বেশি নির্দিষ্ট keyword উপরে রাখা হয়েছে
const replies = [
  // ==== গ্রিটিং ====
  {
    keywords: ["hi", "hello", "হাই", "হ্যালো", "আসসালামু আলাইকুম", "assalamu alaikum"],
    reply: "হ্যালো! Israt's World-এ স্বাগতম 😊 আপনাকে কীভাবে সাহায্য করতে পারি?",
  },

  // ==== ধন্যবাদ ====
  {
    keywords: ["ধন্যবাদ", "thanks", "thank you"],
    reply: "আপনাকেও ধন্যবাদ 😊 আবার প্রয়োজনে মেসেজ করবেন।",
  },

  // ==== প্রোডাক্ট লিস্ট (কী কী আছে) ====
  {
    keywords: [
      "কি কি পণ্য",
      "কি কি প্রোডাক্ট",
      "কি কি আছে",
      "কি আছে",
      "কি পাওয়া যায়",
      "কি কি পাওয়া",
      "ki ki ache",
      "ki ache",
      "product ache",
    ],
    reply:
      "স্যার, আমাদের কাছে আছে:\n- ৬ হাতের জামস শাল\n- ৫ হাতের জামস ও লেডিস শাল\n- খাদি পাঞ্জাবি\n- টাঙ্গাইল শাড়ি\n- থ্রি-পিস\n\nস্যার আপনি কোনটা নিতে চান?",
  },

  // ==== ছবি চাওয়া (সাধারণ) ====
  {
    keywords: ["ছবি দিন", "ছবি পাঠান", "picture din", "picture pathan", "cobi din", "cobi pathan"],
    reply: "স্যার একটু অপেক্ষা করুন, ছবিগুলো পাঠাচ্ছি।",
  },

  // ==== শালের ছবি ====
  {
    keywords: ["শালের ছবি", "shawler cobi", "shal er picture"],
    reply: "স্যার একটু অপেক্ষা করুন, শালের ছবিগুলো পাঠাচ্ছি।",
  },

  // ==== মেয়েদের শাল ====
  {
    keywords: ["মেয়েদের শাল", "লেডিস শাল", "ladies shawl", "mayder shawl"],
    reply: "হ্যাঁ স্যার, আমাদের কাছে মেয়েদের শাল আছে। এখনই ছবিগুলো পাঠাচ্ছি।",
  },

  // ==== শালের সাইজ ও ওজন ====
  {
    keywords: ["শালের সাইজ", "shawl size", "শালের মাপ", "শালের ওজন", "shawl ojon", "shawl weight"],
    reply:
      "শালের ২ সাইজ পাওয়া যায়:\n৬ হাত লম্বা x ২.৫ হাত চওড়া — ওজন ৬৫০+ গ্রাম\n৫ হাত x ২ হাত — ওজন ৩৫০-৫০০ গ্রাম",
  },

  // ==== পাঞ্জাবির সাইজ ====
  {
    keywords: ["পাঞ্জাবির সাইজ", "panjabi size", "পাঞ্জাবির মাপ"],
    reply:
      "খাদি পাঞ্জাবির সাইজ: ৩৮, ৪০, ৪২, ৪৪, ৪৬ (স্লিমফিট)। বেবি সাইজও পাওয়া যায়।",
  },

  // ==== শালের মান (নির্দিষ্ট — দামের আগে চেক হবে, কারণ "শাল" শব্দ উভয় জায়গায় আছে) ====
  {
    keywords: [
      "শালের মান",
      "শাল ভালো",
      "শালে রং",
      "শাল গুটলি",
      "shawl quality",
      "shawl man",
      "shal man",
    ],
    reply:
      "স্যার নিশ্চিন্তে থাকুন, আমাদের শাল ১০০% ভালো মানের অরিজিনাল উল সুতায় তাঁতে বুনন করে তৈরি। রং, আঁশ বা গুটলি ওঠার কোনো সমস্যা নেই। ওয়াশ করা সুতায় বুনন করা, তাই সফট ও আরামদায়ক হবে।",
  },

  // ==== পাঞ্জাবির মান (নির্দিষ্ট — দামের আগে চেক হবে) ====
  {
    keywords: ["পাঞ্জাবির মান", "পাঞ্জাবি ভালো", "panjabi quality", "panjabi man", "খাদির মান"],
    reply:
      "স্যার নিশ্চিন্তে থাকুন, আমাদের খাদি পাঞ্জাবি ১০০% কটন কাপড়ে তৈরি, রং ওঠার কোনো সমস্যা নেই, পরে আরামদায়ক লাগবে।",
  },

  // ==== কাপড়ের মান (শাড়ি/থ্রি-পিস — দামের আগে চেক হবে) ====
  {
    keywords: ["কাপড় ভালো", "রং উঠবে", "মান কেমন", "quality kemon", "কাপড়ের মান"],
    reply:
      "স্যার নিশ্চিন্তে থাকুন, আমাদের শাড়ি ও থ্রি-পিস ১০০% কটন কাপড়ে তৈরি, রং ওঠার কোনো সমস্যা নেই।",
  },

  // ==== প্রোডাক্টের দাম (নির্দিষ্ট) ====
  {
    keywords: ["শাল", "shawl"],
    reply:
      "স্যার আমাদের কাছে ২ সাইজের শাল আছে। শালের দাম একটু আলাদা —\n৫ হাতের শাল: ৪৫০-৬৫০ টাকা\n৬ হাতের শাল: ৮৫০-১১৫০ টাকা\n\nআপনি কোনটা নিতে চান? কালার অথবা কোড নম্বর বলুন প্লিজ।",
  },
  {
    keywords: ["খাদি", "পাঞ্জাবি", "panjabi"],
    reply:
      "খাদি পাঞ্জাবি:\nএক কালার (প্লেইন): ৪৫০ টাকা\nডিজাইন করা: ৫৫০-১১৫০ টাকা",
  },
  {
    keywords: ["টাঙ্গাইল", "শাড়ি", "saree"],
    reply: "টাঙ্গাইল শাড়ির দাম: ১০০০-১৫০০ টাকা",
  },
  {
    keywords: ["থ্রি-পিস", "থ্রিপিস", "three piece", "3 piece"],
    reply:
      "থ্রি-পিস:\nবাটিক থ্রি-পিস: ৭০০ টাকা\nকাজ করা (এমব্রয়ডারি) থ্রি-পিস: ১০৫০ টাকা\n১০০% কটন কাপড়।",
  },

  // ==== সাধারণ দাম জিজ্ঞাসা (প্রোডাক্টের নাম ছাড়া) ====
  {
    keywords: ["দাম কত", "price koto", "কত টাকা"],
    reply: "স্যার কোন পণ্যের দাম জানতে চান? কালার অথবা কোড নম্বর বলুন।",
  },

  // ==== লোকেশন ====
  {
    keywords: ["location", "লোকেশন", "ঠিকানা", "কোথায়"],
    reply: "ঢাকার বাইরে, টাঙ্গাইল সদর — আমাদের লোকেশন।",
  },

  // ==== ডেলিভারি সময় ====
  {
    keywords: ["ডেলিভারি সময়", "delivery time", "কতদিনে পাব", "কয়দিনে পাব"],
    reply: "ঢাকার ভেতরে ডেলিভারি সময় ১-২ দিন, ঢাকার বাইরে ৩-৫ দিন লাগে।",
  },

  // ==== ডেলিভারি চার্জ ====
  {
    keywords: ["ডেলিভারি চার্জ", "delivery charge", "ডেলিভারি খরচ"],
    reply: "ঢাকার ভেতরে ডেলিভারি চার্জ ৮০ টাকা, ঢাকার বাইরে ১৩০ টাকা।",
  },

  // ==== ক্যাশ অন ডেলিভারি ====
  {
    keywords: ["cash on", "ক্যাশ অন", "cod", "হোম ডেলিভারি", "home delivery"],
    reply: "হ্যাঁ স্যার, আমাদের ক্যাশ অন হোম ডেলিভারি আছে।",
  },

  // ==== পেমেন্ট পদ্ধতি ====
  {
    keywords: ["পেমেন্ট", "payment", "বিকাশ", "bkash", "নগদ", "nagad"],
    reply: "আমরা শুধু ক্যাশ অন ডেলিভারিতে পেমেন্ট নিই — প্রোডাক্ট হাতে পেয়ে টাকা দিবেন।",
  },

  // ==== এক্সচেঞ্জ/রিটার্ন ====
  {
    keywords: ["এক্সচেঞ্জ", "রিটার্ন", "exchange", "return", "ফেরত"],
    reply:
      "হ্যাঁ স্যার, পণ্য পছন্দ না হলে এক্সচেঞ্জ করা যাবে। প্রোডাক্ট হাতে পাওয়ার ২ দিনের মধ্যে জানাতে হবে।",
  },

  // ==== অগ্রিম পেমেন্ট ====
  {
    keywords: ["অগ্রিম", "advance", "আগে টাকা", "advance payment"],
    reply:
      "না স্যার, কোনো অগ্রিম টাকা লাগবে না। হাতে পণ্য পেয়ে দেখে তারপর টাকা পরিশোধ করবেন। কোনো কারণে না নিলে বা পণ্য পছন্দ না হলে শুধু ডেলিভারি চার্জ পরিশোধ করে ফেরত দিতে পারবেন।",
  },

  // ==== পাইকারি/বাল্ক অর্ডার ====
  {
    keywords: ["পাইকারি", "বাল্ক", "wholesale", "bulk order", "বেশি পরিমাণ"],
    reply:
      "হ্যাঁ স্যার, পাইকারি/বাল্ক অর্ডার নেওয়া হয়। দাম আলোচনা সাপেক্ষে, বিস্তারিত জানতে ইনবক্সে জানান।",
  },

  // ==== কীভাবে অর্ডার করব ====
  {
    keywords: ["অর্ডার কিভাবে", "কিভাবে অর্ডার", "order kivabe", "order korbo"],
    reply:
      "অর্ডার করতে আপনার নাম, ঠিকানা এবং ফোন নম্বর ইনবক্সে জানান। আমরা দ্রুত কনফার্ম করে ডেলিভারি পাঠিয়ে দেব।",
  },

  // ==== ফোন নম্বর / সরাসরি কথা বলা ====
  {
    keywords: [
      "নাম্বার দিন",
      "নাম্বার দেন",
      "ফোন নম্বর",
      "phone number",
      "phone namber",
      "namber din",
      "namber den",
      "number din",
      "number den",
      "নাম্বার",
      "namber",
      "কল করব",
      "কল করতে",
      "সরাসরি কথা",
      "whatsapp",
      "হোয়াটসঅ্যাপ",
    ],
    reply: "আমাদের নাম্বার: 01690158675 — কল অথবা WhatsApp দুটোতেই যোগাযোগ করতে পারবেন।",
  },

  // ==== নতুন কালেকশন ====
  {
    keywords: ["নতুন কালেকশন", "নতুন প্রোডাক্ট", "new collection"],
    reply: "প্রতি সপ্তাহে আমাদের নতুন কালেকশন আসে। পেজে ফলো রাখুন, নতুন আপডেট সবার আগে পেয়ে যাবেন 😊",
  },

  // ==== দোকান/অফিসের সময় ====
  {
    keywords: ["কখন খোলা", "অফিস সময়", "office time", "shop time", "কখন পাব আপনাদের"],
    reply: "আমরা সবসময়ই (২৪ ঘণ্টা) খোলা থাকি, যেকোনো সময় মেসেজ করতে পারেন।",
  },

  // ==== বিদায়/ছোট রিপ্লাই ====
  {
    keywords: ["ওকে", "আচ্ছা", "ok", "okay", "thik ache", "ঠিক আছে"],
    reply: "ধন্যবাদ, প্রয়োজনে আবার নক করবেন 😊",
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

// ==== ধাপ ২: মেসেজ রিসিভ করা এবং অটো রিপ্লাই পাঠানো ====
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
          "স্যার একটু অপেক্ষা করুন, আমাদের প্রতিনিধি এখনই প্রাইস জানিয়ে দিচ্ছে।"
        );
      } else if (webhookEvent.message && webhookEvent.message.text) {
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

// Meta App Review-এর জন্য প্রয়োজনীয় Privacy Policy পেজ
app.get("/privacy", (req, res) => {
  res.sendFile(__dirname + "/privacy.html");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
