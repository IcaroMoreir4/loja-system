import React, { useRef, useState } from 'react';
import { Pressable, Text, StyleSheet, Animated, ViewStyle, TextStyle } from 'react-native';

interface ButtonProps {
    onPress: () => void;
    title: string;
    variant?: 'default' | 'destructive' | 'outline' | 'ghost' | 'secondary';
    style?: ViewStyle;
    textStyle?: TextStyle;
    disabled?: boolean;
}

export function Button({ onPress, title, variant = 'default', style, textStyle, disabled }: ButtonProps) {
    const scaleAnim = useRef(new Animated.Value(1)).current;

    const handlePressIn = () => {
        Animated.spring(scaleAnim, {
            toValue: 0.95,
            useNativeDriver: true,
        }).start();
    };

    const handlePressOut = () => {
        Animated.spring(scaleAnim, {
            toValue: 1,
            useNativeDriver: true,
        }).start();
    };

    const getVariantStyles = () => {
        switch (variant) {
            case 'destructive':
                return { bg: '#ef4444', text: '#fff', border: 'transparent' };
            case 'outline':
                return { bg: 'transparent', text: '#18181b', border: '#e4e4e7' };
            case 'ghost':
                return { bg: 'transparent', text: '#18181b', border: 'transparent' };
            case 'secondary':
                return { bg: '#f4f4f5', text: '#18181b', border: 'transparent' };
            default:
                return { bg: '#18181b', text: '#fff', border: 'transparent' };
        }
    };

    const vStyle = getVariantStyles();

    return (
        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
            <Pressable
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                onPress={onPress}
                disabled={disabled}
                style={({ pressed, hovered }: any) => [
                    styles.button,
                    {
                        backgroundColor: vStyle.bg,
                        borderColor: vStyle.border,
                        opacity: disabled ? 0.5 : (pressed ? 0.8 : (hovered ? 0.9 : 1))
                    },
                    style
                ]}
            >
                <Text style={[styles.text, { color: vStyle.text }, textStyle]}>{title}</Text>
            </Pressable>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    button: {
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 8,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
    },
    text: {
        fontSize: 14,
        fontWeight: '600',
    }
});
