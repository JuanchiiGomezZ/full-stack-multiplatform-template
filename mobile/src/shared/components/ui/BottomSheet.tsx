import {
  BottomSheetModal,
  BottomSheetView,
  BottomSheetBackdrop,
  type BottomSheetBackdropProps,
} from "@gorhom/bottom-sheet";
import { useCallback, useEffect, useRef } from "react";
import type { ReactNode } from "react";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

interface BottomSheetProps {
  children: ReactNode;
  /** Controls whether the bottom sheet is open */
  isOpen: boolean;
  /** Called when the sheet is closed */
  onClose: () => void;
  /** Snap points for the bottom sheet. Default: ["50%"] */
  snapPoints?: (string | number)[];
  /** Enable dynamic sizing based on content. Default: false */
  enableDynamicSizing?: boolean;
  /**
   * The index of the snap point to show. Default: 0
   */
  index?: number;
}

export function BottomSheet({
  children,
  isOpen,
  onClose,
  snapPoints = ["50%"],
  enableDynamicSizing = false,
  index = 0,
}: BottomSheetProps) {
  const { theme } = useUnistyles();
  const bottomSheetRef = useRef<BottomSheetModal>(null);

  useEffect(() => {
    if (isOpen) {
      bottomSheetRef.current?.present();
    } else {
      bottomSheetRef.current?.dismiss();
    }
  }, [isOpen]);

  const handleDismiss = useCallback(() => {
    onClose();
  }, [onClose]);

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.5}
      />
    ),
    []
  );

  return (
    <BottomSheetModal
      ref={bottomSheetRef}
      snapPoints={enableDynamicSizing ? undefined : snapPoints}
      index={index}
      enableDynamicSizing={enableDynamicSizing}
      backdropComponent={renderBackdrop}
      onDismiss={handleDismiss}
      handleIndicatorStyle={{
        backgroundColor: theme.colors.muted,
        width: 40,
      }}
      backgroundStyle={{
        backgroundColor: theme.colors.background,
      }}
    >
      <BottomSheetView style={styles.content}>{children}</BottomSheetView>
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create((theme) => ({
  content: {
    flex: 1,
    paddingHorizontal: theme.spacing(6),
    paddingBottom: theme.spacing(6),
  },
}));
