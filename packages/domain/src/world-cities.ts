/** Villes réelles pour le seed mondial et les cartes. */

export type WorldCity = {
  city: string;
  country: string;
  countryCode: string;
  currency: string;
  lat: number;
  lng: number;
  zones: string[];
  venues: string[];
};

export const WORLD_CITIES: WorldCity[] = [
  { city: "Yaoundé", country: "Cameroun", countryCode: "CM", currency: "XAF", lat: 3.848, lng: 11.5021, zones: ["Bastos", "Carrefour Damas", "Odza", "Melen"], venues: ["Rooftop Bastos", "Salle Live Melen", "Jardin Odza"] },
  { city: "Douala", country: "Cameroun", countryCode: "CM", currency: "XAF", lat: 4.0511, lng: 9.7679, zones: ["Akwa", "Bonanjo", "Bonapriso"], venues: ["Wouri Lounge", "Akwa Palace"] },
  { city: "Lagos", country: "Nigeria", countryCode: "NG", currency: "NGN", lat: 6.5244, lng: 3.3792, zones: ["Victoria Island", "Lekki", "Ikeja"], venues: ["Quilox", "Lekki Beach Club"] },
  { city: "Accra", country: "Ghana", countryCode: "GH", currency: "GHS", lat: 5.6037, lng: -0.187, zones: ["Osu", "Airport", "Labone"], venues: ["Republic Bar", "Labadi Beach"] },
  { city: "Abidjan", country: "Côte d’Ivoire", countryCode: "CI", currency: "XOF", lat: 5.36, lng: -4.0083, zones: ["Cocody", "Plateau", "Marcory"], venues: ["Sofitel Ivoire", "Le Palais"] },
  { city: "Dakar", country: "Sénégal", countryCode: "SN", currency: "XOF", lat: 14.7167, lng: -17.4677, zones: ["Almadies", "Plateau", "Mermoz"], venues: ["Terrou-Bi", "Just 4 U"] },
  { city: "Nairobi", country: "Kenya", countryCode: "KE", currency: "KES", lat: -1.2921, lng: 36.8219, zones: ["Westlands", "Karen", "Kilimani"], venues: ["The Alchemist", "K1 Klub House"] },
  { city: "Le Cap", country: "Afrique du Sud", countryCode: "ZA", currency: "ZAR", lat: -33.9249, lng: 18.4241, zones: ["Sea Point", "Woodstock", "Camps Bay"], venues: ["Grand Africa Café", "Truth Coffee"] },
  { city: "Johannesburg", country: "Afrique du Sud", countryCode: "ZA", currency: "ZAR", lat: -26.2041, lng: 28.0473, zones: ["Sandton", "Maboneng", "Rosebank"], venues: ["Keyes Art Mile", "Neighbourgoods"] },
  { city: "Casablanca", country: "Maroc", countryCode: "MA", currency: "MAD", lat: 33.5731, lng: -7.5898, zones: ["Maarif", "Anfa", "Ain Diab"], venues: ["Rick’s Café", "La Sqala"] },
  { city: "Marrakech", country: "Maroc", countryCode: "MA", currency: "MAD", lat: 31.6295, lng: -7.9811, zones: ["Gueliz", "Médina", "Hivernage"], venues: ["Nomad", "Jardin Majorelle"] },
  { city: "Le Caire", country: "Égypte", countryCode: "EG", currency: "EGP", lat: 30.0444, lng: 31.2357, zones: ["Zamalek", "Maadi", "Downtown"], venues: ["Cairo Jazz Club", "Sequoia"] },
  { city: "Paris", country: "France", countryCode: "FR", currency: "EUR", lat: 48.8566, lng: 2.3522, zones: ["Le Marais", "Pigalle", "Bastille"], venues: ["Le Perchoir", "Rex Club"] },
  { city: "Lyon", country: "France", countryCode: "FR", currency: "EUR", lat: 45.764, lng: 4.8357, zones: ["Presqu’île", "Croix-Rousse", "Confluence"], venues: ["Le Sucre", "Ninkasi"] },
  { city: "Marseille", country: "France", countryCode: "FR", currency: "EUR", lat: 43.2965, lng: 5.3698, zones: ["Vieux-Port", "Cours Julien", "La Plaine"], venues: ["La Friche", "Le Trolleybus"] },
  { city: "Bruxelles", country: "Belgique", countryCode: "BE", currency: "EUR", lat: 50.8503, lng: 4.3517, zones: ["Ixelles", "Saint-Gilles", "Centre"], venues: ["Fuse", "Café Belga"] },
  { city: "Londres", country: "Royaume-Uni", countryCode: "GB", currency: "GBP", lat: 51.5074, lng: -0.1278, zones: ["Shoreditch", "Brixton", "Soho"], venues: ["Fabric", "Roof East"] },
  { city: "Berlin", country: "Allemagne", countryCode: "DE", currency: "EUR", lat: 52.52, lng: 13.405, zones: ["Kreuzberg", "Neukölln", "Mitte"], venues: ["Berghain", "Klunkerkranich"] },
  { city: "Amsterdam", country: "Pays-Bas", countryCode: "NL", currency: "EUR", lat: 52.3676, lng: 4.9041, zones: ["De Pijp", "Jordaan", "Noord"], venues: ["Shelter", "Canvas"] },
  { city: "Madrid", country: "Espagne", countryCode: "ES", currency: "EUR", lat: 40.4168, lng: -3.7038, zones: ["Malasaña", "La Latina", "Chueca"], venues: ["Teatro Kapital", "Café Central"] },
  { city: "Barcelone", country: "Espagne", countryCode: "ES", currency: "EUR", lat: 41.3874, lng: 2.1686, zones: ["El Born", "Gràcia", "Poble Sec"], venues: ["Razzmatazz", "Bodega 1900"] },
  { city: "Lisbonne", country: "Portugal", countryCode: "PT", currency: "EUR", lat: 38.7223, lng: -9.1393, zones: ["Bairro Alto", "Cais do Sodré", "Alfama"], venues: ["Lux Frágil", "Time Out Market"] },
  { city: "Rome", country: "Italie", countryCode: "IT", currency: "EUR", lat: 41.9028, lng: 12.4964, zones: ["Trastevere", "Testaccio", "Monti"], venues: ["Goa Club", "Necci"] },
  { city: "Milan", country: "Italie", countryCode: "IT", currency: "EUR", lat: 45.4642, lng: 9.19, zones: ["Navigli", "Brera", "Porta Venezia"], venues: ["Plastic", "Rita & Cocktails"] },
  { city: "New York", country: "États-Unis", countryCode: "US", currency: "USD", lat: 40.7128, lng: -74.006, zones: ["Brooklyn", "SoHo", "Williamsburg"], venues: ["Brooklyn Mirage", "House of Yes"] },
  { city: "Los Angeles", country: "États-Unis", countryCode: "US", currency: "USD", lat: 34.0522, lng: -118.2437, zones: ["Silver Lake", "Downtown", "Venice"], venues: ["The Echo", "Grand Central Market"] },
  { city: "Miami", country: "États-Unis", countryCode: "US", currency: "USD", lat: 25.7617, lng: -80.1918, zones: ["Wynwood", "South Beach", "Brickell"], venues: ["LIV", "Wynwood Walls"] },
  { city: "Montréal", country: "Canada", countryCode: "CA", currency: "CAD", lat: 45.5017, lng: -73.5673, zones: ["Plateau", "Mile End", "Griffintown"], venues: ["New City Gas", "Bar Le Ritz"] },
  { city: "Toronto", country: "Canada", countryCode: "CA", currency: "CAD", lat: 43.6532, lng: -79.3832, zones: ["Queen West", "Kensington", "Liberty Village"], venues: ["Rebel", "Bar Raval"] },
  { city: "Mexico", country: "Mexique", countryCode: "MX", currency: "MXN", lat: 19.4326, lng: -99.1332, zones: ["Roma Norte", "Condesa", "Polanco"], venues: ["Licorería Limantour", "Patio 54"] },
  { city: "São Paulo", country: "Brésil", countryCode: "BR", currency: "BRL", lat: -23.5505, lng: -46.6333, zones: ["Vila Madalena", "Pinheiros", "Centro"], venues: ["D-Edge", "Bar do Luiz Fernandes"] },
  { city: "Rio de Janeiro", country: "Brésil", countryCode: "BR", currency: "BRL", lat: -22.9068, lng: -43.1729, zones: ["Ipanema", "Lapa", "Botafogo"], venues: ["Rio Scenarium", "Bar Urca"] },
  { city: "Buenos Aires", country: "Argentine", countryCode: "AR", currency: "ARS", lat: -34.6037, lng: -58.3816, zones: ["Palermo", "San Telmo", "Recoleta"], venues: ["Niceto Club", "La Catedral"] },
  { city: "Bogotá", country: "Colombie", countryCode: "CO", currency: "COP", lat: 4.711, lng: -74.0721, zones: ["Chapinero", "Zona T", "La Candelaria"], venues: ["Theatron", "Andrés Carne de Res"] },
  { city: "Dubai", country: "Émirats", countryCode: "AE", currency: "AED", lat: 25.2048, lng: 55.2708, zones: ["Downtown", "Marina", "JBR"], venues: ["White Dubai", "Atmosphere"] },
  { city: "Istanbul", country: "Turquie", countryCode: "TR", currency: "TRY", lat: 41.0082, lng: 28.9784, zones: ["Beyoğlu", "Kadıköy", "Beşiktaş"], venues: ["Babylon", "Klein"] },
  { city: "Tel Aviv", country: "Israël", countryCode: "IL", currency: "ILS", lat: 32.0853, lng: 34.7818, zones: ["Florentin", "Neve Tzedek", "Port"], venues: ["The Block", "Kuli Alma"] },
  { city: "Mumbai", country: "Inde", countryCode: "IN", currency: "INR", lat: 19.076, lng: 72.8777, zones: ["Bandra", "Colaba", "Lower Parel"], venues: ["Toto’s Garage", "Social"] },
  { city: "Bengaluru", country: "Inde", countryCode: "IN", currency: "INR", lat: 12.9716, lng: 77.5946, zones: ["Indiranagar", "Koramangala", "MG Road"], venues: ["Toit", "The Humming Tree"] },
  { city: "Bangkok", country: "Thaïlande", countryCode: "TH", currency: "THB", lat: 13.7563, lng: 100.5018, zones: ["Sukhumvit", "Riverside", "Thonglor"], venues: ["Octave", "Beam"] },
  { city: "Singapour", country: "Singapour", countryCode: "SG", currency: "SGD", lat: 1.3521, lng: 103.8198, zones: ["Clarke Quay", "Kampong Glam", "Tanjong Pagar"], venues: ["Zouk", "28 HongKong Street"] },
  { city: "Tokyo", country: "Japon", countryCode: "JP", currency: "JPY", lat: 35.6762, lng: 139.6503, zones: ["Shibuya", "Shimokitazawa", "Shinjuku"], venues: ["Womb", "Contact"] },
  { city: "Séoul", country: "Corée du Sud", countryCode: "KR", currency: "KRW", lat: 37.5665, lng: 126.978, zones: ["Itaewon", "Hongdae", "Gangnam"], venues: ["Cakeshop", "Club Octagon"] },
  { city: "Sydney", country: "Australie", countryCode: "AU", currency: "AUD", lat: -33.8688, lng: 151.2093, zones: ["Surry Hills", "Newtown", "The Rocks"], venues: ["Ivy", "The Beresford"] },
  { city: "Melbourne", country: "Australie", countryCode: "AU", currency: "AUD", lat: -37.8136, lng: 144.9631, zones: ["Fitzroy", "Collingwood", "CBD"], venues: ["Revolver", "Naked for Satan"] },
  { city: "Auckland", country: "Nouvelle-Zélande", countryCode: "NZ", currency: "NZD", lat: -36.8509, lng: 174.7645, zones: ["Ponsonby", "Wynyard", "K Road"], venues: ["Neck of the Woods", "Orphans"] },
  { city: "Kinshasa", country: "RD Congo", countryCode: "CD", currency: "CDF", lat: -4.4419, lng: 15.2663, zones: ["Gombe", "Ngaliema", "Limete"], venues: ["Halle de la Gombe", "Club Chez Hélène"] },
  { city: "Addis-Abeba", country: "Éthiopie", countryCode: "ET", currency: "ETB", lat: 9.03, lng: 38.74, zones: ["Bole", "Kazanchis", "Piassa"], venues: ["Jazzamba", "The Linden"] },
  { city: "Tunis", country: "Tunisie", countryCode: "TN", currency: "TND", lat: 36.8065, lng: 10.1815, zones: ["Lac", "Médina", "La Marsa"], venues: ["Le Boeuf sur le Toit", "Carthage Land"] },
  { city: "Alger", country: "Algérie", countryCode: "DZ", currency: "DZD", lat: 36.7538, lng: 3.0588, zones: ["Hydra", "Didouche", "Sidi Yahia"], venues: ["Le Petit Poucet", "Club des Pins"] },
  { city: "Vienne", country: "Autriche", countryCode: "AT", currency: "EUR", lat: 48.2082, lng: 16.3738, zones: ["Neubau", "Leopoldstadt", "Mariahilf"], venues: ["Flex", "Pratersauna"] },
  { city: "Prague", country: "Tchéquie", countryCode: "CZ", currency: "CZK", lat: 50.0755, lng: 14.4378, zones: ["Žižkov", "Vinohrady", "Old Town"], venues: ["Roxy", "Cross Club"] },
  { city: "Varsovie", country: "Pologne", countryCode: "PL", currency: "PLN", lat: 52.2297, lng: 21.0122, zones: ["Praga", "Mokotów", "Śródmieście"], venues: ["Smolna", "Pawilony"] },
  { city: "Stockholm", country: "Suède", countryCode: "SE", currency: "SEK", lat: 59.3293, lng: 18.0686, zones: ["Södermalm", "Östermalm", "Gamla Stan"], venues: ["Trädgården", "Under Kistan"] },
  { city: "Copenhague", country: "Danemark", countryCode: "DK", currency: "DKK", lat: 55.6761, lng: 12.5683, zones: ["Nørrebro", "Vesterbro", "Christianshavn"], venues: ["Rust", "Culture Box"] },
  { city: "Dublin", country: "Irlande", countryCode: "IE", currency: "EUR", lat: 53.3498, lng: -6.2603, zones: ["Temple Bar", "Smithfield", "Portobello"], venues: ["Workman’s Club", "Opium"] },
  { city: "Chicago", country: "États-Unis", countryCode: "US", currency: "USD", lat: 41.8781, lng: -87.6298, zones: ["Wicker Park", "River North", "Logan Square"], venues: ["Smartbar", "Empty Bottle"] },
  { city: "San Francisco", country: "États-Unis", countryCode: "US", currency: "USD", lat: 37.7749, lng: -122.4194, zones: ["Mission", "SoMa", "North Beach"], venues: ["Audio", "El Rio"] },
  { city: "Vancouver", country: "Canada", countryCode: "CA", currency: "CAD", lat: 49.2827, lng: -123.1207, zones: ["Gastown", "Kitsilano", "Yaletown"], venues: ["The Waldorf", "Celebrities"] },
  { city: "Lima", country: "Pérou", countryCode: "PE", currency: "PEN", lat: -12.0464, lng: -77.0428, zones: ["Miraflores", "Barranco", "San Isidro"], venues: ["Ayahuasca", "Mayu"] },
  { city: "Santiago", country: "Chili", countryCode: "CL", currency: "CLP", lat: -33.4489, lng: -70.6693, zones: ["Bellavista", "Lastarria", "Providencia"], venues: ["Club La Feria", "Bar The Clinic"] },
  { city: "Manille", country: "Philippines", countryCode: "PH", currency: "PHP", lat: 14.5995, lng: 120.9842, zones: ["Makati", "BGC", "Poblacion"], venues: ["Revel", "The Palace"] },
  { city: "Jakarta", country: "Indonésie", countryCode: "ID", currency: "IDR", lat: -6.2088, lng: 106.8456, zones: ["Senayan", "Kemang", "SCBD"], venues: ["Dragonfly", "AM/PM"] },
  { city: "Hong Kong", country: "Chine", countryCode: "HK", currency: "HKD", lat: 22.3193, lng: 114.1694, zones: ["Lan Kwai Fong", "Wan Chai", "Tsim Sha Tsui"], venues: ["Dragon-i", "Ozone"] },
  { city: "Taipei", country: "Taïwan", countryCode: "TW", currency: "TWD", lat: 25.033, lng: 121.5654, zones: ["Ximending", "Da’an", "Xinyi"], venues: ["Pacha", "Corner House"] },
  { city: "Hanoï", country: "Viêt Nam", countryCode: "VN", currency: "VND", lat: 21.0278, lng: 105.8342, zones: ["Hoàn Kiếm", "Tây Hồ", "Ba Đình"], venues: ["Savage", "Tadioto"] },
];

export function cityCoords(city?: string | null): { lat: number; lng: number } | null {
  if (!city) return null;
  const hit = WORLD_CITIES.find((c) => c.city.toLowerCase() === city.trim().toLowerCase());
  return hit ? { lat: hit.lat, lng: hit.lng } : null;
}

export function osmEmbedUrl(lat: number, lng: number, delta = 0.012): string {
  const minLng = lng - delta;
  const minLat = lat - delta;
  const maxLng = lng + delta;
  const maxLat = lat + delta;
  return `https://www.openstreetmap.org/export/embed.html?bbox=${minLng}%2C${minLat}%2C${maxLng}%2C${maxLat}&layer=mapnik&marker=${lat}%2C${lng}`;
}
