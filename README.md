# ক্ষতিগ্রস্ত তথ্য সংগ্রহ (Bengali Voice Survey System)

একটি বাস্তব-সময়ের বাংলা ভয়েস সার্ভে সিস্টেম যা Gemini 3 Flash API ব্যবহার করে কথোপকথনের মাধ্যমে তথ্য সংগ্রহ করে।

## বৈশিষ্ট্য

- **রিয়েল-টাইম ভয়েস ইন্টারফেস**: Gemini 3 Flash API ব্যবহার করে বাংলা ভাষায় কথোপকথন
- **অডিও রেকর্ডিং**: ব্যবহারকারীর কথোপকথন স্বয়ংক্রিয়ভাবে রেকর্ড এবং সংরক্ষণ
- **ট্রান্সক্রিপশন**: কথোপকথনের রিয়েল-টাইম ট্রান্সক্রিপশন
- **ডেটা এক্সট্র্যাকশন**: কথোপকথন থেকে কাঠামোবদ্ধ তথ্য স্বয়ংক্রিয়ভাবে সংগ্রহ
- **এডমিন ড্যাশবোর্ড**: পরিসংখ্যান, গ্রাফ এবং চার্ট সহ বিশ্লেষণ প্যানেল

## প্রযুক্তি স্ট্যাক

- **Frontend**: Next.js 16.1.1, React 19.2.3, Tailwind CSS v4, Shadcn UI, Effect.ts
- **Backend**: Next.js API Routes, PostgreSQL, Prisma v7
- **AI**: Google Gemini 3 Flash API
- **Charts**: Recharts

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

## প্রজেক্ট স্ট্রাকচার

```
voice/
├── app/
│   ├── page.tsx              # মূল ভয়েস ইন্টারফেস
│   ├── admin/page.tsx        # এডমিন ড্যাশবোর্ড
│   └── api/                   # API routes
├── components/
│   ├── voice/                 # ভয়েস ইন্টারফেস কম্পোনেন্ট
│   └── admin/                 # এডমিন ড্যাশবোর্ড কম্পোনেন্ট
├── lib/                       # ইউটিলিটি ফাংশন
├── prisma/
│   └── schema.prisma          # ডাটাবেস স্কিমা
└── data/
    └── recordings/            # রেকর্ড করা অডিও ফাইল
```

## API Endpoints

- `POST /api/session/start` - নতুন সেশন শুরু করুন
- `GET /api/session/[id]` - সেশন তথ্য পান
- `PATCH /api/session/[id]` - সেশন আপডেট করুন
- `POST /api/session/[id]/audio` - অডিও চাঙ্ক আপলোড করুন
- `POST /api/gemini` - Gemini API কল করুন
- `GET /api/respondents` - সমস্ত প্রতিক্রিয়া পান
- `GET /api/stats` - পরিসংখ্যান পান
- `POST /api/tasks/process` - ব্যাকগ্রাউন্ড টাস্ক প্রসেস করুন

## লাইসেন্স

MIT
