export const MSSS_CSV_URL =
  "https://www.msss.gouv.qc.ca/professionnels/statistiques/documents/urgences/Releve_horaire_urgences_7jours_nbpers.csv";

export const CKAN_API_URL =
  "https://www.donneesquebec.ca/recherche/api/3/action/datastore_search?resource_id=b256f87f-40ec-4c79-bdba-a23e9c50e741";

/** Keep hourly rows for this many days, then roll up into daily averages. */
export const HOURLY_RETENTION_DAYS = 60;

/** Occupation rate threshold considered critical. */
export const CRITICAL_OCCUPATION_THRESHOLD = 100;

/** Occupation rate threshold considered high. */
export const HIGH_OCCUPATION_THRESHOLD = 80;
