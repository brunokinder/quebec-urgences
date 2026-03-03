// Approximate coordinates for Quebec hospitals
// Used for map visualization

export const REGION_CENTERS: Record<string, [number, number]> = {
  "Montréal": [45.5017, -73.5673],
  "Laval": [45.6066, -73.7124],
  "Montérégie": [45.35, -73.25],
  "Laurentides": [46.05, -74.35],
  "Lanaudière": [45.90, -73.45],
  "Capitale-Nationale": [46.87, -71.40],
  "Chaudière-Appalaches": [46.35, -70.70],
  "Saguenay–Lac-Saint-Jean": [48.43, -71.07],
  "Saguenay-Lac-Saint-Jean": [48.43, -71.07],
  "Mauricie et Centre-du-Québec": [46.55, -72.85],
  "Mauricie": [46.55, -72.85],
  "Centre-du-Québec": [46.15, -72.45],
  "Estrie": [45.40, -71.90],
  "Outaouais": [45.50, -76.00],
  "Abitibi-Témiscamingue": [48.25, -77.80],
  "Nord-du-Québec": [53.00, -75.50],
  "Côte-Nord": [50.20, -63.50],
  "Gaspésie–Îles-de-la-Madeleine": [48.30, -65.50],
  "Gaspésie-Îles-de-la-Madeleine": [48.30, -65.50],
  "Bas-Saint-Laurent": [47.90, -69.00],
  "Nunavik": [58.00, -74.00],
  "Terres-Cries-de-la-Baie-James": [53.00, -77.00],
};

// Known hospital coordinates (partial exact matches)
// Hospital names are uppercase keys for case-insensitive matching
export const KNOWN_HOSPITAL_COORDS: Array<[string, [number, number]]> = [
  // Montréal — CUSM / McGill
  ["HÔPITAL GÉNÉRAL DE MONTRÉAL", [45.4971, -73.5878]],
  ["HÔPITAL ROYAL VICTORIA", [45.5116, -73.5784]],
  ["L'HÔPITAL DE MONTRÉAL POUR ENFANTS", [45.5022, -73.6238]],
  ["HÔPITAL DE MONTRÉAL POUR ENFANTS", [45.5022, -73.6238]],
  ["HÔPITAL GÉNÉRAL DU LAKESHORE", [45.4553, -73.8059]],
  ["HÔPITAL LAKESHORE", [45.4553, -73.8059]],
  // Montréal — CHUM
  ["CENTRE HOSPITALIER DE L'UNIVERSITÉ DE MONTRÉAL", [45.5153, -73.5566]],
  // Montréal — CHU Sainte-Justine
  ["CHU SAINTE-JUSTINE", [45.5022, -73.6238]],
  ["HÔPITAL SAINTE-JUSTINE", [45.5022, -73.6238]],
  // Montréal — autres
  ["HÔPITAL MAISONNEUVE-ROSEMONT", [45.5721, -73.5461]],
  ["HÔPITAL JEAN-TALON", [45.5467, -73.6228]],
  ["HÔPITAL DU SACRÉ-COEUR-DE-MONTRÉAL", [45.5395, -73.7256]],
  ["HÔPITAL DU SACRÉ-CŒUR DE MONTRÉAL", [45.5395, -73.7256]],
  ["HÔPITAL SACRÉ-CŒUR", [45.5395, -73.7256]],
  ["HÔPITAL EN SANTÉ MENTALE ALBERT-PRÉVOST", [45.5461, -73.7222]],
  ["HÔPITAL DE VERDUN", [45.4574, -73.5672]],
  ["HÔPITAL FLEURY", [45.5678, -73.6547]],
  ["HÔPITAL SANTA CABRINI", [45.5591, -73.5461]],
  ["HÔPITAL RIVIÈRE-DES-PRAIRIES", [45.6097, -73.5717]],
  ["HÔPITAL DOUGLAS", [45.4474, -73.5980]],
  ["HÔPITAL ANNA-LABERGE", [45.3539, -73.7481]],
  ["HÔPITAL ANNA LABERGE", [45.3539, -73.7481]],
  ["HÔPITAL GÉNÉRAL JUIF", [45.4959, -73.6305]],
  ["HÔPITAL NOTRE-DAME", [45.5197, -73.5568]],
  ["HÔPITAL SAINT-LUC", [45.5069, -73.5617]],
  ["HÔTEL-DIEU DE MONTRÉAL", [45.5083, -73.5736]],
  ["HÔPITAL LASALLE", [45.4313, -73.6278]],
  ["CENTRE HOSPITALIER DE ST. MARY", [45.4767, -73.6023]],
  ["INSTITUT DE CARDIOLOGIE DE MONTRÉAL", [45.5608, -73.5972]],
  ["INSTITUT UNIVERSITAIRE EN SANTÉ MENTALE DE MONTRÉAL", [45.5667, -73.5500]],

  // Laval
  ["HÔPITAL DE LA CITÉ-DE-LA-SANTÉ", [45.5707, -73.7426]],
  ["CITÉ-DE-LA-SANTÉ", [45.5707, -73.7426]],

  // Laurentides
  ["HÔPITAL DE SAINT-JÉRÔME", [45.7822, -74.0059]],
  ["SAINT-JÉRÔME", [45.7822, -74.0059]],
  ["HÔPITAL RÉGIONAL SAINT-JÉRÔME", [45.7822, -74.0059]],
  ["HÔPITAL DE SAINT-EUSTACHE", [45.5625, -73.9031]],
  ["HÔPITAL DE MONT-LAURIER", [46.5550, -75.4989]],
  ["HÔPITAL DE SAINTE-AGATHE", [46.0538, -74.2819]],

  // Lanaudière
  ["HÔPITAL PIERRE-LE GARDEUR", [45.7417, -73.4872]],
  ["HÔPITAL PIERRE-LE-GARDEUR", [45.7417, -73.4872]],
  ["HÔPITAL LE GARDEUR", [45.7417, -73.4872]],
  ["HÔPITAL DE JOLIETTE", [46.0203, -73.4456]],
  ["HÔPITAL DE LANAUDIÈRE", [46.0203, -73.4456]],

  // Montérégie
  ["HÔPITAL DU SUROÎT", [45.3453, -74.1302]],
  ["HÔPITAL CHARLES-LE MOYNE", [45.4617, -73.4539]],
  ["CHARLES-LE MOYNE", [45.4617, -73.4539]],
  ["HÔPITAL PIERRE-BOUCHER", [45.5167, -73.4167]],
  ["HÔPITAL PIERRE BOUCHER", [45.5167, -73.4167]],
  ["HÔPITAL BROME-MISSISQUOI-PERKINS", [45.0256, -72.8703]],
  ["HÔPITAL HONORÉ-MERCIER", [45.4019, -72.7258]],
  ["HÔPITAL BARRIE MEMORIAL", [45.0167, -74.1333]],
  ["HÔPITAL DU HAUT-RICHELIEU", [45.1544, -73.2736]],
  ["HÔPITAL HONORÉ-MERCIER", [45.4019, -72.7258]],
  ["HÔTEL-DIEU DE SOREL", [46.0406, -73.1119]],

  // Capitale-Nationale — CHU de Québec - Université Laval sites
  ["CENTRE HOSPITALIER DE L'UNIVERSITÉ LAVAL", [46.7867, -71.2745]], // CHUL, Sainte-Foy
  ["HÔPITAL DE L'ENFANT-JÉSUS", [46.8178, -71.2281]],
  ["HÔPITAL DU SAINT-SACREMENT", [46.7945, -71.2622]],
  ["HÔPITAL SAINT-SACREMENT", [46.7945, -71.2622]],
  ["L'HÔTEL-DIEU DE QUÉBEC", [46.8106, -71.2194]],
  ["HÔTEL-DIEU DE QUÉBEC", [46.8106, -71.2194]],
  ["HÔPITAL SAINT-FRANÇOIS D'ASSISE", [46.8342, -71.2681]],
  ["HÔPITAL JEFFERY HALE", [46.8022, -71.2561]],
  // IUCPQ
  ["IUCPQ", [46.7778, -71.3444]],
  ["INSTITUT UNIVERSITAIRE DE CARDIOLOGIE ET DE PNEUMOLOGIE DE QUÉBEC", [46.7778, -71.3444]],
  ["HÔPITAL LAVAL", [46.7778, -71.3444]],
  // CIUSSS de la Capitale-Nationale community sites
  ["HÔPITAL ET CLSC DE LA MALBAIE", [47.6514, -70.1583]],

  // Chaudière-Appalaches
  ["HÔTEL-DIEU DE LÉVIS", [46.8066, -71.1806]],
  ["HÔTEL-DIEU DE LÉVIS", [46.8066, -71.1806]],
  ["HÔPITAL DE THETFORD MINES", [46.0961, -71.2967]],
  ["HÔPITAL DE MONTMAGNY", [46.9806, -70.5528]],
  ["HÔPITAL DE SAINT-GEORGES", [46.1158, -70.6667]],
  ["HÔPITAL DE BEAUCE", [46.1158, -70.6667]],

  // Saguenay–Lac-Saint-Jean
  ["HÔPITAL DE CHICOUTIMI", [48.4161, -71.0778]],
  ["HÔPITAL DU CHICOUTIMI", [48.4161, -71.0778]],
  ["CHICOUTIMI", [48.4161, -71.0778]],
  ["HÔPITAL ET CENTRE DE RÉADAPTATION DE JONQUIÈRE", [48.4244, -71.2347]],
  ["HÔPITAL DE JONQUIÈRE", [48.4244, -71.2347]],
  ["HÔPITAL ET CENTRE D'HÉBERGEMENT DE ROBERVAL", [48.5233, -72.2244]],
  ["HÔPITAL DE ROBERVAL", [48.5233, -72.2244]],
  ["HÔPITAL DE DOLBEAU-MISTASSINI", [48.8806, -72.2347]],
  ["HÔPITAL DE DOLBEAU", [48.8806, -72.2347]],
  ["HÔPITAL D'ALMA", [48.5494, -71.6538]],
  ["HÔPITAL DE LA BAIE", [48.3319, -70.8761]],
  ["HÔPITAL DE SAGUENAY", [48.4161, -71.0778]],

  // Mauricie / Centre-du-Québec
  ["HÔPITAL SAINTE-MARIE", [46.3521, -72.5419]],
  ["HÔPITAL RÉGIONAL DE TROIS-RIVIÈRES", [46.3521, -72.5419]],
  ["CENTRE HOSPITALIER RÉGIONAL DE TROIS-RIVIÈRES", [46.3521, -72.5419]],
  ["CHRTR", [46.3521, -72.5419]],
  ["HÔPITAL DE SHAWINIGAN", [46.5597, -72.7558]],
  ["HÔPITAL SAINTE-CROIX", [45.8772, -72.4781]],
  ["HÔPITAL DU CENTRE-DE-LA-MAURICIE", [46.5597, -72.7558]],
  ["HÔPITAL DE DRUMMONDVILLE", [45.8772, -72.4781]],
  ["HÔPITAL DE VICTORIAVILLE", [46.0559, -71.9614]],
  ["HÔPITAL HÔTEL-DIEU D'ARTHABASKA", [46.0559, -71.9614]],

  // Estrie
  ["HÔPITAL FLEURIMONT", [45.3870, -71.9235]],
  ["CHUS", [45.3870, -71.9235]],
  ["CENTRE HOSPITALIER UNIVERSITAIRE DE SHERBROOKE", [45.3870, -71.9235]],
  ["HÔTEL-DIEU DE SHERBROOKE", [45.4000, -71.8833]],
  ["HÔPITAL DE GRANBY", [45.3999, -72.7327]],
  ["HÔPITAL DE MEMPHRÉMAGOG", [45.0972, -72.1497]],
  ["HÔPITAL DU HAUT-SAINT-FRANÇOIS", [45.3750, -71.3667]],

  // Outaouais
  ["HÔPITAL DE HULL", [45.4344, -75.7517]],
  ["HÔPITAL DE GATINEAU", [45.4344, -75.7517]],
  ["HÔPITAL ET CHSLD DU PONTIAC", [45.6167, -76.5333]],
  ["HÔPITAL DU PONTIAC", [45.6167, -76.5333]],
  ["HÔPITAL ET CHSLD DE PAPINEAU", [45.7572, -75.0089]],
  ["HÔPITAL DE PAPINEAU", [45.7572, -75.0089]],
  ["HÔPITAL DE MANIWAKI", [46.3836, -75.9756]],
  ["HÔPITAL ET CHSLD MÉMORIAL DE WAKEFIELD", [45.6353, -75.9233]],
  ["HÔPITAL DE HAWKESBURY", [45.6022, -74.5958]],

  // Abitibi-Témiscamingue
  ["HÔPITAL DE ROUYN-NORANDA", [48.2369, -79.0170]],
  ["HÔPITAL DE VAL-D'OR", [48.0961, -77.7858]],
  ["HÔPITAL D'AMOS", [48.5661, -78.1236]],
  ["HÔPITAL DE AMOS", [48.5661, -78.1236]],
  ["HÔPITAL DE MALARTIC", [48.1367, -78.1247]],
  ["HÔPITAL DE VILLE-MARIE", [47.3367, -79.4347]],
  ["CENTRE MULTISERVICES DE SANTÉ ET DE SERVICES SOCIAUX DE VILLE-MARIE", [47.3367, -79.4347]],
  ["CENTRE MULTISERVICES DE SANTÉ ET DE SERVICES SOCIAUX DE LA SARRE", [48.7950, -79.2025]],
  ["CENTRE MULTISERVICES DE SANTÉ ET DE SERVICES SOCIAUX DE TÉMISCAMING", [46.7167, -79.1000]],

  // Nord-du-Québec
  ["HÔPITAL DE CHIBOUGAMAU", [49.9178, -74.3698]],
  ["HÔPITAL DE CHAPAIS", [49.7828, -74.8619]],

  // Côte-Nord
  ["HÔPITAL ET CLSC DE SEPT-ÎLES", [50.2181, -66.3832]],
  ["HÔPITAL DE SEPT-ÎLES", [50.2181, -66.3832]],
  ["HÔPITAL LE ROYER", [49.2161, -68.1511]],
  ["HÔPITAL DE BAIE-COMEAU", [49.2161, -68.1511]],
  ["HÔPITAL DE HAVRE-SAINT-PIERRE", [50.2333, -63.6000]],

  // Gaspésie–Îles-de-la-Madeleine
  ["HÔPITAL DE GASPÉ", [48.8333, -64.4833]],
  ["HÔPITAL ET CLSC DE SAINTE-ANNE-DES-MONTS", [49.1328, -66.4878]],
  ["HÔPITAL ET GROUPE DE MÉDECINE DE FAMILLE UNIVERSITAIRE DE MARIA", [48.1736, -65.9989]],
  ["HÔPITAL DE MARIA", [48.1736, -65.9989]],
  ["HÔPITAL DE CHANDLER", [48.3606, -64.6825]],
  ["HÔPITAL DE NEW CARLISLE", [48.0078, -65.3253]],
  ["HÔPITAL DE L'ARCHIPEL", [47.3872, -61.8739]], // Îles-de-la-Madeleine

  // Bas-Saint-Laurent
  ["HÔPITAL RÉGIONAL DE RIMOUSKI", [48.4478, -68.5267]],
  ["HÔPITAL DE RIMOUSKI", [48.4478, -68.5267]],
  ["CENTRE HOSPITALIER RÉGIONAL DU GRAND-PORTAGE", [47.8317, -69.5322]],
  ["HÔPITAL DE RIVIÈRE-DU-LOUP", [47.8317, -69.5322]],
  ["HÔPITAL DE NOTRE-DAME-DU-LAC", [47.6247, -68.7822]],
  ["HÔPITAL NOTRE-DAME-DE-FATIMA", [47.3561, -70.0369]], // La Pocatière
  ["HÔPITAL DE SAINT-PASCAL", [47.5225, -69.8022]],
  ["HÔPITAL D'AMQUI", [48.4583, -67.4328]],
  ["HÔPITAL DE LA MATAPÉDIA", [48.4583, -67.4328]],
  ["CENTRE MULTISERVICES DE SANTÉ ET DE SERVICES SOCIAUX DE TROIS-PISTOLES", [48.1214, -69.1778]],
  ["HÔPITAL DE TROIS-PISTOLES", [48.1214, -69.1778]],

  // Estrie — CHUS sites (actual names from CSV)
  ["CHUS - HÔPITAL FLEURIMONT", [45.3870, -71.9235]],
  ["CHUS - HÔTEL-DIEU DE SHERBROOKE", [45.4000, -71.8833]],
  ["CENTRE DE SANTÉ ET DE SERVICES SOCIAUX DU GRANIT", [45.6028, -70.8906]], // Lac-Mégantic
  ["CENTRE MULTISERVICES DE SANTÉ ET DE SERVICES SOCIAUX DE MEMPHRÉMAGOG", [45.0972, -72.1497]],

  // Mauricie / Centre-du-Québec — CIUSSS sites
  ["PAVILLON SAINTE-MARIE", [46.3521, -72.5419]],
  ["HÔTEL-DIEU D'ARTHABASKA", [46.0559, -71.9614]],
];

function stableHash(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function getHospitalCoords(
  name: string,
  region: string
): [number, number] {
  const upperName = name.toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  // Check for exact/partial match in known coordinates
  for (const [key, coords] of KNOWN_HOSPITAL_COORDS) {
    const upperKey = key.toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    if (upperName.includes(upperKey) || upperKey.includes(upperName)) {
      return coords;
    }
  }

  // Try matching key words (city names embedded in hospital name)
  const cityKeywords: Array<[string, [number, number]]> = [
    ["SEPT-ILES", [50.2181, -66.3832]],
    ["CHICOUTIMI", [48.4161, -71.0778]],
    ["JONQUIERE", [48.4244, -71.2347]],
    ["ROBERVAL", [48.5233, -72.2244]],
    ["RIMOUSKI", [48.4478, -68.5267]],
    ["RIVIERE-DU-LOUP", [47.8317, -69.5322]],
    ["GASPE", [48.8333, -64.4833]],
    ["MATANE", [48.8478, -67.5367]],
    ["BAIE-COMEAU", [49.2161, -68.1511]],
    ["TROIS-RIVIERES", [46.3521, -72.5419]],
    ["SHAWINIGAN", [46.5597, -72.7558]],
    ["DRUMMONDVILLE", [45.8772, -72.4781]],
    ["VICTORIAVILLE", [46.0559, -71.9614]],
    ["SHERBROOKE", [45.3870, -71.9235]],
    ["GRANBY", [45.3999, -72.7327]],
    ["GATINEAU", [45.4344, -75.7517]],
    ["HULL", [45.4344, -75.7517]],
    ["VAL-D'OR", [48.0961, -77.7858]],
    ["ROUYN", [48.2369, -79.0170]],
    ["AMOS", [48.5661, -78.1236]],
    ["JOLIETTE", [46.0203, -73.4456]],
    ["SAINT-EUSTACHE", [45.5625, -73.9031]],
    ["SAINT-JEROME", [45.7822, -74.0059]],
    ["SAINT-HYACINTHE", [45.6281, -72.9500]],
    ["SAINT-GEORGES", [46.1158, -70.6667]],
    ["LEVIS", [46.8066, -71.1806]],
    ["THETFORD", [46.0961, -71.2967]],
    ["MONTMAGNY", [46.9806, -70.5528]],
    ["MANIWAKI", [46.3836, -75.9756]],
    ["ALMA", [48.5494, -71.6538]],
    ["LA MALBAIE", [47.6514, -70.1583]],
    ["NOTRE-DAME-DU-LAC", [47.6247, -68.7822]],
    ["SAINTE-ANNE-DES-MONTS", [49.1328, -66.4878]],
    // NOTE: "LAVAL" intentionally omitted — it would falsely match
    // "UNIVERSITÉ LAVAL" hospitals in Québec City. The city of Laval's
    // hospital (Cité-de-la-Santé) is already in the explicit lookup above.
    ["VALLEYFIELD", [45.3453, -74.1302]],
    ["LONGUEUIL", [45.4617, -73.4539]],
    ["CHIBOUGAMAU", [49.9178, -74.3698]],
  ];

  for (const [keyword, coords] of cityKeywords) {
    if (upperName.includes(keyword)) {
      return coords;
    }
  }

  // Fall back to region center with a deterministic jitter
  const center = REGION_CENTERS[region] ?? [47.0, -72.0];
  const hash = stableHash(name);
  const jitterLat = ((hash & 0xff) / 255 - 0.5) * 0.9;
  const jitterLng = (((hash >> 8) & 0xff) / 255 - 0.5) * 1.4;
  return [center[0] + jitterLat, center[1] + jitterLng];
}
