-- Migration: Normalize house_street vs address for existing applicants
-- Date: 2026-04-07

WITH candidates AS (
  SELECT
    id,
    house_street,
    address,
    array_length(string_to_array(house_street, ','), 1) AS parts_len
  FROM applicants
  WHERE house_street IS NOT NULL
    AND house_street ILIKE '%Mariveles%'
    AND house_street ILIKE '%Bataan%'
)
UPDATE applicants a
SET address = COALESCE(a.address, a.house_street),
    house_street = NULLIF(
      btrim(
        array_to_string(
          (string_to_array(a.house_street, ','))[1:c.parts_len-3],
          ','
        )
      ),
      ''
    )
FROM candidates c
WHERE a.id = c.id
  AND c.parts_len >= 4;

UPDATE applicants
SET address = concat_ws(', ', house_street, barangay, 'Mariveles', 'Bataan')
WHERE address IS NULL
  AND house_street IS NOT NULL
  AND barangay IS NOT NULL;
