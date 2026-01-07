# ক্ষতিগ্রস্ত তথ্য সংগ্রহ (Bengali Voice Survey System)

একটি বাস্তব-সময়ের বাংলা ভয়েস সার্ভে সিস্টেম যা Gemini 3 Flash API ব্যবহার করে কথোপকথনের মাধ্যমে তথ্য সংগ্রহ করে।

## বৈশিষ্ট্য

- **রিয়েল-টাইম ভয়েস ইন্টারফেস**: Gemini 3 Flash API ব্যবহার করে বাংলা ভাষায় কথোপকথন
- **অডিও রেকর্ডিং**: ব্যবহারকারীর কথোপকথন স্বয়ংক্রিয়ভাবে রেকর্ড এবং সংরক্ষণ
- **ট্রান্সক্রিপশন**: কথোপকথনের রিয়েল-টাইম ট্রান্সক্রিপশন
- **ডেটা এক্সট্র্যাকশন**: কথোপকথন থেকে কাঠামোবদ্ধ তথ্য স্বয়ংক্রিয়ভাবে সংগ্রহ
- **এডমিন ড্যাশবোর্ড**: পরিসংখ্যান, গ্রাফ এবং চার্ট সহ বিশ্লেষণ প্যানেল
  - **পরিসংখ্যান কার্ড**: মোট প্রতিক্রিয়া, মোট ক্ষতি, গড় ক্ষতি প্রদর্শন
  - **জেলা ভিত্তিক বিশ্লেষণ**: জেলা অনুযায়ী ক্ষতির পরিসংখ্যান
  - **ক্ষতির ধরন বিশ্লেষণ**: বিভিন্ন ধরনের ক্ষতির বিতরণ
  - **বার্ষিক ট্রেন্ড**: সময়ের সাথে ক্ষতির প্রবণতা
  - **ক্ষতি বিতরণ**: ক্ষতির পরিমাণ অনুযায়ী বিতরণ চার্ট
  - **ডেটা টেবিল**: সমস্ত প্রতিক্রিয়ার বিস্তারিত তালিকা (সর্টিং ও পেজিনেশন সহ)
- **অডিও ফাইল ম্যানেজমেন্ট**: 
  - সেশন থেকে অডিও ফাইল দেখুন এবং ডাউনলোড করুন
  - সার্চ এবং ফিল্টারিং সুবিধা
  - ক্লায়েন্ট-সাইড পেজিনেশন
- **ক্লায়েন্ট-সাইড পেজিনেশন**: বড় ডেটাসেটের জন্য স্মার্ট পেজিনেশন সুবিধা (১০টি আইটেম প্রতি পৃষ্ঠায়)
- **সার্চ ও ফিল্টারিং**: দ্রুত ডেটা খুঁজে বের করার জন্য সার্চ ফাংশনালিটি
- **সর্টিং**: কলাম অনুযায়ী ডেটা সর্ট করার সুবিধা
- **রিয়েল-টাইম আপডেট**: পরিসংখ্যান স্বয়ংক্রিয়ভাবে আপডেট হয় (৩০ সেকেন্ড অন্তর)

## প্রযুক্তি স্ট্যাক

- **Frontend**: Next.js 16.1.1, React 19.2.3, Tailwind CSS v4, Shadcn UI, Effect.ts
- **Backend**: Next.js API Routes, PostgreSQL, Prisma v7
- **AI**: Google Gemini 3 Flash API
- **Charts**: Recharts
- **Icons**: Tabler Icons
- **State Management**: React Hooks (useState, useEffect, useMemo)

## সেটআপ

### প্রয়োজনীয়তা

- Node.js 18+ 
- PostgreSQL
- Google Gemini API Key

### ইনস্টলেশন

1. **ডিপেন্ডেন্সি ইনস্টল করুন:**

```bash
npm install
```

2. **এনভায়রনমেন্ট ভেরিয়েবল সেটআপ করুন:**

`.env` ফাইল তৈরি করুন:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/voice_survey"
GOOGLE_AI_API_KEY="your-gemini-api-key-here"
```

3. **ডাটাবেস সেটআপ করুন:**

Prisma v7 requires additional setup:

```bash
# Generate Prisma Client (this will create the client in generated/prisma/)
npx prisma generate

# Run migrations
npx prisma migrate dev --name init
```

**Important**: Prisma v7 uses a new client generation path. After running `prisma generate`, the client will be available at `./generated/prisma/client` instead of `@prisma/client`. The codebase has been updated to use the new import path.

4. **ডেভেলপমেন্ট সার্ভার চালু করুন:**

```bash
npm run dev
```

5. **ব্যাকগ্রাউন্ড টাস্ক প্রসেসিং:**

টাস্ক প্রসেসিংয়ের জন্য, একটি cron job বা scheduled task সেটআপ করুন যা নিয়মিতভাবে `/api/tasks/process` endpoint কল করবে:

```bash
# প্রতি 5 মিনিটে টাস্ক প্রসেস করুন
*/5 * * * * curl -X POST http://localhost:3000/api/tasks/process
```

অথবা Next.js API route ব্যবহার করে একটি cron endpoint তৈরি করুন।

## ব্যবহার

1. **ভয়েস ইন্টারফেস**: `http://localhost:3000` - ব্যবহারকারীরা এখানে কথা বলবে এবং তথ্য সংগ্রহ করবে
2. **এডমিন ড্যাশবোর্ড**: `http://localhost:3000/admin` - পরিসংখ্যান এবং বিশ্লেষণ দেখুন
   - পরিসংখ্যান কার্ড, চার্ট এবং গ্রাফ দেখুন
   - প্রতিক্রিয়ার বিস্তারিত তালিকা দেখুন (সর্টিং ও পেজিনেশন সহ)
3. **অডিও ফাইল পেজ**: `http://localhost:3000/admin/audio` - রেকর্ড করা অডিও ফাইল দেখুন এবং ডাউনলোড করুন

## প্রজেক্ট স্ট্রাকচার

```
voice/
├── app/
│   ├── page.tsx              # মূল ভয়েস ইন্টারফেস
│   ├── admin/
│   │   ├── page.tsx          # এডমিন ড্যাশবোর্ড
│   │   └── audio/page.tsx    # অডিও ফাইল ম্যানেজমেন্ট পেজ
│   └── api/                   # API routes
│       ├── session/           # সেশন ম্যানেজমেন্ট
│       ├── audio/             # অডিও আপলোড
│       ├── sessions/          # সেশন তালিকা
│       ├── respondents/       # প্রতিক্রিয়া ডেটা
│       ├── stats/             # পরিসংখ্যান
│       ├── gemini/            # Gemini AI API
│       ├── tts/               # Text-to-Speech
│       └── tasks/             # ব্যাকগ্রাউন্ড টাস্ক
├── components/
│   ├── voice/                 # ভয়েস ইন্টারফেস কম্পোনেন্ট
│   └── admin/                 # এডমিন ড্যাশবোর্ড কম্পোনেন্ট
│       ├── StatsCards.tsx     # পরিসংখ্যান কার্ড
│       ├── DistrictChart.tsx  # জেলা চার্ট
│       ├── IncidentTypeChart.tsx  # ক্ষতির ধরন চার্ট
│       ├── YearlyTrendChart.tsx   # বার্ষিক ট্রেন্ড চার্ট
│       ├── LossDistributionChart.tsx  # ক্ষতি বিতরণ চার্ট
│       └── DataTable.tsx      # ডেটা টেবিল (পেজিনেশন সহ)
├── lib/                       # ইউটিলিটি ফাংশন
├── prisma/
│   └── schema.prisma          # ডাটাবেস স্কিমা
└── data/
    └── recordings/            # রেকর্ড করা অডিও ফাইল
```

## API Endpoints

### সেশন ম্যানেজমেন্ট
- `POST /api/session/start` - নতুন সেশন শুরু করুন
- `GET /api/session/[id]` - সেশন তথ্য পান
- `PATCH /api/session/[id]` - সেশন আপডেট করুন
- `POST /api/session/[id]/audio` - অডিও চাঙ্ক আপলোড করুন
- `GET /api/session/[id]/audio` - সেশনের অডিও ফাইল ডাউনলোড করুন

### অডিও ম্যানেজমেন্ট
- `POST /api/audio/upload` - অডিও ফাইল আপলোড করুন
- `GET /api/sessions/audio` - সব সেশনের অডিও তালিকা পান

### ডেটা এবং পরিসংখ্যান
- `GET /api/respondents` - সমস্ত প্রতিক্রিয়া পান (পেজিনেশন ও সর্টিং সহ)
- `GET /api/stats` - পরিসংখ্যান পান (মোট প্রতিক্রিয়া, ক্ষতি, গড় ইত্যাদি)

### AI এবং প্রসেসিং
- `POST /api/gemini` - Gemini API কল করুন
- `POST /api/tts` - Text-to-Speech API
- `POST /api/tasks/process` - ব্যাকগ্রাউন্ড টাস্ক প্রসেস করুন

## লাইসেন্স

MIT
