export type IsoDate = `${number}-${number}-${number}`;
export type BusinessCalendar = Readonly<{ timeZone: string; opensAt: string; closesAt: string; workdays: ReadonlySet<number>; holidays: ReadonlySet<IsoDate> }>;
export const DEFAULT_CALENDAR: BusinessCalendar = { timeZone: "Asia/Kolkata", opensAt: "09:00", closesAt: "18:00", workdays: new Set([1, 2, 3, 4, 5]), holidays: new Set<IsoDate>() };
