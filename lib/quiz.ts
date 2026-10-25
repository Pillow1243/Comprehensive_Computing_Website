/**
 * Deterministic practice-question generator (v4).
 *
 * Questions are built from twelve hand-checked templates whose answers are
 * always exact integers, so a generated quiz can never contain a wrong key.
 * A mulberry32 PRNG seeded from a string makes the daily challenge identical
 * for everyone on the same calendar day — without any server.
 */

export type QuizDifficulty = 1 | 2 | 3;

export interface QuizQuestion {
  id: string;
  topicFa: string;
  topicEn: string;
  difficulty: QuizDifficulty;
  promptFa: string;
  promptEn: string;
  choices: number[];
  answerIndex: number;
  explanationFa: string;
  explanationEn: string;
  unitFa?: string;
  unitEn?: string;
}

export function hashSeed(text: string): number {
  let hash = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Rng = () => number;

const int = (rng: Rng, min: number, max: number) => min + Math.floor(rng() * (max - min + 1));
const pick = <T,>(rng: Rng, items: T[]): T => items[Math.floor(rng() * items.length)];

function makeChoices(rng: Rng, answer: number): { choices: number[]; answerIndex: number } {
  const offsets = [1, -1, 2, -2, 5, -5, 10, -10, Math.max(1, Math.round(answer * 0.1)), answer];
  const distractors = new Set<number>();
  let guard = 0;
  while (distractors.size < 3 && guard < 40) {
    guard += 1;
    const candidate = answer + pick(rng, offsets);
    if (candidate !== answer && Number.isFinite(candidate)) distractors.add(candidate);
  }
  while (distractors.size < 3) distractors.add(answer + distractors.size + 3);
  const choices = [answer, ...distractors];
  for (let i = choices.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [choices[i], choices[j]] = [choices[j], choices[i]];
  }
  return { choices, answerIndex: choices.indexOf(answer) };
}

const gcdOf = (a: number, b: number): number => {
  let x = Math.abs(a);
  let y = Math.abs(b);
  while (y) [x, y] = [y, x % y];
  return x;
};

interface Template {
  topicFa: string;
  topicEn: string;
  build: (rng: Rng, difficulty: QuizDifficulty) => Omit<QuizQuestion, 'id' | 'topicFa' | 'topicEn' | 'difficulty'>;
}

const TEMPLATES: Template[] = [
  {
    topicFa: 'درصد',
    topicEn: 'Percentages',
    build(rng, difficulty) {
      const p = pick(rng, [5, 10, 20, 25, 40, 50, 75]);
      const base = int(rng, 2, difficulty === 3 ? 60 : 20) * 20;
      const answer = (base * p) / 100;
      return {
        promptFa: `${p}٪ از ${base} چقدر است؟`,
        promptEn: `What is ${p}% of ${base}?`,
        ...makeChoices(rng, answer),
        explanationFa: `${p}٪ یعنی ${p}/100 × ${base} = ${answer}`,
        explanationEn: `${p}% means ${p}/100 × ${base} = ${answer}`,
      };
    },
  },
  {
    topicFa: 'ب.م.م',
    topicEn: 'GCD',
    build(rng, difficulty) {
      const g = int(rng, 2, difficulty === 3 ? 15 : 9);
      const x = int(rng, 2, 9);
      let y = int(rng, 2, 9);
      if (gcdOf(x, y) !== 1) y += 1;
      const a = g * x;
      const b = g * y;
      const answer = gcdOf(a, b);
      return {
        promptFa: `بزرگ‌ترین مقسوم‌علیه مشترک ${a} و ${b} کدام است؟`,
        promptEn: `What is gcd(${a}, ${b})?`,
        ...makeChoices(rng, answer),
        explanationFa: `${a} = ${answer}×${a / answer} و ${b} = ${answer}×${b / answer} و عامل مشترک بزرگ‌تری ندارند.`,
        explanationEn: `${a} = ${answer}×${a / answer} and ${b} = ${answer}×${b / answer}, with no larger common factor.`,
      };
    },
  },
  {
    topicFa: 'حرکت با شتاب ثابت',
    topicEn: 'Kinematics',
    build(rng, difficulty) {
      const u = int(rng, 0, difficulty === 1 ? 10 : 30);
      const a = int(rng, 1, 6);
      const t = int(rng, 2, 9);
      const answer = u + a * t;
      return {
        promptFa: `جسمی با سرعت اولیه ${u} متر بر ثانیه و شتاب ثابت ${a} متر بر ثانیه مربع پس از ${t} ثانیه به چه سرعتی می‌رسد؟`,
        promptEn: `Starting at ${u} m/s with constant acceleration ${a} m/s², what is the speed after ${t} s?`,
        ...makeChoices(rng, answer),
        explanationFa: `v = u + at = ${u} + ${a}×${t} = ${answer} m/s`,
        explanationEn: `v = u + at = ${u} + ${a}×${t} = ${answer} m/s`,
        unitFa: 'متر بر ثانیه',
        unitEn: 'm/s',
      };
    },
  },
  {
    topicFa: 'قانون اهم',
    topicEn: "Ohm's law",
    build(rng) {
      const current = int(rng, 2, 12);
      const resistance = int(rng, 2, 20);
      const voltage = current * resistance;
      return {
        promptFa: `در مقاومتی ${resistance} اهمی که ${voltage} ولت روی آن است، چه جریانی (آمپر) می‌گذرد؟`,
        promptEn: `A ${resistance} Ω resistor has ${voltage} V across it. What current (A) flows?`,
        ...makeChoices(rng, current),
        explanationFa: `I = V/R = ${voltage}/${resistance} = ${current} A`,
        explanationEn: `I = V/R = ${voltage}/${resistance} = ${current} A`,
        unitFa: 'آمپر',
        unitEn: 'A',
      };
    },
  },
  {
    topicFa: 'مجموع و حاصل‌ضرب ریشه‌ها',
    topicEn: 'Vieta jumping basics',
    build(rng, difficulty) {
      const r1 = int(rng, difficulty === 3 ? -6 : 1, 9) || 2;
      const r2 = int(rng, difficulty === 3 ? -6 : 1, 9) || 3;
      const askSum = rng() < 0.5;
      const b = -(r1 + r2);
      const c = r1 * r2;
      const answer = askSum ? r1 + r2 : r1 * r2;
      const poly = `x² ${b >= 0 ? `+ ${b}` : `− ${Math.abs(b)}`}x ${c >= 0 ? `+ ${c}` : `− ${Math.abs(c)}`} = 0`;
      return {
        promptFa: `در معادله ${poly} ${askSum ? 'مجموع ریشه‌ها' : 'حاصل‌ضرب ریشه‌ها'} چقدر است؟`,
        promptEn: `For ${poly}, what is the ${askSum ? 'sum' : 'product'} of the roots?`,
        ...makeChoices(rng, answer),
        explanationFa: askSum
          ? `مجموع ریشه‌ها = −b/a = ${answer} (ریشه‌ها: ${r1} و ${r2})`
          : `حاصل‌ضرب ریشه‌ها = c/a = ${answer} (ریشه‌ها: ${r1} و ${r2})`,
        explanationEn: askSum
          ? `Sum of roots = −b/a = ${answer} (roots: ${r1} and ${r2})`
          : `Product of roots = c/a = ${answer} (roots: ${r1} and ${r2})`,
      };
    },
  },
  {
    topicFa: 'میانگین',
    topicEn: 'Mean',
    build(rng, difficulty) {
      const mean = int(rng, 5, difficulty === 3 ? 60 : 25);
      const d1 = int(rng, 1, 9);
      const d2 = int(rng, 1, 9);
      const list = [mean - d1, mean + d1, mean - d2, mean + d2];
      return {
        promptFa: `میانگین عددهای ${list.join('، ')} چقدر است؟`,
        promptEn: `What is the mean of ${list.join(', ')}?`,
        ...makeChoices(rng, mean),
        explanationFa: `انحراف‌ها همدیگر را خنثی می‌کنند؛ میانگین = ${mean}`,
        explanationEn: `The deviations cancel out; the mean is ${mean}`,
      };
    },
  },
  {
    topicFa: 'توان و ریشه',
    topicEn: 'Powers & roots',
    build(rng, difficulty) {
      if (rng() < 0.5) {
        const root = int(rng, 3, difficulty === 3 ? 25 : 15);
        const square = root * root;
        return {
          promptFa: `جذر ${square} چقدر است؟`,
          promptEn: `What is √${square}?`,
          ...makeChoices(rng, root),
          explanationFa: `چون ${root}×${root} = ${square}`,
          explanationEn: `Because ${root}×${root} = ${square}`,
        };
      }
      const base = int(rng, 2, difficulty === 3 ? 6 : 4);
      const exp = int(rng, 2, base === 2 ? 8 : 4);
      const answer = base ** exp;
      return {
        promptFa: `حاصل ${base} به توان ${exp} چقدر است؟`,
        promptEn: `What is ${base}^${exp}?`,
        ...makeChoices(rng, answer),
        explanationFa: `${base} به توان ${exp} = ${answer}`,
        explanationEn: `${base}^${exp} = ${answer}`,
      };
    },
  },
  {
    topicFa: 'هندسه',
    topicEn: 'Geometry',
    build(rng, difficulty) {
      const w = int(rng, 3, difficulty === 3 ? 30 : 15);
      const h = int(rng, 3, difficulty === 3 ? 30 : 15);
      if (rng() < 0.5) {
        return {
          promptFa: `مساحت مستطیلی با طول ${w} و عرض ${h} چقدر است؟`,
          promptEn: `What is the area of a ${w} × ${h} rectangle?`,
          ...makeChoices(rng, w * h),
          explanationFa: `مساحت = طول × عرض = ${w}×${h} = ${w * h}`,
          explanationEn: `Area = length × width = ${w}×${h} = ${w * h}`,
        };
      }
      const base = w * 2;
      return {
        promptFa: `مساحت مثلثی با قاعده ${base} و ارتفاع ${h} چقدر است؟`,
        promptEn: `What is the area of a triangle with base ${base} and height ${h}?`,
        ...makeChoices(rng, (base * h) / 2),
        explanationFa: `مساحت = نصف قاعده × ارتفاع = ${base}×${h}/2 = ${(base * h) / 2}`,
        explanationEn: `Area = ½ × base × height = ${(base * h) / 2}`,
      };
    },
  },
  {
    topicFa: 'بهره ساده',
    topicEn: 'Simple interest',
    build(rng, difficulty) {
      const principal = int(rng, 1, difficulty === 3 ? 40 : 10) * 1000;
      const rate = pick(rng, [2, 4, 5, 8, 10]);
      const years = int(rng, 1, 5);
      const answer = (principal * rate * years) / 100;
      return {
        promptFa: `بهره ساده سرمایه ${principal.toLocaleString('en-US')} با نرخ سالانه ${rate}٪ در ${years} سال چقدر است؟`,
        promptEn: `What is the simple interest on ${principal.toLocaleString('en-US')} at ${rate}% per year for ${years} years?`,
        ...makeChoices(rng, answer),
        explanationFa: `I = P×r×t = ${principal.toLocaleString('en-US')}×${rate}٪×${years} = ${answer.toLocaleString('en-US')}`,
        explanationEn: `I = P×r×t = ${answer.toLocaleString('en-US')}`,
      };
    },
  },
  {
    topicFa: 'دنباله حسابی',
    topicEn: 'Arithmetic sequence',
    build(rng, difficulty) {
      const a1 = int(rng, 1, 12);
      const d = int(rng, 2, difficulty === 3 ? 12 : 7);
      const shown = [a1, a1 + d, a1 + 2 * d, a1 + 3 * d];
      const answer = a1 + 4 * d;
      return {
        promptFa: `جمله بعدی دنباله …، ${shown.join('، ')} چیست؟`,
        promptEn: `What is the next term of ${shown.join(', ')}, …?`,
        ...makeChoices(rng, answer),
        explanationFa: `هر جمله ${d} واحد بیشتر از قبلی است؛ ${shown[3]} + ${d} = ${answer}`,
        explanationEn: `Each term grows by ${d}; ${shown[3]} + ${d} = ${answer}`,
      };
    },
  },
  {
    topicFa: 'احتمال',
    topicEn: 'Probability',
    build(rng) {
      const variants = [
        {
          answer: 50,
          promptFa: 'در پرتاب یک سکه سالم، احتمال آمدن «شیر» چند درصد است؟',
          promptEn: 'A fair coin is tossed. What is the probability (in %) of heads?',
          explanationFa: 'از دو حالت هم‌شانس، یکی مطلوب است: ۱/۲ = ۵۰٪',
          explanationEn: 'One of two equally likely outcomes: 1/2 = 50%',
        },
        {
          answer: 25,
          promptFa: 'در پرتاب دو سکه سالم، احتمال اینکه هر دو «شیر» بیایند چند درصد است؟',
          promptEn: 'Two fair coins are tossed. What is the probability (in %) of two heads?',
          explanationFa: 'از چهار حالت هم‌شانس فقط یکی دو شیر است: ۱/۴ = ۲۵٪',
          explanationEn: 'One of four equally likely outcomes: 1/4 = 25%',
        },
        {
          answer: 50,
          promptFa: 'در پرتاب یک تاس سالم، احتمال آمدن عدد زوج چند درصد است؟',
          promptEn: 'A fair die is rolled. What is the probability (in %) of an even number?',
          explanationFa: 'سه حالت از شش حالت زوج‌اند: ۳/۶ = ۵۰٪',
          explanationEn: 'Three of six outcomes are even: 3/6 = 50%',
        },
      ];
      const variant = pick(rng, variants);
      return {
        promptFa: variant.promptFa,
        promptEn: variant.promptEn,
        ...makeChoices(rng, variant.answer),
        explanationFa: variant.explanationFa,
        explanationEn: variant.explanationEn,
        unitFa: 'درصد',
        unitEn: '%',
      };
    },
  },
  {
    topicFa: 'شیب خط',
    topicEn: 'Slope',
    build(rng, difficulty) {
      const slope = int(rng, difficulty === 3 ? -5 : 1, 6) || 2;
      const x1 = int(rng, 0, 5);
      const run = int(rng, 1, 4);
      const y1 = int(rng, 0, 10);
      const x2 = x1 + run;
      const y2 = y1 + slope * run;
      return {
        promptFa: `شیب خط گذرنده از (${x1}، ${y1}) و (${x2}، ${y2}) چقدر است؟`,
        promptEn: `What is the slope of the line through (${x1}, ${y1}) and (${x2}, ${y2})?`,
        ...makeChoices(rng, slope),
        explanationFa: `شیب = (${y2}−${y1})/(${x2}−${x1}) = ${slope}`,
        explanationEn: `Slope = (${y2}−${y1})/(${x2}−${x1}) = ${slope}`,
      };
    },
  },
];

export function generateQuestion(rng: Rng, difficulty: QuizDifficulty, index = 0): QuizQuestion {
  const template = pick(rng, TEMPLATES);
  return {
    id: `q-${index}-${template.topicEn}`,
    topicFa: template.topicFa,
    topicEn: template.topicEn,
    difficulty,
    ...template.build(rng, difficulty),
  };
}

export function generateQuiz(count: number, seedText: string, difficulty: QuizDifficulty = 2): QuizQuestion[] {
  const rng = mulberry32(hashSeed(seedText));
  return Array.from({ length: count }, (_, index) => generateQuestion(rng, difficulty, index));
}

/** Five questions, identical for everyone on a given local calendar day. */
export function dailyChallenge(dayKey: string): QuizQuestion[] {
  const rng = mulberry32(hashSeed(`daily:${dayKey}`));
  const levels: QuizDifficulty[] = [1, 1, 2, 2, 3];
  return levels.map((difficulty, index) => generateQuestion(rng, difficulty, index));
}

export const xpReward = (difficulty: QuizDifficulty, streak = 0): number =>
  difficulty * 10 + Math.min(20, streak * 2);

export function levelFromXp(xp: number): { level: number; intoLevel: number; levelSpan: number } {
  const level = Math.floor(Math.sqrt(Math.max(0, xp) / 50)) + 1;
  const levelStart = 50 * (level - 1) ** 2;
  const nextStart = 50 * level ** 2;
  return { level, intoLevel: xp - levelStart, levelSpan: nextStart - levelStart };
}

/** Local calendar-day key like `2026-10-25` (device timezone, stable per day). */
export function localDayKey(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
