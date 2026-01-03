import * as React from 'react';
import { View, Text, Pressable, Platform, TouchableWithoutFeedback, ActivityIndicator } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { Typography } from '@/constants/Typography';
import { hapticsLight } from './haptics';
import { FloatingOverlay } from './FloatingOverlay';
import { Image } from 'expo-image';
import { Octicons } from '@expo/vector-icons';
import type { Model } from '@/sync/storageTypes';

interface ModelSelectorModalProps {
    visible: boolean;
    models: Model[];
    selectedModelId?: string;
    onSelect: (modelId: string) => void;
    onClose: () => void;
    isLoading?: boolean;
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
        paddingVertical: 12,
        minHeight: 48,
    },
    itemPressed: {
        backgroundColor: theme.colors.surfacePressed,
    },
    itemIcon: {
        width: 20,
        height: 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
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
    loadingContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 32,
    },
}));

// Provider icon mapping
const getProviderIcon = (provider: Model['provider']): React.ReactNode => {
    switch (provider) {
        case 'anthropic':
            return (
                <Image
                    source={require('@/assets/images/icon-claude.png')}
                    style={{ width: 16, height: 16 }}
                />
            );
        case 'openai':
            return <Octicons name="cpu" size={16} color="#10a37f" />;
        case 'google':
            return <Octicons name="cpu" size={16} color="#4285f4" />;
        default:
            return <Octicons name="cpu" size={16} color="gray" />;
    }
};

export const ModelSelectorModal = React.memo<ModelSelectorModalProps>((props) => {
    const styles = stylesheet;
    const { theme } = useUnistyles();

    const handleSelect = React.useCallback((model: Model) => {
        hapticsLight();
        props.onSelect(model.id);
    }, [props.onSelect]);

    if (!props.visible) return null;

    const isEmpty = props.models.length === 0;

    return (
        <>
            <TouchableWithoutFeedback onPress={props.onClose}>
                <View style={styles.backdrop} />
            </TouchableWithoutFeedback>

            <FloatingOverlay
                maxHeight={280}
                keyboardShouldPersistTaps="always"
            >
                <View style={styles.container}>
                    <Text style={styles.title}>Select Model</Text>

                    {props.isLoading ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="small" color={theme.colors.button.primary.tint} />
                        </View>
                    ) : isEmpty ? (
                        <View style={styles.emptyContainer}>
                            <View style={styles.emptyIcon}>
                                <Octicons name="cpu" size={32} color={theme.colors.textSecondary} />
                            </View>
                            <Text style={styles.emptyText}>
                                Configure models in CLI
                            </Text>
                        </View>
                    ) : (
                        props.models.map((model) => {
                            const isSelected = model.id === props.selectedModel;

                            return (
                                <Pressable
                                    key={model.id}
                                    onPress={() => handleSelect(model)}
                                    style={({ pressed }) => [
                                        styles.item,
                                        pressed && styles.itemPressed,
                                    ]}
                                >
                                    <View style={styles.itemIcon}>
                                        {getProviderIcon(model.provider)}
                                    </View>

                                    <Text
                                        style={[
                                            styles.itemLabel,
                                            isSelected && styles.itemLabelSelected,
                                        ]}
                                        numberOfLines={1}
                                    >
                                        {model.name}
                                    </Text>

                                    <View style={[
                                        styles.radio,
                                        isSelected ? styles.radioActive : styles.radioInactive
                                    ]}>
                                        {isSelected && <View style={styles.radioDot} />}
                                    </View>
                                </Pressable>
                            );
                        })
                    )}
                </View>
            </FloatingOverlay>
        </>
    );
});

ModelSelectorModal.displayName = 'ModelSelectorModal';
