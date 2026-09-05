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
// প্রতিটা keyword-এ বাংলা এবং রোমান/Banglish (ইংরেজি হরফে বাংলা) দুই ধরনের ভ্যারিয়েশন রাখা হয়েছে
const replies = [
  // ==== গ্রিটিং ====
  {
    keywords: [
      "hi",
      "hello",
      "হাই",
      "হ্যালো",
      "আসসালামু আলাইকুম",
      "assalamu alaikum",
      "assalamualaikum",
    ],
    reply: "হ্যালো! Israt's World-এ স্বাগতম 😊 আপনাকে কীভাবে সাহায্য করতে পারি?",
  },

  // ==== ধন্যবাদ ====
  {
    keywords: ["ধন্যবাদ", "dhonnobad", "thanks", "thank you"],
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
      "ki ki pawa jay",
      "product ache",
      "ki ki product",
    ],
    reply:
      "স্যার, আমাদের কাছে আছে:\n- ৬ হাতের জেন্টস শাল\n- ৫ হাতের জেন্টস ও লেডিস শাল\n- খাদি পাঞ্জাবি\n- টাঙ্গাইল শাড়ি\n- থ্রি-পিস\n\nস্যার আপনি কোনটা নিতে চান?",
  },

  // ==== ছবি চাওয়া (সাধারণ) ====
  {
    keywords: [
      "ছবি দিন",
      "ছবি পাঠান",
      "picture din",
      "picture pathan",
      "cobi din",
      "cobi pathan",
      "chobi din",
      "chobi pathan",
    ],
    reply: "স্যার একটু অপেক্ষা করুন, ছবিগুলো পাঠাচ্ছি।",
  },

  // ==== শালের ছবি ====
  {
    keywords: ["শালের ছবি", "shawler cobi", "shal er picture", "shawl er chobi", "shal er chobi"],
    reply: "স্যার একটু অপেক্ষা করুন, শালের ছবিগুলো পাঠাচ্ছি।",
  },

  // ==== মেয়েদের শাল ====
  {
    keywords: [
      "মেয়েদের শাল",
      "লেডিস শাল",
      "ladies shawl",
      "mayder shawl",
      "meyeder shawl",
      "meyeder shal",
    ],
    reply:
      "ধন্যবাদ, জ্বী আমাদের কাছে মেয়েদের কোয়ালিটি সম্পন্ন নানা ডিজাইনের শাল হবে। আপনি কি কালার গুলো দেখতে চান?",
  },

  // ==== মেয়েদের জিনিস বিক্রি করেন কিনা (সাধারণ) ====
  {
    keywords: [
      "মেয়েদের জিনিস",
      "মেয়েদের পণ্য",
      "girls item",
      "ladies item",
      "meyeder jinis",
      "meyeder product",
    ],
    reply: "ধন্যবাদ, জ্বী আমাদের কাছে মেয়েদের শাল, থ্রি-পিস এবং শাড়ি পাবেন।",
  },

  // ==== শালের সাইজ ও ওজন ====
  {
    keywords: [
      "শালের সাইজ",
      "shawl size",
      "শালের মাপ",
      "শালের ওজন",
      "shawl ojon",
      "shawl weight",
      "shaler size",
      "shaler map",
      "shaler ojon",
    ],
    reply:
      "শালের ২ সাইজ পাওয়া যায়:\n৬ হাত লম্বা x ২.৫ হাত চওড়া — ওজন ৬৫০+ গ্রাম\n৫ হাত x ২ হাত — ওজন ৩৫০-৫০০ গ্রাম",
  },

  // ==== পাঞ্জাবির সাইজ ====
  {
    keywords: ["পাঞ্জাবির সাইজ", "panjabi size", "পাঞ্জাবির মাপ", "panjabir size", "panjabir map"],
    reply: "খাদি পাঞ্জাবির সাইজ: ৩৮, ৪০, ৪২, ৪৪, ৪৬ (স্লিমফিট)। বেবি সাইজও পাওয়া যায়।",
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
      "shaler man",
      "shal valo",
      "shal e rong",
    ],
    reply:
      "স্যার নিশ্চিন্তে থাকুন, আমাদের শাল ১০০% ভালো মানের অরিজিনাল উল সুতায় তাঁতে বুনন করে তৈরি। রং, আঁশ বা গুটলি ওঠার কোনো সমস্যা নেই। ওয়াশ করা সুতায় বুনন করা, তাই সফট ও আরামদায়ক হবে।",
  },

  // ==== পাঞ্জাবির মান (নির্দিষ্ট — দামের আগে চেক হবে) ====
  {
    keywords: [
      "পাঞ্জাবির মান",
      "পাঞ্জাবি ভালো",
      "panjabi quality",
      "panjabi man",
      "খাদির মান",
      "panjabir man",
      "khadir man",
    ],
    reply:
      "স্যার নিশ্চিন্তে থাকুন, আমাদের খাদি পাঞ্জাবি ১০০% কটন কাপড়ে তৈরি, রং ওঠার কোনো সমস্যা নেই, পরে আরামদায়ক লাগবে।",
  },

  // ==== কাপড়ের মান (শাড়ি/থ্রি-পিস — দামের আগে চেক হবে) ====
  {
    keywords: [
      "কাপড় ভালো",
      "রং উঠবে",
      "মান কেমন",
      "quality kemon",
      "কাপড়ের মান",
      "kapor valo",
      "rong uthbe",
      "kapor er man",
    ],
    reply:
      "স্যার নিশ্চিন্তে থাকুন, আমাদের শাড়ি ও থ্রি-পিস ১০০% কটন কাপড়ে তৈরি, রং ওঠার কোনো সমস্যা নেই।",
  },

  // ==== প্রোডাক্টের দাম (নির্দিষ্ট) ====
  {
    keywords: ["শাল", "shawl", "shal"],
    reply:
      "স্যার আমাদের কাছে ২ সাইজের শাল আছে। শালের দাম একটু আলাদা —\n৫ হাতের শাল: ৪৫০-৬৫০ টাকা\n৬ হাতের শাল: ৮৫০-১১৫০ টাকা\n\nআপনি কোনটা নিতে চান? কালার অথবা কোড নম্বর বলুন প্লিজ।",
  },
  {
    keywords: ["খাদি", "পাঞ্জাবি", "panjabi", "khadi"],
    reply: "খাদি পাঞ্জাবি:\nএক কালার (প্লেইন): ৪৫০ টাকা\nডিজাইন করা: ৫৫০-১১৫০ টাকা",
  },
  {
    keywords: ["টাঙ্গাইল", "শাড়ি", "saree", "shari", "tangail"],
    reply: "টাঙ্গাইল শাড়ির দাম: ১০০০-১৫০০ টাকা",
  },
  {
    keywords: ["থ্রি-পিস", "থ্রিপিস", "three piece", "3 piece", "3piece", "threepiece"],
    reply:
      "থ্রি-পিস:\nবাটিক থ্রি-পিস: ৭০০ টাকা\nকাজ করা (এমব্রয়ডারি) থ্রি-পিস: ১০৫০ টাকা\n১০০% কটন কাপড়।",
  },

  // ==== সাধারণ দাম জিজ্ঞাসা (প্রোডাক্টের নাম ছাড়া) ====
  {
    keywords: ["দাম কত", "price koto", "কত টাকা", "koto taka", "dam koto"],
    reply: "স্যার কোন পণ্যের দাম জানতে চান? কালার অথবা কোড নম্বর বলুন।",
  },

  // ==== লোকেশন ====
  {
    keywords: ["location", "লোকেশন", "ঠিকানা", "কোথায়", "thikana", "kothay"],
    reply: "ঢাকার বাইরে, টাঙ্গাইল সদর — আমাদের লোকেশন।",
  },

  // ==== কুরিয়ার/পাঠানোর মাধ্যম ====
  {
    keywords: [
      "কিসের মাধ্যমে পাঠাবেন",
      "কুরিয়ার",
      "courier",
      "কিভাবে পাঠাবেন",
      "kivabe pathaben",
      "kiser maddhome pathaben",
      "kurier",
    ],
    reply:
      "স্যার/ম্যাম আপনাকে আমরা স্টেডফাস্ট কুরিয়ারের মাধ্যমে পাঠাবো। আপনি হোম ডেলিভারি নিতে চাইলে নিতে পারবেন, অথবা আপনার পছন্দের যেকোনো ঠিকানায়।",
  },

  // ==== ডেলিভারি সময় ====
  {
    keywords: [
      "ডেলিভারি সময়",
      "delivery time",
      "কতদিনে পাব",
      "কয়দিনে পাব",
      "কত দিন লাগবে",
      "কতদিন লাগবে",
      "koto din lagbe",
      "kotodin lagbe",
      "কত দিনে পাব",
      "kotodine pabo",
      "koidine pabo",
      "কত দিনে হাতে পাব",
    ],
    reply: "ঢাকার ভেতরে ডেলিভারি সময় ১-২ দিন, ঢাকার বাইরে ২-৩ দিন লাগে।",
  },

  // ==== একাধিক পিস নিলে ডেলিভারি চার্জ ====
  {
    keywords: [
      "দুইটা এক সাথে",
      "একাধিক পিস",
      "কয়েকটা নিলে চার্জ",
      "multiple item charge",
      "duita eksathe",
      "koyekta nile charge",
    ],
    reply:
      "ধন্যবাদ, ১ পিসের বেশি নিলে ওজনের কারণে চার্জ কিছুটা বাড়ে। ১ পিস নিলে ঢাকার ভিতর ১০০৳, ঢাকার বাইরে ১৩০৳ আসে। ১ পিসের বেশি নিলে প্রতি পিসে ২০-৩০৳ করে বাড়ে, তবে চার্জ ডাবল হয় না।",
  },

  // ==== ডেলিভারি চার্জ ====
  {
    keywords: [
      "ডেলিভারি চার্জ",
      "delivery charge",
      "ডেলিভারি খরচ",
      "delivery kharoch",
      "delivery koto",
    ],
    reply: "ঢাকার ভেতরে ডেলিভারি চার্জ ১০০ টাকা, ঢাকার বাইরে ১৩০ টাকা।",
  },

  // ==== ক্যাশ অন ডেলিভারি ====
  {
    keywords: [
      "cash on",
      "ক্যাশ অন",
      "যাশঅন",
      "হোম ডেলিভারি",
      "home delivery",
      "cash on delivery",
      "home delivery ache",
    ],
    reply: "হ্যাঁ স্যার, আমাদের ক্যাশ অন হোম ডেলিভারি আছে।",
  },

  // ==== পেমেন্ট পদ্ধতি ====
  {
    keywords: [
      "পেমেন্ট",
      "payment",
      "বিকাশ",
      "bkash",
      "নগদ",
      "nagad",
      "kivabe payment",
    ],
    reply: "আমরা শুধু ক্যাশ অন ডেলিভারিতে পেমেন্ট নিই — প্রোডাক্ট হাতে পেয়ে টাকা দিবেন।",
  },

  // ==== হাতে পেয়ে দেখে নেওয়া যাবে কিনা ====
  {
    keywords: [  "শাল দেখে নিতে পারব?",
      "দেখে নিতে পারব",
      "দেখে নেওয়া যাবে",
      "check kore nite parbo",
      "dekhe nite parbo",
      "dekhe newa jabe",
    ],
    reply:
      "জ্বী অবশ্যই, পণ্য হাতে পেয়ে দেখে তারপর পেমেন্ট করতে পারবেন। পছন্দ না হলে চার্জ দিয়ে রিটার্ন করে দিতে পারবেন। আশা করি পছন্দ হবে ইনশাআল্লাহ।",
  },

  // ==== এক্সচেঞ্জ/রিটার্ন ====
  {
    keywords: [
      "এক্সচেঞ্জ",
      "রিটার্ন",
      "exchange",
      "return",
      "ফেরত",
      "পাল্টানো",
      "ferot",
      "paltano",
      "exchange kora jabe",
    ],
    reply:
      "ধন্যবাদ, জ্বী আমাদের এক্সচেঞ্জ বা পাল্টানোর পলিসি আছে। কুরিয়ার ম্যান থাকা অবস্থায় আমাদের জানাবেন, আমরা ব্যবস্থা করে দেব। সেক্ষেত্রে কুরিয়ার চার্জ ডাবল হবে। তবে কাটা/ছেঁড়া সমস্যা হলে চার্জ দিতে হবে না।",
  },

  // ==== অগ্রিম পেমেন্ট ====
  {
    keywords: [  "কোনো অ্যাডভান্স (অগ্রিম টাকা) করতে হবে কি?",
      "অগ্রিম",
      "advance",
      "আগে টাকা",
      "advance payment",
      "agrim",
      "age taka",
      "advance lagbe",
    ],
    reply:
      "না স্যার, কোনো অগ্রিম টাকা লাগবে না। হাতে পণ্য পেয়ে দেখে তারপর টাকা পরিশোধ করবেন। কোনো কারণে না নিলে বা পণ্য পছন্দ না হলে শুধু ডেলিভারি চার্জ পরিশোধ করে ফেরত দিতে পারবেন।",
  },

  // ==== পাইকারি/বাল্ক অর্ডার ====
  {
    keywords: [
      "পাইকারি",
      "বাল্ক",
      "wholesale",
      "bulk order",
      "বেশি পরিমাণ",
      "paikari",
      "balk order",
      "beshi porimane",
    ],
    reply:
      "হ্যাঁ স্যার, পাইকারি/বাল্ক অর্ডার নেওয়া হয়। দাম আলোচনা সাপেক্ষে, বিস্তারিত জানতে ইনবক্সে জানান।",
  },

  // ==== কীভাবে অর্ডার করব ====
  {
    keywords: [
      "অর্ডার কিভাবে",
      "কিভাবে অর্ডার",
      "order kivabe",
      "order korbo",
      "kivabe order korbo",
      "অর্ডার করতে চাই",
      "oder korte cai",
      "order korte cai",
      "অর্ডার প্রসেস",
      "order process",
      "order proses",
      "order process ki",
    ],
    reply:
      "অর্ডার করতে পণ্যের ছবি বা কোড নং লিখে আপনার নাম, ফুল ঠিকানা এবং ফোন নম্বর ইনবক্সে জানান। আমরা দ্রুত কনফার্ম করে ডেলিভারি পাঠিয়ে দেব।",
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
      "shorasori kotha",
      "whatsapp",
      "হোয়াটসঅ্যাপ",
    ],
    reply: "আমাদের নাম্বার: 01690158675 — কল অথবা WhatsApp দুটোতেই যোগাযোগ করতে পারবেন।",
  },

  // ==== নতুন কালেকশন ====
  {
    keywords: [
      "নতুন কালেকশন",
      "নতুন প্রোডাক্ট",
      "new collection",
      "notun collection",
      "notun product",
    ],
    reply: "প্রতি সপ্তাহে আমাদের নতুন কালেকশন আসে। পেজে ফলো রাখুন, নতুন আপডেট সবার আগে পেয়ে যাবেন 😊",
  },

  // ==== দোকান/অফিসের সময় ====
  {
    keywords: [
      "কখন খোলা",
      "অফিস সময়",
      "office time",
      "shop time",
      "কখন পাব আপনাদের",
      "kokhon khola",
      "kokhon pabo",
    ],
    reply: "আমরা সবসময়ই (২৪ ঘণ্টা) খোলা থাকি, যেকোনো সময় মেসেজ করতে পারেন।",
  },

  // ==== ছবির মতোই হবে কিনা ====
  {
    keywords: [  "ছবিতে যেমন তেমন হবে কি?",
      "ছবির মতো",
      "ছবিতে যেমন",
      "chobir moto",
      "picture er moto",
      "ছবির মত হবে",
      "jamon dakacche",
      "jemon dekhacche",
      "jemon dekhchen temon",
    ],
    reply:
      "জ্বি ইনশাআল্লাহ, যেমন দেখছেন তেমনই হবে। আলো কম-বেশি বা ক্যামেরা রেজুলেশনের কারণে ১৯/২০ লাগতে পারে।",
  },

  // ==== স্টকে আছে কিনা ====
  {
    keywords: ["স্টকে আছে", "stock ache", "স্টক আছে", "in stock"],
    reply: "ধন্যবাদ স্যার, চেক করে জানাচ্ছি।",
  },

  // ==== গিফটের জন্য ভালো হবে কিনা ====
  {
    keywords: ["গিফট", "উপহার", "gift", "upohar"],
    reply:
      "জ্বী স্যার, আমাদের প্রোডাক্টগুলো গিফট দেওয়ার জন্য ভালো হবে। ইনশাআল্লাহ আপনি যাকে গিফট করবেন মন থেকে খুশি হবে। চাইলে সুন্দর প্যাকেজিং করেও পাঠাতে পারি।",
  },

  // ==== ডিসকাউন্ট/ছাড় ====
  {
    keywords: ["ডিসকাউন্ট", "discount", "ছাড়", "char", "chhar", "coupon", "কুপন", "দাম বেশি" , "আপনাদের শালের দাম বেশি ", " আপনাদের পণ্যের দাম বেশি", "দাম বেশি মনে হচ্ছে"],
    reply:
      "স্যার আমাদের পণ্যে ভালো দাম রাখার চেষ্টা করি। মূল বিষয় হচ্ছে, পণ্য ভালো কোয়ালিটিফুল করতে গেলে খরচ বেশি হয়ে যায়, যার কারণে আমাদের একটা সীমাবদ্ধতা থাকে। তারপরও আমরা অন্যদের চেয়ে ভালো কোয়ালিটি দিয়ে দাম কম রাখার চেষ্টা করি, ইনশাআল্লাহ আপনি পণ্য পেয়ে খুশি হবেন।",
  },

  // ==== অর্ডার ট্র্যাকিং ====
  {
    keywords: [
      "আমার অর্ডার কোথায়",
      "পাঠিয়েছেন কি",
      "order kothay",
      "amar order",
      "order track",
    ],
    reply: "স্যার এখনই স্ট্যাটাস চেক করে জানিয়ে দিচ্ছি।",
  },

  // ==== অর্ডার ক্যানসেল ====
  {
    keywords: ["অর্ডার ক্যানসেল", "order cancel", "বাতিল করতে চাই", "batil korte cai"],
    reply:
      "স্যার, অর্ডার ক্যানসেল করতে চাইলে অবশ্যই বুকিং দেওয়ার আগে জানাতে হবে। বুকিং দেওয়ার পর অর্ডার ক্যানসেল করলে বুকিং খরচ কাটার কারণে তা আপনাকে পরিশোধ করতে হবে।",
  },

  // ==== বিশ্বাসযোগ্যতা/প্রতারণা সংক্রান্ত ====
  {
    keywords: [
      "বিশ্বাসযোগ্য","কিসের তৈরি","অরিজিনাল
      "প্রতারণা","অরিজিনাল উলের ৈরি",
      "আসল কিনা",
      "vua na to",
      "prottarona",
      "trust kora jabe",
      "real seller",
    ],
    reply:
      "স্যার নিশ্চিন্তে থাকুন, আমরা ক্যাশ অন ডেলিভারিতে পণ্য পাঠাই — হাতে পেয়ে দেখে তারপর পেমেন্ট করবেন, তাই কোনো ঝুঁকি নেই। আমাদের অনেক নিয়মিত কাস্টমার আছেন, তাদের দেওয়া রিভিউ আমাদের পেজে দেওয়া আছে দেখতে পারেন। ইনবক্সে যোগাযোগ করে নিশ্চিন্তে অর্ডার করতে পারেন।",
  },

  // ==== বিদায়/ছোট রিপ্লাই ====
  {
    keywords: ["ওকে", "আচ্ছা", "ok", "okay", "thik ache", "ঠিক আছে", "acca"],
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
