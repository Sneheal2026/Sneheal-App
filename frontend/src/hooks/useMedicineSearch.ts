import { useMemo } from 'react';
import { MEDICINES, type Medicine } from '@/constants/medicines';

const normalise = (value: string) => value.trim().toLowerCase();

/** Filters the local medicine catalogue by name, manufacturer or listed use. */
export const useMedicineSearch = (query: string): Medicine[] =>
  useMemo(() => {
    const term = normalise(query);
    if (!term) return [];

    return MEDICINES.filter((medicine) =>
      [medicine.name, medicine.manufacturer, ...medicine.uses].some((field) =>
        normalise(field).includes(term),
      ),
    );
  }, [query]);
