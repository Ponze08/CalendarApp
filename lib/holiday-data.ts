import type { HolidayVacationType } from "@/types/calendar";

export type SeedHolidayVacation = {
  name: string;
  type: HolidayVacationType;
  start: string;
  end: string;
  source: string;
};

const officialTicinoHolidaySource =
  "Repubblica e Cantone Ticino - Giorni festivi in Ticino";
const officialTicinoSchoolSource =
  "Repubblica e Cantone Ticino - Calendario scolastico";

export const ticinoHolidayVacationSeed: SeedHolidayVacation[] = [
  { name: "Capodanno", type: "national_holiday", start: "2026-01-01", end: "2026-01-01", source: officialTicinoHolidaySource },
  { name: "Epifania", type: "cantonal_holiday", start: "2026-01-06", end: "2026-01-06", source: officialTicinoHolidaySource },
  { name: "San Giuseppe", type: "cantonal_holiday", start: "2026-03-19", end: "2026-03-19", source: officialTicinoHolidaySource },
  { name: "Lunedi di Pasqua", type: "cantonal_holiday", start: "2026-04-06", end: "2026-04-06", source: officialTicinoHolidaySource },
  { name: "Festa del lavoro", type: "cantonal_holiday", start: "2026-05-01", end: "2026-05-01", source: officialTicinoHolidaySource },
  { name: "Ascensione", type: "cantonal_holiday", start: "2026-05-14", end: "2026-05-14", source: officialTicinoHolidaySource },
  { name: "Lunedi di Pentecoste", type: "cantonal_holiday", start: "2026-05-25", end: "2026-05-25", source: officialTicinoHolidaySource },
  { name: "Corpus Domini", type: "cantonal_holiday", start: "2026-06-04", end: "2026-06-04", source: officialTicinoHolidaySource },
  { name: "San Pietro e Paolo", type: "cantonal_holiday", start: "2026-06-29", end: "2026-06-29", source: officialTicinoHolidaySource },
  { name: "Festa Nazionale Svizzera", type: "national_holiday", start: "2026-08-01", end: "2026-08-01", source: officialTicinoHolidaySource },
  { name: "Assunzione", type: "cantonal_holiday", start: "2026-08-15", end: "2026-08-15", source: officialTicinoHolidaySource },
  { name: "Ognissanti", type: "cantonal_holiday", start: "2026-11-01", end: "2026-11-01", source: officialTicinoHolidaySource },
  { name: "Immacolata", type: "cantonal_holiday", start: "2026-12-08", end: "2026-12-08", source: officialTicinoHolidaySource },
  { name: "Natale", type: "national_holiday", start: "2026-12-25", end: "2026-12-25", source: officialTicinoHolidaySource },
  { name: "Santo Stefano", type: "cantonal_holiday", start: "2026-12-26", end: "2026-12-26", source: officialTicinoHolidaySource },
  { name: "Capodanno", type: "national_holiday", start: "2027-01-01", end: "2027-01-01", source: officialTicinoHolidaySource },
  { name: "Epifania", type: "cantonal_holiday", start: "2027-01-06", end: "2027-01-06", source: officialTicinoHolidaySource },
  { name: "San Giuseppe", type: "cantonal_holiday", start: "2027-03-19", end: "2027-03-19", source: officialTicinoHolidaySource },
  { name: "Lunedi di Pasqua", type: "cantonal_holiday", start: "2027-03-29", end: "2027-03-29", source: officialTicinoHolidaySource },
  { name: "Festa del lavoro", type: "cantonal_holiday", start: "2027-05-01", end: "2027-05-01", source: officialTicinoHolidaySource },
  { name: "Ascensione", type: "cantonal_holiday", start: "2027-05-06", end: "2027-05-06", source: officialTicinoHolidaySource },
  { name: "Lunedi di Pentecoste", type: "cantonal_holiday", start: "2027-05-17", end: "2027-05-17", source: officialTicinoHolidaySource },
  { name: "Corpus Domini", type: "cantonal_holiday", start: "2027-05-27", end: "2027-05-27", source: officialTicinoHolidaySource },
  { name: "San Pietro e Paolo", type: "cantonal_holiday", start: "2027-06-29", end: "2027-06-29", source: officialTicinoHolidaySource },
  { name: "Festa Nazionale Svizzera", type: "national_holiday", start: "2027-08-01", end: "2027-08-01", source: officialTicinoHolidaySource },
  { name: "Assunzione", type: "cantonal_holiday", start: "2027-08-15", end: "2027-08-15", source: officialTicinoHolidaySource },
  { name: "Ognissanti", type: "cantonal_holiday", start: "2027-11-01", end: "2027-11-01", source: officialTicinoHolidaySource },
  { name: "Immacolata", type: "cantonal_holiday", start: "2027-12-08", end: "2027-12-08", source: officialTicinoHolidaySource },
  { name: "Natale", type: "national_holiday", start: "2027-12-25", end: "2027-12-25", source: officialTicinoHolidaySource },
  { name: "Santo Stefano", type: "cantonal_holiday", start: "2027-12-26", end: "2027-12-26", source: officialTicinoHolidaySource },
  { name: "Vacanze di Natale 2025/2026", type: "school_vacation", start: "2025-12-24", end: "2026-01-06", source: officialTicinoSchoolSource },
  { name: "Vacanze di Carnevale 2026", type: "school_vacation", start: "2026-02-14", end: "2026-02-22", source: officialTicinoSchoolSource },
  { name: "Vacanze di Pasqua 2026", type: "school_vacation", start: "2026-04-03", end: "2026-04-12", source: officialTicinoSchoolSource },
  { name: "Ponte scolastico Ascensione 2026", type: "school_vacation", start: "2026-05-15", end: "2026-05-15", source: officialTicinoSchoolSource },
  { name: "Vacanze autunnali 2026", type: "school_vacation", start: "2026-10-31", end: "2026-11-08", source: officialTicinoSchoolSource },
  { name: "Vacanze di Natale 2026/2027", type: "school_vacation", start: "2026-12-24", end: "2027-01-06", source: officialTicinoSchoolSource },
  { name: "Vacanze di Carnevale 2027", type: "school_vacation", start: "2027-02-06", end: "2027-02-14", source: officialTicinoSchoolSource },
  { name: "Vacanze di Pasqua 2027", type: "school_vacation", start: "2027-03-26", end: "2027-04-04", source: officialTicinoSchoolSource },
  { name: "Ponte scolastico Ascensione 2027", type: "school_vacation", start: "2027-05-07", end: "2027-05-07", source: officialTicinoSchoolSource }
];

export function seedDate(date: string, end = false) {
  return new Date(`${date}T${end ? "23:59:59.999" : "00:00:00.000"}Z`);
}
