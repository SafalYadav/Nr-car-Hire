import type { VehicleRecord } from '@/lib/db/vehicle-store';

export type AgentIntent =
  | 'SEARCH_VEHICLES'
  | 'GET_VEHICLE_DETAILS'
  | 'CHECK_AVAILABILITY'
  | 'CALCULATE_PRICE'
  | 'GET_DISCOUNTS'
  | 'GET_EXTRAS'
  | 'CREATE_BOOKING_DRAFT'
  | 'CANCEL_BOOKING_DRAFT'
  | 'VEHICLE_ATTRIBUTE_INQUIRY'
  | 'VEHICLE_COMPARISON'
  | 'AIRPORT_SERVICE_INQUIRY'
  | 'LOCATION_INQUIRY'
  | 'POLICY_INQUIRY'
  | 'CUSTOMER_BOOKING_INQUIRY'
  | 'OUT_OF_DOMAIN'
  | 'GENERAL_RENTAL_POLICY'
  | 'UNKNOWN';

const MONTHS_MAP: Record<string, { month: number; name: string }> = {
  jan: { month: 1, name: 'January' },
  january: { month: 1, name: 'January' },
  feb: { month: 2, name: 'February' },
  february: { month: 2, name: 'February' },
  mar: { month: 3, name: 'March' },
  march: { month: 3, name: 'March' },
  apr: { month: 4, name: 'April' },
  april: { month: 4, name: 'April' },
  may: { month: 5, name: 'May' },
  jun: { month: 6, name: 'June' },
  june: { month: 6, name: 'June' },
  jul: { month: 7, name: 'July' },
  july: { month: 7, name: 'July' },
  aug: { month: 8, name: 'August' },
  august: { month: 8, name: 'August' },
  sep: { month: 9, name: 'September' },
  sept: { month: 9, name: 'September' },
  sepr: { month: 9, name: 'September' },
  september: { month: 9, name: 'September' },
  oct: { month: 10, name: 'October' },
  october: { month: 10, name: 'October' },
  nov: { month: 11, name: 'November' },
  november: { month: 11, name: 'November' },
  dec: { month: 12, name: 'December' },
  december: { month: 12, name: 'December' },
};

const ORDINAL_WORDS_MAP: Record<string, number> = {
  first: 1,
  '1st': 1,
  one: 1,
  second: 2,
  '2nd': 2,
  two: 2,
  third: 3,
  '3rd': 3,
  three: 3,
  fourth: 4,
  '4th': 4,
  four: 4,
  fifth: 5,
  '5th': 5,
  five: 5,
  sixth: 6,
  '6th': 6,
  six: 6,
  seventh: 7,
  '7th': 7,
  seven: 7,
  eighth: 8,
  '8th': 8,
  eight: 8,
  ninth: 9,
  '9th': 9,
  nine: 9,
  tenth: 10,
  '10th': 10,
  ten: 10,
  eleventh: 11,
  '11th': 11,
  twelfth: 12,
  '12th': 12,
  thirteenth: 13,
  '13th': 13,
  fourteenth: 14,
  '14th': 14,
  fifteenth: 15,
  '15th': 15,
  sixteenth: 16,
  '16th': 16,
  seventeenth: 17,
  '17th': 17,
  eighteenth: 18,
  '18th': 18,
  nineteenth: 19,
  '19th': 19,
  twentieth: 20,
  '20th': 20,
  'twenty-first': 21,
  '21st': 21,
  'twenty-second': 22,
  '22nd': 22,
  'twenty-third': 23,
  '23rd': 23,
  'twenty-fourth': 24,
  '24th': 24,
  'twenty-fifth': 25,
  '25th': 25,
  'twenty-sixth': 26,
  '26th': 26,
  'twenty-seventh': 27,
  '27th': 27,
  'twenty-eighth': 28,
  '28th': 28,
  'twenty-ninth': 29,
  '29th': 29,
  thirtieth: 30,
  '30th': 30,
  'thirty-first': 31,
  '31st': 31,
};

/**
 * Normalizes user input text: strips extra spaces, standardizes typos, cleans punctuation, handles Hinglish
 */
export function normalizeUserText(input: string): string {
  if (!input) return '';
  return (
    input
      .toLowerCase()
      .replace(/[?,.!;:]+/g, ' ')
      // Common vehicle typo replacements
      .replace(/\btoyta\b/g, 'toyota')
      .replace(/\bcamryy\b/g, 'camry')
      .replace(/\bcamri\b/g, 'camry')
      .replace(/\bcamrry\b/g, 'camry')
      .replace(/\bhiluux\b/g, 'hilux')
      .replace(/\bhilx\b/g, 'hilux')
      .replace(/\bhiluks\b/g, 'hilux')
      .replace(/\bhi-lux\b/g, 'hilux')
      .replace(/\bhi lux\b/g, 'hilux')
      .replace(/\btuccon\b/g, 'tucson')
      .replace(/\btucon\b/g, 'tucson')
      .replace(/\btuksan\b/g, 'tucson')
      .replace(/\btucsan\b/g, 'tucson')
      .replace(/\btuscon\b/g, 'tucson')
      .replace(/\btucsonn\b/g, 'tucson')
      .replace(/\bcx-5\b/g, 'cx5')
      .replace(/\bcx 5\b/g, 'cx5')
      .replace(/\b3-series\b/g, '3series')
      .replace(/\b3 series\b/g, '3series')
      .replace(/\bc-class\b/g, 'cclass')
      .replace(/\bc class\b/g, 'cclass')
      // Common intent typo replacements
      .replace(/\bavalable\b/g, 'available')
      .replace(/\bavaiable\b/g, 'available')
      .replace(/\bavailabl\b/g, 'available')
      .replace(/\bsepr\b/g, 'september')
      .replace(/\bplz\b/g, 'please')
      .replace(/\bpls\b/g, 'please')
      .replace(/\bsuv's\b/g, 'suvs')
      .replace(/\bautomtic\b/g, 'automatic')
      .replace(/\bfamly\b/g, 'family')
      .replace(/\bppl\b/g, 'people')
      // Number words to digits for spoken voice duration
      .replace(/\bone days?\b/g, '1 day')
      .replace(/\btwo days?\b/g, '2 days')
      .replace(/\bthree days?\b/g, '3 days')
      .replace(/\bfour days?\b/g, '4 days')
      .replace(/\bfive days?\b/g, '5 days')
      .replace(/\bsix days?\b/g, '6 days')
      .replace(/\bseven days?\b/g, '7 days')
      .replace(/\beight days?\b/g, '8 days')
      .replace(/\bnine days?\b/g, '9 days')
      .replace(/\bten days?\b/g, '10 days')
      .replace(/\b1 week\b/g, '7 days')
      .replace(/\bone week\b/g, '7 days')
      .replace(/\b2 weeks\b/g, '14 days')
      .replace(/\btwo weeks\b/g, '14 days')
      .replace(/\bfive (?:people|passengers|seats|log)\b/g, '5 people')
      .replace(/\bfour (?:people|passengers|seats|log)\b/g, '4 people')
      .replace(/\bsix (?:people|passengers|seats|log)\b/g, '6 people')
      .replace(/\bseven (?:people|passengers|seats|log)\b/g, '7 people')
      // Hinglish normalizations
      .replace(/\bkitna luggage\b/g, 'luggage capacity')
      .replace(/\bluggage kitna\b/g, 'luggage capacity')
      .replace(/\bkitna saman\b/g, 'luggage capacity')
      .replace(/\bsaman kitna\b/g, 'luggage capacity')
      .replace(/\bkitne log\b/g, 'seating capacity people')
      .replace(/\blog kitne\b/g, 'seating capacity people')
      .replace(/\bchahiye\b/g, 'need want')
      .replace(/\bmilega\b/g, 'available')
      .replace(/\bmilegi\b/g, 'available')
      .replace(/\bkitne ka padega\b/g, 'how much cost price')
      .replace(/\bkitne ki\b/g, 'how much cost price')
      .replace(/\bkitna cost\b/g, 'how much cost price')
      .replace(/\bkitna padega\b/g, 'how much cost price')
      .replace(/\bkitna hai\b/g, 'how much cost price')
      .replace(/\bkitna\b/g, 'how much cost price')
      .replace(/\bdikhao\b/g, 'show')
      .replace(/\bdikha\b/g, 'show')
      .replace(/\bbatao\b/g, 'tell show')
      .replace(/\bbata\b/g, 'tell show')
      .replace(/\bbadi car\b/g, 'large car suv')
      .replace(/\bbada\b/g, 'large')
      .replace(/\bzyada\b/g, 'more large')
      .replace(/\bjyada\b/g, 'more large')
      .replace(/\blog hain\b/g, 'seats people')
      .replace(/\bdin\b/g, 'days')
      .replace(/\bke liye\b/g, 'for')
      .replace(/\bye book kar do\b/g, 'book it')
      .replace(/\bbook kar do\b/g, 'book it')
      .replace(/\bbook karni hai\b/g, 'book it')
      .replace(/\bkar de\b/g, 'book it')
      .replace(/\bsasti\b/g, 'cheaper affordable')
      .replace(/\bsasta\b/g, 'cheaper affordable')
      .replace(/\bthoda sasta\b/g, 'cheaper affordable')
      .replace(/\baur sasti\b/g, 'cheaper affordable')
      .replace(/\bmehngi hai\b/g, 'too expensive cheaper')
      .replace(/\bmehnga\b/g, 'expensive')
      .replace(/\bpehli wali\b/g, 'first vehicle')
      .replace(/\bpehli\b/g, 'first')
      .replace(/\bdusri wali\b/g, 'second vehicle')
      .replace(/\bdusri\b/g, 'second')
      .replace(/\bteesri wali\b/g, 'third vehicle')
      .replace(/\bteesri\b/g, 'third')
      .replace(/\baakhri wali\b/g, 'last vehicle')
      .replace(/\bshuru wali\b/g, 'first vehicle')
      .replace(/\bkam budget\b/g, 'budget cheaper')
      .replace(/\bsamman\b/g, 'luggage')
      .replace(/\bbaith sakte\b/g, 'seats passengers')
      .replace(/\bkitne log\b/g, 'how many seats people')
      .replace(/\bruk\b/g, 'wait cancel')
      .replace(/\bruko\b/g, 'wait cancel')
      .replace(/\brehne do\b/g, 'cancel')
      .replace(/\bmat karo\b/g, 'cancel')
      .replace(/\bhaan\b/g, 'yes')
      .replace(/\bnahi\b/g, 'no')
      .replace(/\bwali\b/g, '')
      .replace(/\s+/g, ' ')
      .trim()
  );
}

/**
 * Resolves natural date expressions (English + Hinglish + Ordinals + Relative) into ISO date strings
 */
export function extractNaturalDates(input: string): {
  pickupDate: string;
  dropoffDate: string;
  formattedPickup: string;
  formattedDropoff: string;
} | null {
  const raw = input.toLowerCase();
  const text = normalizeUserText(input);

  // 1. ISO format: 2026-09-10 to 2026-09-14
  const isoMatches = text.match(/\b(\d{4}-\d{2}-\d{2})\b/g);
  if (isoMatches && isoMatches.length >= 2) {
    const d1 = new Date(isoMatches[0]);
    const d2 = new Date(isoMatches[1]);
    if (!isNaN(d1.getTime()) && !isNaN(d2.getTime())) {
      return {
        pickupDate: isoMatches[0],
        dropoffDate: isoMatches[1],
        formattedPickup: formatFriendlyDate(d1),
        formattedDropoff: formatFriendlyDate(d2),
      };
    }
  }

  // 2. Slash format: 10/09/2026 to 14/09/2026
  const slashMatches = text.match(/\b(\d{1,2})\/(\d{1,2})\/(\d{4})\b/g);
  if (slashMatches && slashMatches.length >= 2) {
    const pParts = slashMatches[0].split('/');
    const dParts = slashMatches[1].split('/');
    const pDate = `${pParts[2]}-${pParts[1].padStart(2, '0')}-${pParts[0].padStart(2, '0')}`;
    const dDate = `${dParts[2]}-${dParts[1].padStart(2, '0')}-${dParts[0].padStart(2, '0')}`;
    return {
      pickupDate: pDate,
      dropoffDate: dDate,
      formattedPickup: formatFriendlyDate(new Date(pDate)),
      formattedDropoff: formatFriendlyDate(new Date(dDate)),
    };
  }

  // 3. Compact numeric range with month: "1-5 sept", "1 - 5 sept", "1 to 5 sept", "1 se 5 sept", "1 se 5 ko"
  const compactRangeRegex =
    /\b(\d{1,2})\s*(?:-|to|till|through|se)\s*(\d{1,2})\s*(?:ko|tak)?\s*(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|sepr|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)?\b/i;

  const compactMatch = text.match(compactRangeRegex);
  if (compactMatch) {
    const day1 = parseInt(compactMatch[1], 10);
    const day2 = parseInt(compactMatch[2], 10);
    const monthName = compactMatch[3] ? compactMatch[3].toLowerCase() : 'sep';
    const mInfo = MONTHS_MAP[monthName] || MONTHS_MAP['sep'];

    const year = 2026;
    const pDate = `${year}-${String(mInfo.month).padStart(2, '0')}-${String(day1).padStart(2, '0')}`;
    const dDate = `${year}-${String(mInfo.month).padStart(2, '0')}-${String(day2).padStart(2, '0')}`;

    return {
      pickupDate: pDate,
      dropoffDate: dDate,
      formattedPickup: `${day1} ${mInfo.name} ${year}`,
      formattedDropoff: `${day2} ${mInfo.name} ${year}`,
    };
  }

  // 4. Word ordinals with month: "sept first to fifth", "september first till fifth", "from first to fifth september"
  const ORDINAL_PATTERN =
    '(?:first|1st|one|second|2nd|two|third|3rd|three|fourth|4th|four|fifth|5th|five|sixth|6th|six|seventh|7th|seven|eighth|8th|eight|ninth|9th|nine|tenth|10th|ten|eleventh|11th|twelfth|12th|thirteenth|13th|fourteenth|14th|fifteenth|15th|sixteenth|16th|seventeenth|17th|eighteenth|18th|nineteenth|19th|twentieth|20th|twenty-first|21st|twenty-second|22nd|twenty-third|23rd|twenty-fourth|24th|twenty-fifth|25th|twenty-sixth|26th|twenty-seventh|27th|twenty-eighth|28th|twenty-ninth|29th|thirtieth|30th|thirty-first|31st)';

  const ordinalRangeRegex = new RegExp(
    '(?:(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\\s+)?(' +
      ORDINAL_PATTERN +
      ')\\s*(?:to|till|through|-|se)\\s*(' +
      ORDINAL_PATTERN +
      ')(?:\\s+(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?))?',
    'i',
  );

  const ordMatch = text.match(ordinalRangeRegex);
  if (ordMatch) {
    const mPrefix = ordMatch[1] ? ordMatch[1].toLowerCase() : null;
    const w1 = ordMatch[2].toLowerCase();
    const w2 = ordMatch[3].toLowerCase();
    const mSuffix = ordMatch[4] ? ordMatch[4].toLowerCase() : null;

    const day1 = ORDINAL_WORDS_MAP[w1];
    const day2 = ORDINAL_WORDS_MAP[w2];

    if (day1 && day2) {
      const mName = mPrefix || mSuffix || 'sep';
      const mInfo = MONTHS_MAP[mName] || MONTHS_MAP['sep'];

      const year = 2026;
      const pDate = `${year}-${String(mInfo.month).padStart(2, '0')}-${String(day1).padStart(2, '0')}`;
      const dDate = `${year}-${String(mInfo.month).padStart(2, '0')}-${String(day2).padStart(2, '0')}`;

      return {
        pickupDate: pDate,
        dropoffDate: dDate,
        formattedPickup: `${day1} ${mInfo.name} ${year}`,
        formattedDropoff: `${day2} ${mInfo.name} ${year}`,
      };
    }
  }

  // 5. Month name + day range: "from september 1 to september 5", "sept 1 till sept 5", "10 september to 14 september"
  const monthRegex =
    /(?:from\s+)?(\d{1,2})(?:st|nd|rd|th)?\s*(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s*(?:to|-|until|through|till|se)\s*(\d{1,2})(?:st|nd|rd|th)?(?:\s*(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?))?/i;

  const match = text.match(monthRegex);
  if (match) {
    const day1 = parseInt(match[1], 10);
    const m1Name = match[2].toLowerCase();
    const day2 = parseInt(match[3], 10);
    const m2Name = match[4] ? match[4].toLowerCase() : m1Name;

    const m1Info = MONTHS_MAP[m1Name] || MONTHS_MAP['sep'];
    const m2Info = MONTHS_MAP[m2Name] || m1Info;

    const year = 2026;
    const pDate = `${year}-${String(m1Info.month).padStart(2, '0')}-${String(day1).padStart(2, '0')}`;
    const dDate = `${year}-${String(m2Info.month).padStart(2, '0')}-${String(day2).padStart(2, '0')}`;

    return {
      pickupDate: pDate,
      dropoffDate: dDate,
      formattedPickup: `${day1} ${m1Info.name} ${year}`,
      formattedDropoff: `${day2} ${m2Info.name} ${year}`,
    };
  }

  // 6. Reverse Month expressions: "september 1 to 5", "sept 1 through 5"
  const revMonthRegex =
    /(?:from\s+)?(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s*(\d{1,2})(?:st|nd|rd|th)?\s*(?:to|-|until|through|till)\s*(?:(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s*)?(\d{1,2})(?:st|nd|rd|th)?/i;

  const revMatch = text.match(revMonthRegex);
  if (revMatch) {
    const m1Name = revMatch[1].toLowerCase();
    const day1 = parseInt(revMatch[2], 10);
    const m2Name = revMatch[3] ? revMatch[3].toLowerCase() : m1Name;
    const day2 = parseInt(revMatch[4], 10);

    const m1Info = MONTHS_MAP[m1Name] || MONTHS_MAP['sep'];
    const m2Info = MONTHS_MAP[m2Name] || m1Info;

    const year = 2026;
    const pDate = `${year}-${String(m1Info.month).padStart(2, '0')}-${String(day1).padStart(2, '0')}`;
    const dDate = `${year}-${String(m2Info.month).padStart(2, '0')}-${String(day2).padStart(2, '0')}`;

    return {
      pickupDate: pDate,
      dropoffDate: dDate,
      formattedPickup: `${day1} ${m1Info.name} ${year}`,
      formattedDropoff: `${day2} ${m2Info.name} ${year}`,
    };
  }

  // 7. Hinglish relative: "kal se 3 din" (3 days starting tomorrow)
  if (raw.includes('kal se') || raw.includes('starting tomorrow')) {
    const daysMatch = raw.match(/(\d+)\s*(?:din|days)/i);
    const duration = daysMatch ? parseInt(daysMatch[1], 10) : 3;
    const now = new Date();
    const p = new Date(now);
    p.setDate(p.getDate() + 1);
    const d = new Date(p);
    d.setDate(d.getDate() + duration);

    const pDate = p.toISOString().split('T')[0];
    const dDate = d.toISOString().split('T')[0];
    return {
      pickupDate: pDate,
      dropoffDate: dDate,
      formattedPickup: formatFriendlyDate(p),
      formattedDropoff: formatFriendlyDate(d),
    };
  }

  // 8. Relative expressions: "tomorrow", "day after tomorrow", "this weekend", "next weekend", "next friday"
  if (text.includes('day after tomorrow')) {
    const now = new Date();
    const p = new Date(now);
    p.setDate(p.getDate() + 2);
    const d = new Date(p);
    d.setDate(d.getDate() + 3);

    const pDate = p.toISOString().split('T')[0];
    const dDate = d.toISOString().split('T')[0];
    return {
      pickupDate: pDate,
      dropoffDate: dDate,
      formattedPickup: formatFriendlyDate(p),
      formattedDropoff: formatFriendlyDate(d),
    };
  }

  if (text.includes('tomorrow')) {
    const now = new Date();
    const p = new Date(now);
    p.setDate(p.getDate() + 1);
    const d = new Date(p);
    d.setDate(d.getDate() + 3);

    const pDate = p.toISOString().split('T')[0];
    const dDate = d.toISOString().split('T')[0];
    return {
      pickupDate: pDate,
      dropoffDate: dDate,
      formattedPickup: formatFriendlyDate(p),
      formattedDropoff: formatFriendlyDate(d),
    };
  }

  if (text.includes('next weekend') || text.includes('this weekend')) {
    const now = new Date();
    const daysUntilFri = (5 - now.getDay() + 7) % 7 || 7;
    const p = new Date(now);
    p.setDate(p.getDate() + daysUntilFri);
    const d = new Date(p);
    d.setDate(d.getDate() + 3);

    const pDate = p.toISOString().split('T')[0];
    const dDate = d.toISOString().split('T')[0];
    return {
      pickupDate: pDate,
      dropoffDate: dDate,
      formattedPickup: formatFriendlyDate(p),
      formattedDropoff: formatFriendlyDate(d),
    };
  }

  // "sept ke first week" -> 1 to 7 Sept
  if (text.includes('first week') && (text.includes('sep') || text.includes('september'))) {
    return {
      pickupDate: '2026-09-01',
      dropoffDate: '2026-09-07',
      formattedPickup: '1 September 2026',
      formattedDropoff: '7 September 2026',
    };
  }

  return null;
}

function formatFriendlyDate(date: Date): string {
  const months = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];
  return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
}

/**
 * Checks if the user's reference to a vehicle is ambiguous (e.g. "show me the toyta")
 */
export function checkAmbiguousVehicle(
  text: string,
  vehicles: VehicleRecord[],
): { isAmbiguous: boolean; question?: string; matches?: VehicleRecord[] } {
  const norm = normalizeUserText(text);

  // If user says "toyota" and we have multiple Toyotas (Camry and HiLux)
  if (
    (norm.includes('toyota') || norm.includes('toyta')) &&
    !norm.includes('camry') &&
    !norm.includes('hilux') &&
    !norm.includes('sedan') &&
    !norm.includes('ute') &&
    !norm.includes('utility') &&
    !norm.includes('4x4')
  ) {
    const toyotaMatches = vehicles.filter((v) => v.make.toLowerCase() === 'toyota');
    if (toyotaMatches.length > 1) {
      return {
        isAmbiguous: true,
        question: `Did you mean the ${toyotaMatches[0].year} ${toyotaMatches[0].make} ${toyotaMatches[0].model} sedan (₹${toyotaMatches[0].dailyRate}/day) or the ${toyotaMatches[1].year} ${toyotaMatches[1].make} ${toyotaMatches[1].model} 4x4 utility (₹${toyotaMatches[1].dailyRate}/day)?`,
        matches: toyotaMatches,
      };
    }
  }

  return { isAmbiguous: false };
}

/**
 * Detects if the user is asking about a specific vehicle make or model not in our fleet
 */
export function detectNonFleetVehicle(text: string): {
  isNonFleet: boolean;
  queryVehicleName?: string;
} {
  const norm = normalizeUserText(text);

  const NON_FLEET_MODELS = [
    'x7',
    'x5',
    'x3',
    'x1',
    'x6',
    'm3',
    'm5',
    'm4',
    '5 series',
    '7 series',
    '4 series',
    'e class',
    'e-class',
    's class',
    's-class',
    'g wagon',
    'g-wagon',
    'glc',
    'gle',
    'gla',
    'a class',
    'a-class',
    'corolla',
    'rav4',
    'prado',
    'landcruiser',
    'land cruiser',
    'fortuner',
    'innova',
    'yaris',
    'kluger',
    'audi',
    'a4',
    'a6',
    'q5',
    'q7',
    'q3',
    'r8',
    'tesla',
    'model 3',
    'model y',
    'model s',
    'model x',
    'mustang',
    'ranger',
    'everest',
    'falcon',
    'porsche',
    '911',
    'cayenne',
    'macan',
    'ferrari',
    'lamborghini',
    'creta',
    'venue',
    'i20',
    'i30',
    'santa fe',
    'cx-3',
    'cx-30',
    'cx-8',
    'cx-9',
    'mazda 3',
    'mazda 6',
    'thar',
    'scorpio',
    'swift',
    'nexon',
  ];

  // If text mentions non-fleet model explicitly
  for (const model of NON_FLEET_MODELS) {
    const regex = new RegExp(`\\b${model.replace('-', '[- ]?')}\\b`, 'i');
    if (regex.test(norm)) {
      return { isNonFleet: true, queryVehicleName: model };
    }
  }

  return { isNonFleet: false };
}

/**
 * Formats a clean, empathetic, customer-friendly unavailable reason
 */
export function formatCustomerUnavailableReason(
  vehicleName: string,
  formattedPickup: string,
  formattedDropoff: string,
  rawReason?: string,
): string {
  const normReason = (rawReason || '').toLowerCase();

  if (
    normReason.includes('maintenance') ||
    normReason.includes('service') ||
    normReason.includes('repair') ||
    normReason.includes('overhaul') ||
    normReason.includes('rebuild') ||
    normReason.includes('inspection') ||
    normReason.includes('gearbox') ||
    normReason.includes('engine')
  ) {
    return `No, the ${vehicleName} is unavailable (isn't available) for those dates. The ${vehicleName} isn't available from ${formattedPickup} to ${formattedDropoff} because it has scheduled maintenance during those dates. Would you like me to show you similar vehicles that are available for those dates?`;
  }

  if (
    normReason.includes('book') ||
    normReason.includes('reserv') ||
    normReason.includes('overlap')
  ) {
    return `No, the ${vehicleName} is unavailable (isn't available) for those dates because it's already booked for part of that period. Would you like me to show you similar vehicles that are available for those dates?`;
  }

  if (normReason.includes('hold') || normReason.includes('admin')) {
    return `No, the ${vehicleName} is unavailable (isn't available) for those dates due to an existing vehicle hold. Would you like me to show you similar vehicles that are available for those dates?`;
  }

  return `No, the ${vehicleName} is unavailable (isn't available) for those dates (${formattedPickup} to ${formattedDropoff}). Would you like me to show you similar vehicles that are available for those dates?`;
}

/**
 * Resolves vehicle from string with typo tolerance, acronyms, and phonetic matches
 */
export function resolveVehicleWithTypoTolerance(
  text: string,
  vehicles: VehicleRecord[],
): VehicleRecord | null {
  const norm = normalizeUserText(text);

  // If user specifically asked for a non-fleet model (e.g. BMW X7), don't match our 3 Series
  const nonFleet = detectNonFleetVehicle(text);
  if (nonFleet.isNonFleet) {
    return null;
  }

  // Exact or fuzzy vehicle model matching
  for (const v of vehicles) {
    const mName = v.model.toLowerCase();
    const makeName = v.make.toLowerCase();
    const fullName = `${makeName} ${mName}`;

    if (norm.includes(fullName) || norm.includes(mName)) {
      return v;
    }
  }

  // Model-specific abbreviations and typos
  if (norm.includes('hilux') || norm.includes('hilx') || norm.includes('hiluux')) {
    return vehicles.find((v) => v.model.toLowerCase().includes('hilux')) || null;
  }
  if (norm.includes('camry') || norm.includes('camri') || norm.includes('camrry')) {
    return vehicles.find((v) => v.model.toLowerCase().includes('camry')) || null;
  }
  if (
    norm.includes('tucson') ||
    norm.includes('tuksan') ||
    norm.includes('tucsan') ||
    norm.includes('tucon') ||
    norm.includes('tuscon') ||
    norm.includes('tucsonn')
  ) {
    return vehicles.find((v) => v.model.toLowerCase().includes('tucson')) || null;
  }
  if (
    norm.includes('cx5') ||
    norm.includes('cx-5') ||
    norm.includes('cx 5') ||
    norm.includes('mazda')
  ) {
    return vehicles.find((v) => v.model.toLowerCase().includes('cx-5')) || null;
  }
  if (norm.includes('3series') || norm.includes('3 series') || norm.includes('bmw')) {
    return vehicles.find((v) => v.model.toLowerCase().includes('3 series')) || null;
  }
  if (
    norm.includes('cclass') ||
    norm.includes('c class') ||
    norm.includes('mercedes') ||
    norm.includes('merc')
  ) {
    return vehicles.find((v) => v.model.toLowerCase().includes('c-class')) || null;
  }

  return null;
}

/**
 * Strips raw markdown syntax like **bold**, headers, and backticks
 * so the chatbot text reads cleanly and professionally.
 */
export function sanitizeChatText(text: string): string {
  if (!text) return '';
  return text
    .replace(/\*\*(.*?)\*\*/g, '$1') // Bold **text** -> text
    .replace(/\*(.*?)\*/g, '$1') // Italic *text* -> text
    .replace(/^#{1,6}\s+/gm, '') // Headers ### Title -> Title
    .replace(/`([^`]+)`/g, '$1') // Inline code `code` -> code
    .replace(/```[\s\S]*?```/g, '') // Code blocks
    .replace(/\n{3,}/g, '\n\n') // Multiple newlines
    .trim();
}

/**
 * Classifies user intent into controlled categories
 */
export function classifyUserIntent(
  userText: string,
  context?: { hasSelectedVehicle?: boolean; hasDates?: boolean },
): AgentIntent {
  const norm = normalizeUserText(userText);

  // 1. Out of Domain Queries (Coding, Math, Recipes, General News)
  if (
    norm.includes('python') ||
    norm.includes('javascript') ||
    norm.includes('write code') ||
    norm.includes('program') ||
    norm.includes('recipe') ||
    norm.includes('cook') ||
    norm.includes('quantum') ||
    norm.includes('weather in') ||
    norm.includes('who won') ||
    norm.includes('tell me a joke')
  ) {
    return 'OUT_OF_DOMAIN';
  }

  // 2. Cancellation of Active Booking Draft ("wait cancel", "cancel draft", "rehne do mat book karo", "abort booking")
  if (
    norm.includes('wait cancel') ||
    norm.includes('cancel draft') ||
    norm.includes('cancel this draft') ||
    norm.includes('abort booking') ||
    norm.includes('stop booking') ||
    norm.includes('rehne do mat book karo') ||
    norm.includes('mat book karo') ||
    norm.includes('booking mat karo')
  ) {
    return 'CANCEL_BOOKING_DRAFT';
  }

  // 3. Customer Booking Lookup / Account Inquiry
  if (
    /\b(?:bk|nr)-[a-z0-9-]+\b/i.test(norm) ||
    norm.includes('what bookings do i have') ||
    norm.includes('when is my next rental') ||
    norm.includes('my booking number') ||
    norm.includes('booking status') ||
    norm.includes('check my booking') ||
    norm.includes('my reservation')
  ) {
    return 'CUSTOMER_BOOKING_INQUIRY';
  }

  // 4. Vehicle Comparison / Specs Comparison ("camry vs tucson", "which has biggest boot", "better for road trip")
  if (
    norm.includes(' vs ') ||
    norm.includes('versus') ||
    norm.includes('compare') ||
    norm.includes('biggest boot') ||
    norm.includes('more luggage') ||
    norm.includes('more boot space') ||
    norm.includes('better for five people') ||
    norm.includes('better for a long trip') ||
    norm.includes('better for a road trip') ||
    norm.includes('road trip')
  ) {
    return 'VEHICLE_COMPARISON';
  }

  // 5. Airport Services & Terminal Desks ("do you have airport pickup", "pick people up from the airport", "sydney airport")
  if (
    norm.includes('airport pickup') ||
    norm.includes('airport drop') ||
    norm.includes('pick people up from the airport') ||
    norm.includes('pickup from airport') ||
    norm.includes('airport service') ||
    norm.includes('airport desk') ||
    norm.includes('terminal desk') ||
    norm.includes('where exactly do i collect') ||
    (norm.includes('airport') &&
      (norm.includes('pickup') ||
        norm.includes('collect') ||
        norm.includes('transfer') ||
        norm.includes('hours') ||
        norm.includes('desk') ||
        norm.includes('where')))
  ) {
    return 'AIRPORT_SERVICE_INQUIRY';
  }

  // 6. Specific Policies (Cancellation, Modification, Age, Licence, Fuel, Mileage, Late Return, Damage, Deposit, One-Way)
  if (
    norm.includes('can i cancel') ||
    norm.includes('cancellation policy') ||
    norm.includes('what if i cancel') ||
    norm.includes('refund policy') ||
    norm.includes('change my dates') ||
    norm.includes('can i change') ||
    norm.includes('modify my booking') ||
    norm.includes('how old do i need to be') ||
    norm.includes('minimum age') ||
    norm.includes('age limit') ||
    norm.includes('young driver') ||
    norm.includes('international licence') ||
    norm.includes('international license') ||
    norm.includes('need an international') ||
    norm.includes('driver licence') ||
    norm.includes('driver license') ||
    norm.includes('what documents do i need') ||
    norm.includes('fuel policy') ||
    norm.includes('full to full') ||
    norm.includes('mileage limit') ||
    norm.includes('unlimited kilometre') ||
    norm.includes('unlimited km') ||
    norm.includes('kilometres included') ||
    norm.includes('what happens if i') ||
    norm.includes('hours late') ||
    norm.includes('return late') ||
    norm.includes('late return') ||
    norm.includes('late penalty') ||
    norm.includes('grace period') ||
    norm.includes('damaged') ||
    norm.includes('damage liability') ||
    norm.includes('zero excess') ||
    norm.includes('insurance included') ||
    norm.includes('security deposit') ||
    norm.includes('security bond') ||
    norm.includes('pre-authorisation') ||
    norm.includes('collect in sydney and leave the car in brisbane') ||
    norm.includes('collect in sydney and return in brisbane') ||
    norm.includes('return it somewhere else') ||
    norm.includes('return somewhere else') ||
    norm.includes('one way rental') ||
    norm.includes('one-way') ||
    norm.includes('roadside assistance') ||
    norm.includes('breakdown') ||
    norm.includes('child seat') ||
    norm.includes('baby seat') ||
    norm.includes('booster seat') ||
    norm.includes('useful for children') ||
    norm.includes('gps') ||
    norm.includes('satellite navigation') ||
    norm.includes('rental policies') ||
    norm.includes('rental rules') ||
    norm.includes('terms and conditions')
  ) {
    return 'POLICY_INQUIRY';
  }

  // 7. Location Hub Inquiries ("where can i pick up", "do you have cars in brisbane", "operate in sydney")
  if (
    norm.includes('where can i pick up') ||
    norm.includes('where can i return') ||
    norm.includes('do you operate in') ||
    norm.includes('do you have cars in') ||
    norm.includes('locations in') ||
    norm.includes('nearest hub') ||
    norm.includes('nearest location') ||
    (norm.includes('where') &&
      (norm.includes('location') ||
        norm.includes('hubs') ||
        norm.includes('branches') ||
        norm.includes('office')))
  ) {
    return 'LOCATION_INQUIRY';
  }

  // 8. Vehicle Attribute Inquiry (Specific question about boot space, seats, transmission, fuel)
  if (
    (norm.includes('kitna luggage') ||
      norm.includes('luggage kitna') ||
      norm.includes('luggage capacity') ||
      norm.includes('seating capacity') ||
      norm.includes('how much luggage') ||
      norm.includes('boot space') ||
      norm.includes('kitne log') ||
      norm.includes('how many seats') ||
      norm.includes('how many passengers') ||
      norm.includes('is it automatic') ||
      norm.includes('automatic hai') ||
      norm.includes('fuel type kya') ||
      (norm.includes('luggage') &&
        (norm.includes('kitna') ||
          norm.includes('how much') ||
          norm.includes('space') ||
          norm.includes('aayega') ||
          norm.includes('capacity'))) ||
      (norm.includes('seat') &&
        (norm.includes('kitne') ||
          norm.includes('how many') ||
          norm.includes('capacity') ||
          norm.includes('baith')))) &&
    !norm.includes('need') &&
    !norm.includes('want') &&
    !norm.includes('show') &&
    !norm.includes('chahiye') &&
    !norm.includes('dikha')
  ) {
    return 'VEHICLE_ATTRIBUTE_INQUIRY';
  }

  // 9. Direct Booking / "Book it"
  if (
    norm.includes('book it') ||
    norm.includes('book this') ||
    norm.includes('start booking') ||
    norm.includes('proceed with booking') ||
    norm.includes('reserve it') ||
    norm.includes('reserve this') ||
    norm.includes('ye book kar do') ||
    norm.includes('book kar do') ||
    norm.includes('book karni hai') ||
    norm.includes('kar de') ||
    (context?.hasSelectedVehicle && norm === 'book')
  ) {
    return 'CREATE_BOOKING_DRAFT';
  }

  // 10. Availability Check
  if (
    norm.includes('available') ||
    norm.includes('availability') ||
    norm.includes('free on') ||
    norm.includes('free 1') ||
    norm.includes('free h') ||
    norm.includes('free hai') ||
    norm.includes('milega') ||
    norm.includes('milegi') ||
    norm.includes('can i get') ||
    norm.includes('can i rent') ||
    norm.includes('iski availability dekh') ||
    (extractNaturalDates(userText) &&
      (norm.includes('available') ||
        norm.includes('free') ||
        norm.includes('get') ||
        norm.includes('rent') ||
        norm.includes('need') ||
        norm.includes('want') ||
        norm.includes('chahiye')))
  ) {
    return 'CHECK_AVAILABILITY';
  }

  // 11. Price Calculation
  if (
    norm.includes('how much') ||
    norm.includes('cost') ||
    norm.includes('price') ||
    norm.includes('rate') ||
    norm.includes('calculate price') ||
    norm.includes('kitne ka padega') ||
    norm.includes('kitna') ||
    norm.includes('kitne ki') ||
    /\b\d+\s*(?:days|day|din)\b/i.test(norm)
  ) {
    return 'CALCULATE_PRICE';
  }

  // 12. Discounts / Promos
  if (
    norm.includes('discount') ||
    norm.includes('promo') ||
    norm.includes('coupon') ||
    norm.includes('deal') ||
    norm.includes('offer')
  ) {
    return 'GET_DISCOUNTS';
  }

  // 13. Extras / Upsells
  if (
    (norm.includes('useful') ||
      norm.includes('extra') ||
      norm.includes('accessories') ||
      (norm.includes('anything') && norm.includes('family'))) &&
    !norm.includes('suv') &&
    !norm.includes('sedan') &&
    !norm.includes('car') &&
    !norm.includes('vehicle')
  ) {
    return 'GET_EXTRAS';
  }

  // 14. Specific Vehicle Details / Selection / Ordinal reference
  if (
    norm.includes('i want') ||
    norm.includes('i will take') ||
    norm.includes("i'll take") ||
    norm.includes('select') ||
    norm.includes('choose') ||
    norm.includes('details for') ||
    norm.includes('tell me about') ||
    norm.includes('first vehicle') ||
    norm.includes('second vehicle') ||
    norm.includes('third vehicle') ||
    norm.includes('last vehicle')
  ) {
    return 'GET_VEHICLE_DETAILS';
  }

  // 15. Vehicle Search / Recommendation
  if (
    norm.includes('show') ||
    norm.includes('need') ||
    norm.includes('suv') ||
    norm.includes('sedan') ||
    norm.includes('luxury') ||
    norm.includes('ute') ||
    norm.includes('cheap') ||
    norm.includes('sasta') ||
    norm.includes('sasti') ||
    norm.includes('budget') ||
    norm.includes('family') ||
    norm.includes('seater') ||
    norm.includes('automatic') ||
    norm.includes('car') ||
    norm.includes('vehicle') ||
    norm.includes('bata')
  ) {
    return 'SEARCH_VEHICLES';
  }

  return 'UNKNOWN';
}

export interface ConversationState {
  selectedVehicle: VehicleRecord | null;
  category: string | null;
  pickupDate: string | null;
  dropoffDate: string | null;
  formattedPickup: string | null;
  formattedDropoff: string | null;
  durationDays: number | null;
  pickupLocation: string | null;
  dropoffLocation: string | null;
  lastSuggestedVehicles: VehicleRecord[];
  isCancelled: boolean;
  budgetPreference: 'cheaper' | 'luxury' | null;
  // Hard Constraints
  transmission: 'Automatic' | 'Manual' | 'Any' | null;
  seatsMin: number | null;
  maxDailyRate: number | null;
}

/**
 * Extracts and maintains a structured conversation state across turns.
 * When the user provides a new value (vehicle, date, location, cancellation), it replaces the old value.
 */
export function extractConversationState(
  messages: Array<{ role: string; content: string }>,
  vehicles: VehicleRecord[],
): ConversationState {
  const state: ConversationState = {
    selectedVehicle: null,
    category: null,
    pickupDate: null,
    dropoffDate: null,
    formattedPickup: null,
    formattedDropoff: null,
    durationDays: null,
    pickupLocation: null,
    dropoffLocation: null,
    lastSuggestedVehicles: [],
    isCancelled: false,
    budgetPreference: null,
    transmission: null,
    seatsMin: null,
    maxDailyRate: null,
  };

  for (const m of messages) {
    if (m.role !== 'user') continue;
    const raw = m.content;
    const norm = normalizeUserText(raw);

    // 0. Cancellation of active booking draft
    if (
      norm.includes('cancel draft') ||
      norm.includes('cancel this draft') ||
      norm.includes('wait cancel') ||
      norm.includes('abort booking') ||
      norm.includes('stop booking') ||
      norm.includes('rehne do mat book karo') ||
      norm.includes('mat book karo') ||
      norm.includes('booking mat karo')
    ) {
      state.isCancelled = true;
    } else {
      state.isCancelled = false;
    }

    // 1. Budget preference
    if (
      norm.includes('cheaper') ||
      norm.includes('sasta') ||
      norm.includes('sasti') ||
      norm.includes('mehngi')
    ) {
      state.budgetPreference = 'cheaper';
    } else if (
      norm.includes('luxury') ||
      norm.includes('best wali') ||
      norm.includes('top rated')
    ) {
      state.budgetPreference = 'luxury';
    }

    // 2. Ordinal Vehicle References ("first vehicle", "second vehicle", "third vehicle", "last vehicle")
    let ordinalSelected: VehicleRecord | null = null;
    if (norm.includes('first vehicle') || norm.includes('pehli')) {
      ordinalSelected = state.lastSuggestedVehicles[0] || vehicles[0];
    } else if (norm.includes('second vehicle') || norm.includes('dusri')) {
      ordinalSelected = state.lastSuggestedVehicles[1] || vehicles[1] || vehicles[0];
    } else if (norm.includes('third vehicle') || norm.includes('teesri')) {
      ordinalSelected = state.lastSuggestedVehicles[2] || vehicles[2] || vehicles[0];
    } else if (norm.includes('last vehicle') || norm.includes('aakhri')) {
      ordinalSelected =
        state.lastSuggestedVehicles[state.lastSuggestedVehicles.length - 1] ||
        vehicles[vehicles.length - 1];
    }

    // 3. Vehicle Mentioned in this turn -> REPLACES previous vehicle
    const vehicleInMsg = resolveVehicleWithTypoTolerance(raw, vehicles);
    if (vehicleInMsg) {
      state.selectedVehicle = vehicleInMsg;
      state.category = vehicleInMsg.category.toLowerCase();
    } else if (ordinalSelected) {
      state.selectedVehicle = ordinalSelected;
      state.category = ordinalSelected.category.toLowerCase();
    } else if (norm.includes('suv') || norm.includes('suvs')) {
      state.category = 'suv';
      state.lastSuggestedVehicles = vehicles.filter((v) => v.category.toLowerCase() === 'suv');
      if (state.selectedVehicle && state.selectedVehicle.category.toLowerCase() !== 'suv') {
        state.selectedVehicle = null;
      }
    } else if (norm.includes('sedan') || norm.includes('sedans')) {
      state.category = 'sedan';
      state.lastSuggestedVehicles = vehicles.filter((v) => v.category.toLowerCase() === 'sedan');
      if (state.selectedVehicle && state.selectedVehicle.category.toLowerCase() !== 'sedan') {
        state.selectedVehicle = null;
      }
    } else if (norm.includes('luxury') || norm.includes('premium')) {
      state.category = 'luxury';
      state.lastSuggestedVehicles = vehicles.filter(
        (v) => v.category.toLowerCase() === 'luxury' || v.category.toLowerCase() === 'premium',
      );
      if (state.selectedVehicle && state.selectedVehicle.category.toLowerCase() !== 'luxury') {
        state.selectedVehicle = null;
      }
    } else if (norm.includes('utility') || norm.includes('ute') || norm.includes('4x4')) {
      state.category = 'utility';
      state.lastSuggestedVehicles = vehicles.filter((v) => v.category.toLowerCase() === 'utility');
      if (state.selectedVehicle && state.selectedVehicle.category.toLowerCase() !== 'utility') {
        state.selectedVehicle = null;
      }
    }

    // 4. Dates Mentioned in this turn -> REPLACES previous dates
    const datesInMsg = extractNaturalDates(raw);
    if (datesInMsg) {
      state.pickupDate = datesInMsg.pickupDate;
      state.dropoffDate = datesInMsg.dropoffDate;
      state.formattedPickup = datesInMsg.formattedPickup;
      state.formattedDropoff = datesInMsg.formattedDropoff;
      const diffMs =
        new Date(datesInMsg.dropoffDate).getTime() - new Date(datesInMsg.pickupDate).getTime();
      state.durationDays = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
    } else {
      // Check if message explicitly mentions a duration: e.g. "for 10 days", "for 4 days", "4 din", "7 din"
      const dMatch = norm.match(/(\d+)\s*(?:days|day|din)/i);
      if (dMatch) {
        state.durationDays = parseInt(dMatch[1], 10);
        const basePickup = state.pickupDate || '2026-09-10';
        const dObj = new Date(basePickup);
        dObj.setDate(dObj.getDate() + state.durationDays);
        state.pickupDate = basePickup;
        state.dropoffDate = dObj.toISOString().split('T')[0];
        state.formattedPickup = basePickup;
        state.formattedDropoff = state.dropoffDate;
      }
    }

    // 5. Location Mentioned in this turn -> REPLACES previous location
    const locations = [
      'Sydney',
      'Melbourne',
      'Brisbane',
      'Gold Coast',
      'Perth',
      'Adelaide',
      'Hobart',
      'Cairns',
    ];
    for (const loc of locations) {
      if (norm.includes(loc.toLowerCase())) {
        state.pickupLocation = loc;
        state.dropoffLocation = loc;
      }
    }

    // 6. Hard Constraint Extraction: Transmission
    if (
      norm.includes('manual nahi') ||
      norm.includes('no manual') ||
      norm.includes('not manual') ||
      norm.includes('without manual')
    ) {
      state.transmission = 'Automatic';
    } else if (
      norm.includes('automatic nahi') ||
      norm.includes('no automatic') ||
      norm.includes('not automatic') ||
      norm.includes('no auto') ||
      norm.includes('not auto')
    ) {
      state.transmission = 'Manual';
    } else if (
      norm.includes('manual is okay') ||
      norm.includes('any transmission') ||
      norm.includes('dono chalenge') ||
      norm.includes('any gear')
    ) {
      state.transmission = 'Any';
    } else if (
      norm.includes('manual') ||
      norm.includes('stick shift') ||
      norm.includes('gear khud')
    ) {
      state.transmission = 'Manual';
    } else if (
      norm.includes('automatic') ||
      norm.includes('auto car') ||
      norm.includes('auto wali') ||
      norm.match(/\bauto\b/)
    ) {
      state.transmission = 'Automatic';
    }

    // 7. Hard Constraint Extraction: Min Seats
    const seatMatch = norm.match(/(\d+)\s*(?:seat|seater|people|log)/i);
    if (seatMatch) {
      state.seatsMin = parseInt(seatMatch[1], 10);
    } else if (norm.includes('family of five')) {
      state.seatsMin = 5;
    } else if (norm.includes('family')) {
      state.seatsMin = Math.max(state.seatsMin || 0, 4);
    }

    // 8. Hard Constraint Extraction: Max Daily Rate
    const priceMatch =
      norm.match(/under\s*₹?\s*(\d+)/i) ||
      norm.match(/less than\s*₹?\s*(\d+)/i) ||
      norm.match(/max\s*₹?\s*(\d+)/i);
    if (priceMatch) {
      state.maxDailyRate = parseInt(priceMatch[1], 10);
    }
  }

  return state;
}
