import * as React from 'react';
import { View, Text, Pressable, Platform, TouchableWithoutFeedback } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { Typography } from '@/constants/Typography';
import { hapticsLight } from './haptics';
import { FloatingOverlay } from './FloatingOverlay';

export interface CommandItem {
    id: string;
    label: string;
    icon?: React.ReactNode;
}

interface CommandPaletteProps {
    visible: boolean;
    title: string;
    items: CommandItem[];
    selectedIndex: number;
    onSelect: (index: number) => void;
    onClose: () => void;
    maxHeight?: number;
    emptyMessage?: string;
    emptyIcon?: React.ReactNode;
}

const stylesheet = StyleSheet.create((theme, runtime) => ({
    backdrop: {
        position: 'absolute',
        top: -1000,
        left: -1000,
        right: -1000,
        bottom: -1000,
        zIndex: 999,
    },
    container: {
        backgroundColor: theme.colors.input.background,
        borderRadius: Platform.select({ default: 16, android: 20 }),
        overflow: 'hidden',
        paddingTop: 8,
        paddingBottom: 8,
    },
    title: {
        fontSize: 12,
        fontWeight: '600',
        color: theme.colors.textSecondary,
        paddingHorizontal: 16,
        paddingBottom: 8,
        ...Typography.default('semiBold'),
    },
    item: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10,
        minHeight: 44,
    },
    itemPressed: {
        backgroundColor: theme.colors.surfacePressed,
    },
    itemIcon: {
        marginRight: 12,
        width: 20,
        height: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    itemLabel: {
        fontSize: 15,
        flex: 1,
        ...Typography.default(),
    },
    itemLabelSelected: {
        color: theme.colors.radio.active,
        fontWeight: '600',
    },
    radio: {
        width: 16,
        height: 16,
        borderRadius: 8,
        borderWidth: 2,
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 8,
    },
    radioActive: {
        borderColor: theme.colors.radio.active,
    },
    radioInactive: {
        borderColor: theme.colors.radio.inactive,
    },
    radioDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: theme.colors.radio.dot,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 32,
        paddingHorizontal: 16,
    },
    emptyIcon: {
        marginBottom: 12,
    },
    emptyText: {
        fontSize: 14,
        color: theme.colors.textSecondary,
        textAlign: 'center',
        ...Typography.default(),
    },
}));

export const CommandPalette = React.memo<CommandPaletteProps>((props) => {
    const styles = stylesheet;
    const { theme } = useUnistyles();

    const handleSelect = React.useCallback((index: number) => {
        hapticsLight();
        props.onSelect(index);
    }, [props.onSelect]);

    const handleKeyPress = React.useCallback((event: React.KeyboardEvent) => {
        if (!props.visible) return;

        if (event.key === 'Escape') {
            props.onClose();
        } else if (event.key === 'ArrowUp') {
            event.preventDefault();
            const newIndex = props.selectedIndex > 0 ? props.selectedIndex - 1 : props.items.length - 1;
            props.onSelect(newIndex);
        } else if (event.key === 'ArrowDown') {
            event.preventDefault();
            const newIndex = (props.selectedIndex + 1) % props.items.length;
            props.onSelect(newIndex);
        } else if (event.key === 'Enter' && props.items.length > 0) {
            event.preventDefault();
            handleSelect(props.selectedIndex);
        }
    }, [props.visible, props.selectedIndex, props.items.length, handleSelect, props.onSelect, props.onClose]);

    React.useEffect(() => {
        if (props.visible) {
            document.addEventListener('keydown', handleKeyPress);
            return () => document.removeEventListener('keydown', handleKeyPress);
        }
    }, [props.visible, handleKeyPress]);

    if (!props.visible) return null;

    const isEmpty = props.items.length === 0;

    return (
        <>
            <TouchableWithoutFeedback onPress={props.onClose}>
                <View style={styles.backdrop} />
            </TouchableWithoutFeedback>

            <FloatingOverlay
                maxHeight={props.maxHeight ?? 280}
                keyboardShouldPersistTaps="always"
            >
                <View style={styles.container}>
                    {props.title && (
                        <Text style={styles.title}>{props.title}</Text>
                    )}

                    {isEmpty ? (
                        <View style={styles.emptyContainer}>
                            {props.emptyIcon && <View style={styles.emptyIcon}>{props.emptyIcon}</View>}
                            <Text style={styles.emptyText}>
                                {props.emptyMessage || 'No items available'}
                            </Text>
                        </View>
                    ) : (
                        props.items.map((item, index) => {
                            const isSelected = index === props.selectedIndex;

                            return (
                                <Pressable
                                    key={item.id}
                                    onPress={() => handleSelect(index)}
                                    style={({ pressed }) => [
                                        styles.item,
                                        pressed && styles.itemPressed,
                                    ]}
                                >
                                    {item.icon && (
                                        <View style={styles.itemIcon}>
                                            {item.icon}
                                        </View>
                                    )}

                                    <Text
                                        style={[
                                            styles.itemLabel,
                                            isSelected && styles.itemLabelSelected,
                                        ]}
                                        numberOfLines={1}
                                    >
                                        {item.label}
                                    </Text>

                                    {isSelected && (
                                        <View style={[
                                            styles.radio,
                                            isSelected ? styles.radioActive : styles.radioInactive
                                        ]}>
                                            {isSelected && <View style={styles.radioDot} />}
                                        </View>
                                    )}
                                </Pressable>
                            );
                        })
                    )}
                </View>
            </FloatingOverlay>
        </>
    );
});

CommandPalette.displayName = 'CommandPalette';
