import React, { useCallback } from "react";
import { ScrollView, useWindowDimensions } from "react-native";
import { BottomSheet } from "@/animations";
import TagCreatorForm from "./TagCreatorForm";
import type { NewTag } from "./TagCreatorForm";

interface TagCreatorProps {
  visible: boolean;
  onClose: () => void;
  onSave: (data: NewTag) => Promise<void> | void;
  onImportZipAlbum?: () => Promise<void> | void;
}

export default function TagCreator({
  visible,
  onClose,
  onSave,
  onImportZipAlbum,
}: TagCreatorProps) {
  const { height: screenHeight } = useWindowDimensions();
  const bottomInset = screenHeight * 0.15;

  const handleSave = useCallback(
    async (data: NewTag): Promise<void> => {
      await onSave(data);
    },
    [onSave],
  );

  return (
    <BottomSheet visible={visible} onClose={onClose} title="Nueva etiqueta">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: bottomInset }}
        keyboardShouldPersistTaps="handled"
      >
        <TagCreatorForm
          onSave={handleSave}
          {...(onImportZipAlbum ? { onImportZipAlbum } : {})}
        />
      </ScrollView>
    </BottomSheet>
  );
}
