import { SessionStatus } from "../generated/prisma/client";

// Bangladeshi names data
const bangladeshiNames = [
  {
    name: "রহিম উদ্দিন",
    fatherName: "করিম উদ্দিন",
    motherName: "ফাতেমা খাতুন",
  },
  {
    name: "আলমগীর হোসেন",
    fatherName: "মোস্তাফিজুর রহমান",
    motherName: "রোকেয়া বেগম",
  },
  {
    name: "শাহিনা আক্তার",
    fatherName: "আবুল কাশেম",
    motherName: "রাবেয়া খাতুন",
  },
  {
    name: "মোঃ রফিকুল ইসলাম",
    fatherName: "মোঃ আবুল হোসেন",
    motherName: "আয়েশা খাতুন",
  },
  {
    name: "নাজমা বেগম",
    fatherName: "আব্দুল করিম",
    motherName: "জাহানারা খাতুন",
  },
  {
    name: "আব্দুল মালেক",
    fatherName: "মোঃ হাফিজুর রহমান",
    motherName: "মরিয়ম বেগম",
  },
  {
    name: "ফাতেমা খাতুন",
    fatherName: "মোঃ সেলিম উদ্দিন",
    motherName: "রোকেয়া বেগম",
  },
  {
    name: "মোঃ জাহিদ হাসান",
    fatherName: "মোঃ নুরুল ইসলাম",
    motherName: "রাবেয়া খাতুন",
  },
  {
    name: "রোকেয়া বেগম",
    fatherName: "আব্দুল হালিম",
    motherName: "আয়েশা খাতুন",
  },
  {
    name: "মোঃ কামরুল হাসান",
    fatherName: "মোঃ আবুল কালাম",
    motherName: "নাজমা খাতুন",
  },
  {
    name: "আয়েশা খাতুন",
    fatherName: "মোঃ রফিক উদ্দিন",
    motherName: "ফাতেমা বেগম",
  },
  {
    name: "মোঃ সাইফুল ইসলাম",
    fatherName: "মোঃ আব্দুল হক",
    motherName: "রোকেয়া খাতুন",
  },
  {
    name: "জাহানারা খাতুন",
    fatherName: "মোঃ আবুল বাশার",
    motherName: "মরিয়ম বেগম",
  },
  {
    name: "মোঃ তানভীর আহমেদ",
    fatherName: "মোঃ আবুল কাশেম",
    motherName: "রাবেয়া খাতুন",
  },
  {
    name: "রাবেয়া খাতুন",
    fatherName: "মোঃ আব্দুল করিম",
    motherName: "আয়েশা বেগম",
  },
  {
    name: "মোঃ ইমরান হোসেন",
    fatherName: "মোঃ আবুল হোসেন",
    motherName: "নাজমা খাতুন",
  },
  {
    name: "মরিয়ম বেগম",
    fatherName: "মোঃ সেলিম উদ্দিন",
    motherName: "ফাতেমা খাতুন",
  },
  {
    name: "মোঃ রাশেদুল ইসলাম",
    fatherName: "মোঃ নুরুল ইসলাম",
    motherName: "রোকেয়া বেগম",
  },
  {
    name: "নাজমা খাতুন",
    fatherName: "মোঃ আবুল কালাম",
    motherName: "আয়েশা খাতুন",
  },
  {
    name: "মোঃ শরিফুল ইসলাম",
    fatherName: "মোঃ আব্দুল হক",
    motherName: "রাবেয়া খাতুন",
  },
  {
    name: "আয়েশা বেগম",
    fatherName: "মোঃ রফিক উদ্দিন",
    motherName: "জাহানারা খাতুন",
  },
  {
    name: "মোঃ ফারুক আহমেদ",
    fatherName: "মোঃ আবুল বাশার",
    motherName: "মরিয়ম বেগম",
  },
  {
    name: "রোকেয়া খাতুন",
    fatherName: "মোঃ আবুল কাশেম",
    motherName: "ফাতেমা খাতুন",
  },
  {
    name: "মোঃ মাসুদ রানা",
    fatherName: "মোঃ আব্দুল করিম",
    motherName: "রোকেয়া বেগম",
  },
  {
    name: "ফাতেমা বেগম",
    fatherName: "মোঃ আবুল হোসেন",
    motherName: "নাজমা খাতুন",
  },
  {
    name: "মোঃ নাজমুল হাসান",
    fatherName: "মোঃ সেলিম উদ্দিন",
    motherName: "আয়েশা খাতুন",
  },
  {
    name: "রাবেয়া বেগম",
    fatherName: "মোঃ নুরুল ইসলাম",
    motherName: "রাবেয়া খাতুন",
  },
  {
    name: "মোঃ সোহেল রানা",
    fatherName: "মোঃ আবুল কালাম",
    motherName: "জাহানারা খাতুন",
  },
  {
    name: "জাহানারা বেগম",
    fatherName: "মোঃ আব্দুল হক",
    motherName: "মরিয়ম বেগম",
  },
  {
    name: "মোঃ রাকিব হাসান",
    fatherName: "মোঃ রফিক উদ্দিন",
    motherName: "ফাতেমা খাতুন",
  },
];

const districts = [
  "ঢাকা",
  "চট্টগ্রাম",
  "সিলেট",
  "রাজশাহী",
  "খুলনা",
  "বরিশাল",
  "রংপুর",
  "ময়মনসিংহ",
  "কুমিল্লা",
  "নারায়ণগঞ্জ",
  "গাজীপুর",
  "টাঙ্গাইল",
  "কিশোরগঞ্জ",
  "ফরিদপুর",
  "বরিশাল",
  "নোয়াখালী",
];

const upazilas = [
  "সাভার",
  "ধামরাই",
  "কেরানীগঞ্জ",
  "আনোয়ারা",
  "কর্ণফুলি",
  "পটিয়া",
  "সিলেট সদর",
  "বালাগঞ্জ",
  "রাজশাহী সদর",
  "পবা",
  "খুলনা সদর",
  "দাকোপ",
  "বরিশাল সদর",
  "বাকেরগঞ্জ",
  "রংপুর সদর",
  "মিঠাপুকুর",
  "ময়মনসিংহ সদর",
  "ত্রিশাল",
  "কুমিল্লা সদর",
  "চান্দিনা",
];

const unions = [
  "বালুচর",
  "কাশিমপুর",
  "সাভার",
  "ধামরাই",
  "আনোয়ারা",
  "কর্ণফুলি",
  "পটিয়া",
  "বালাগঞ্জ",
  "পবা",
  "দাকোপ",
  "বাকেরগঞ্জ",
  "মিঠাপুকুর",
  "ত্রিশাল",
  "চান্দিনা",
  "কাশিমপুর",
];

const villages = [
  "উত্তরপাড়া",
  "দক্ষিণপাড়া",
  "পূর্বপাড়া",
  "পশ্চিমপাড়া",
  "মধ্যপাড়া",
  "নতুনপাড়া",
  "পুরাতনপাড়া",
  "কেন্দ্রপাড়া",
  "বাজারপাড়া",
  "মসজিদপাড়া",
];

const professions = [
  "কৃষক",
  "দিনমজুর",
  "ছোট ব্যবসায়ী",
  "রিকশাচালক",
  "মাছ বিক্রেতা",
  "দোকানদার",
  "শিক্ষক",
  "কর্মচারী",
  "চালক",
  "কামার",
  "কুমার",
  "তাঁতী",
];

const incidentTypes = [
  "বন্যা",
  "ঘূর্ণিঝড়",
  "আগুন",
  "ভূমিকম্প",
  "নদীভাঙন",
  "খরা",
  "শিলাবৃষ্টি",
  "বজ্রপাত",
  "মহামারী",
  "অগ্নিকাণ্ড",
];

const months = [
  "জানুয়ারি",
  "ফেব্রুয়ারি",
  "মার্চ",
  "এপ্রিল",
  "মে",
  "জুন",
  "জুলাই",
  "আগস্ট",
  "সেপ্টেম্বর",
  "অক্টোবর",
  "নভেম্বর",
  "ডিসেম্বর",
];

const years = [2020, 2021, 2022, 2023, 2024];

function generateSessionCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function getRandomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function getRandomFloat(min: number, max: number): number {
  return Math.round((Math.random() * (max - min) + min) * 100) / 100;
}

function getRandomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export interface SeedSession {
  sessionCode: string;
  audioFilename: string | null;
  status: SessionStatus;
  createdAt: Date;
  completedAt: Date | null;
  respondent: {
    name: string | null;
    fatherName: string | null;
    motherName: string | null;
    district: string | null;
    upazila: string | null;
    union: string | null;
    village: string | null;
    profession: string | null;
    incidentType: string | null;
    incidentYear: number | null;
    incidentMonth: string | null;
    lossAmount: number | null;
    additionalInfo: string | null;
  };
}

export function generateSeedData(count: number = 50): SeedSession[] {
  const sessions: SeedSession[] = [];
  const usedSessionCodes = new Set<string>();

  for (let i = 0; i < count; i++) {
    let sessionCode: string;
    do {
      sessionCode = generateSessionCode();
    } while (usedSessionCodes.has(sessionCode));
    usedSessionCodes.add(sessionCode);

    const nameData = getRandomElement(bangladeshiNames);
    const status = getRandomElement([
      SessionStatus.COMPLETED,
      SessionStatus.COMPLETED,
      SessionStatus.COMPLETED,
      SessionStatus.IN_PROGRESS,
      SessionStatus.FAILED,
    ]);

    const createdAt = new Date();
    createdAt.setDate(createdAt.getDate() - getRandomInt(0, 365));

    const completedAt =
      status === SessionStatus.COMPLETED
        ? new Date(
            createdAt.getTime() + getRandomInt(1, 7) * 24 * 60 * 60 * 1000
          )
        : null;

    const incidentYear = getRandomElement(years);
    const incidentMonth = getRandomElement(months);
    const lossAmount = getRandomFloat(5000, 500000);

    const additionalInfoOptions = [
      "বাড়ির সব কিছু নষ্ট হয়ে গেছে",
      "ফসলের ক্ষতি হয়েছে",
      "গবাদি পশু মারা গেছে",
      "বাড়ি ভেঙে পড়েছে",
      "জমি নদীতে চলে গেছে",
      null,
      null,
    ];

    sessions.push({
      sessionCode,
      audioFilename: `recording_${sessionCode}.webm`,
      status,
      createdAt,
      completedAt,
      respondent: {
        name: nameData.name,
        fatherName: nameData.fatherName,
        motherName: nameData.motherName,
        district: getRandomElement(districts),
        upazila: getRandomElement(upazilas),
        union: getRandomElement(unions),
        village: getRandomElement(villages),
        profession: getRandomElement(professions),
        incidentType: getRandomElement(incidentTypes),
        incidentYear,
        incidentMonth,
        lossAmount,
        additionalInfo: getRandomElement(additionalInfoOptions),
      },
    });
  }

  return sessions;
}
