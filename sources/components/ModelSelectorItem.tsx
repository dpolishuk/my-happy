import * as React from 'react';
import { View, Text } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { Typography } from '@/constants/Typography';
import { Image } from 'expo-image';
import { Octicons } from '@expo/vector-icons';

export interface Model {
    id: string;
    name: string;
    provider: 'anthropic' | 'openai' | 'google' | 'other';
}

interface ModelSelectorItemProps {
    model: Model;
    isSelected?: boolean;
}

const stylesheet = StyleSheet.create((theme, runtime) => ({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 16,
        minHeight: 44,
    },
    iconContainer: {
        width: 20,
        height: 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    providerIcon: {
        width: 16,
        height: 16,
    },
    fallbackIcon: {
        fontSize: 16,
    },
    labelContainer: {
        flex: 1,
    },
    label: {
        fontSize: 15,
        ...Typography.default(),
    },
    labelSelected: {
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
        borderColor: (theme, runtime) => theme.colors.radio.active,
    },
    radioInactive: {
        borderColor: (theme, runtime) => theme.colors.radio.inactive,
    },
    radioDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: (theme, runtime) => theme.colors.radio.dot,
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
            return (
                <Octicons name="cpu" size={16} color="#10a37f" />
            );
        case 'google':
            return (
                <Octicons name="cpu" size={16} color="#4285f4" />
            );
        default:
            return (
                <Octicons name="cpu" size={16} color="gray" />
            );
    }
};

export const ModelSelectorItem = React.memo<ModelSelectorItemProps>((props) => {
    const styles = stylesheet;
    const { theme } = useUnistyles();

    const providerIcon = getProviderIcon(props.model.provider);

    return (
        <View style={styles.container}>
            <View style={styles.iconContainer}>
                {providerIcon}
            </View>

            <View style={styles.labelContainer}>
                <Text
                    style={[
                        styles.label,
                        props.isSelected && styles.labelSelected,
                        props.isSelected && { color: theme.colors.radio.active },
                    ]}
                    numberOfLines={1}
                >
                    {props.model.name}
                </Text>
            </View>

            {props.isSelected !== undefined && (
                <View style={[
                    styles.radio,
                    props.isSelected ? styles.radioActive : styles.radioInactive
                ]}>
                    {props.isSelected && <View style={styles.radioDot} />}
                </View>
            )}
        </View>
    );
});

ModelSelectorItem.displayName = 'ModelSelectorItem';
