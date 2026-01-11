import React from "react";
import { View, RefreshControl } from "react-native";
import {
  FlashList,
  type FlashListProps,
  type ListRenderItem,
} from "@shopify/flash-list";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import { Spinner } from "./Spinner";
import { EmptyState, EmptyStateProps } from "./EmptyState";
import { ErrorState, ErrorStateProps } from "./ErrorState";

// ==================== TYPES ====================

interface ListProps<T> extends Omit<FlashListProps<T>, "renderItem" | "data"> {
  /** List data */
  data: T[];
  /** Render function for each item */
  renderItem: ListRenderItem<T>;
  /** Loading state - shows spinner */
  isLoading?: boolean;
  /** Error state - shows error component */
  isError?: boolean;
  /** Refreshing state for pull-to-refresh */
  isRefreshing?: boolean;
  /** Pull-to-refresh callback */
  onRefresh?: () => void;
  /** Empty state configuration (pass false to hide) */
  emptyState?: EmptyStateProps | false;
  /** Error state configuration */
  errorState?: ErrorStateProps;
  /** Spacing between items (default: 12) */
  itemSpacing?: number;
}

// ==================== STYLES ====================

const styles = StyleSheet.create((theme) => ({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: theme.spacing(12),
  },
  separator: {
    height: theme.spacing(3),
  },
}));

// ==================== SEPARATOR ====================

function ItemSeparator({ spacing }: { spacing?: number }) {
  return <View style={spacing ? { height: spacing } : styles.separator} />;
}

// ==================== COMPONENT ====================

function ListInner<T>(
  {
    data,
    renderItem,
    isLoading = false,
    isError = false,
    isRefreshing = false,
    onRefresh,
    emptyState,
    errorState,
    keyExtractor,
    itemSpacing,
    ItemSeparatorComponent,
    ...flashListProps
  }: ListProps<T>,
  ref: React.ForwardedRef<React.ComponentRef<typeof FlashList<T>>>
) {
  const { theme } = useUnistyles();

  // Loading state - show spinner
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Spinner size="lg" />
      </View>
    );
  }

  // Error state - show error component
  if (isError) {
    return (
      <ErrorState
        type={errorState?.type}
        title={errorState?.title}
        message={errorState?.message}
        onRetry={errorState?.onRetry}
        retryLabel={errorState?.retryLabel}
        onAction={errorState?.onAction}
        actionLabel={errorState?.actionLabel}
        size={errorState?.size}
      />
    );
  }

  // Empty state - show empty component when no data
  const ListEmptyComponent = () => {
    if (emptyState === false) return null;
    if (!emptyState) return null;

    return (
      <EmptyState
        icon={emptyState.icon}
        title={emptyState.title}
        description={emptyState.description}
        actionLabel={emptyState.actionLabel}
        onAction={emptyState.onAction}
        secondaryActionLabel={emptyState.secondaryActionLabel}
        onSecondaryAction={emptyState.onSecondaryAction}
        variant={emptyState.variant}
        size={emptyState.size}
      />
    );
  };

  // Refresh control
  const refreshControl = onRefresh ? (
    <RefreshControl
      refreshing={isRefreshing}
      onRefresh={onRefresh}
      colors={[theme.colors.primary]}
      tintColor={theme.colors.primary}
    />
  ) : undefined;

  // Default key extractor
  const defaultKeyExtractor = (item: T, index: number): string => {
    if (keyExtractor) return keyExtractor(item, index);
    const itemAny = item as Record<string, unknown>;
    if (itemAny.id) return String(itemAny.id);
    if (itemAny._id) return String(itemAny._id);
    return String(index);
  };

  // Separator component - use custom or default with spacing
  const Separator =
    ItemSeparatorComponent ?? (() => <ItemSeparator spacing={itemSpacing} />);

  return (
    <View style={styles.container}>
      <FlashList
        ref={ref}
        data={data}
        renderItem={renderItem}
        keyExtractor={defaultKeyExtractor}
        ListEmptyComponent={ListEmptyComponent}
        ItemSeparatorComponent={Separator}
        refreshControl={refreshControl}
        {...flashListProps}
      />
    </View>
  );
}

// Export as a forwardRef component with correct generic typing
export const List = React.forwardRef(ListInner) as <T>(
  props: ListProps<T> & {
    ref?: React.ForwardedRef<React.ComponentRef<typeof FlashList<T>>>;
  }
) => React.ReactElement;

// ==================== EXPORTS ====================

export type { ListProps };
