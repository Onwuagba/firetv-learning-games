// Country name -> ISO 3166-1 alpha-2, used to build flag emoji (regional indicator pairs). Names match curriculum.json.
const ISO: Record<string, string> = {
  Nigeria: "NG", Ghana: "GH", Kenya: "KE", Egypt: "EG", "South Africa": "ZA", Senegal: "SN", Ethiopia: "ET", Morocco: "MA",
  France: "FR", Japan: "JP", Brazil: "BR", Canada: "CA", Australia: "AU", India: "IN", Algeria: "DZ", Tunisia: "TN", Tanzania: "TZ",
  Uganda: "UG", Rwanda: "RW", Zambia: "ZM", Zimbabwe: "ZW", Angola: "AO", Mali: "ML", Niger: "NE", Cameroon: "CM", "Ivory Coast": "CI",
  "Côte d'Ivoire": "CI", Sudan: "SD", Libya: "LY", Somalia: "SO", Botswana: "BW", Namibia: "NA", Mozambique: "MZ", Madagascar: "MG",
  "DR Congo": "CD", "Dem. Rep. Congo": "CD", Congo: "CG", Gabon: "GA", Benin: "BJ", Togo: "TG", Liberia: "LR", "Sierra Leone": "SL",
  China: "CN", "South Korea": "KR", Indonesia: "ID", Thailand: "TH", Vietnam: "VN", Philippines: "PH", Pakistan: "PK", Bangladesh: "BD",
  Nepal: "NP", "Saudi Arabia": "SA", Turkey: "TR", Iran: "IR", Iraq: "IQ", Israel: "IL", Mongolia: "MN", Kazakhstan: "KZ",
  Germany: "DE", Italy: "IT", Spain: "ES", Portugal: "PT", "United Kingdom": "GB", Ireland: "IE", Norway: "NO", Sweden: "SE",
  Finland: "FI", Greece: "GR", Poland: "PL", Ukraine: "UA", Russia: "RU", Netherlands: "NL", Belgium: "BE", Switzerland: "CH", Austria: "AT",
  "United States": "US", "United States of America": "US", Mexico: "MX", Argentina: "AR", Chile: "CL", Peru: "PE", Colombia: "CO",
  Venezuela: "VE", Cuba: "CU", Jamaica: "JM", "New Zealand": "NZ", Fiji: "FJ",
};
export const hasFlag = (name: string) => name in ISO;
/** Flag emoji for a country name, or "" when unknown. */
export function flagEmoji(name: string): string {
  const code = ISO[name];
  return code ? String.fromCodePoint(...[...code].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65)) : "";
}
