import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';
import type { ScannedMedicine, ImageType } from '@/types/prescription';
import type { PickedImage } from '@/utils/imagePicker';

export interface ScanDraft {
  pickedImage: PickedImage;
  medicines: ScannedMedicine[];
  hasScanned: boolean;
  imageType: ImageType;
  scanError: string | null;
  isSaved: boolean;
}

type ScanDraftContextValue = {
  draft: ScanDraft | null;
  hasActiveDraft: boolean;
  setDraft: (draft: ScanDraft) => void;
  clearDraft: () => void;
};

const ScanDraftContext = createContext<ScanDraftContextValue | null>(null);

export const ScanDraftProvider = ({ children }: { children: React.ReactNode }) => {
  const [draft, setDraftState] = useState<ScanDraft | null>(null);

  const setDraft = useCallback((next: ScanDraft) => {
    setDraftState(next);
  }, []);

  const clearDraft = useCallback(() => {
    setDraftState(null);
  }, []);

  const hasActiveDraft = draft?.pickedImage != null;

  const value = useMemo(
    () => ({
      draft,
      hasActiveDraft,
      setDraft,
      clearDraft,
    }),
    [clearDraft, draft, hasActiveDraft, setDraft],
  );

  return <ScanDraftContext.Provider value={value}>{children}</ScanDraftContext.Provider>;
};

export const useScanDraft = (): ScanDraftContextValue => {
  const ctx = useContext(ScanDraftContext);
  if (!ctx) {
    throw new Error('useScanDraft must be used within ScanDraftProvider');
  }
  return ctx;
};
