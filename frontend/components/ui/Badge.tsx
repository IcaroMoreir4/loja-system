import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';

interface BadgeProps {
    children: React.ReactNode;
    variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'success';
    style?: ViewStyle;
    textStyle?: TextStyle;
}

export function Badge({ children, variant = 'default', style, textStyle }: BadgeProps) {
    const getStyle = () => {
        switch (variant) {
            case 'secondary':
                return { bg: '#f4f4f5', text: '#18181b', border: 'transparent' };
            case 'destructive':
                return { bg: '#fef2f2', text: '#ef4444', border: '#fca5a5' };
            case 'success':
                return { bg: '#f0fdf4', text: '#16a34a', border: '#86efac' };
            case 'outline':
                return { bg: 'transparent', text: '#18181b', border: '#e4e4e7' };
            default:
                return { bg: '#18181b', text: '#fff', border: 'transparent' };
        }
    };

    const vStyle = getStyle();

    return (
        <View style={[styles.badge, { backgroundColor: vStyle.bg, borderColor: vStyle.border }, style]}>
            <Text style={[styles.text, { color: vStyle.text }, textStyle]}>
                {children}
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    badge: {
        paddingHorizontal: 10,
        paddingVertical: 2,
        borderRadius: 9999,
        borderWidth: 1,
        alignSelf: 'flex-start',
        justifyContent: 'center',
        alignItems: 'center',
    },
    text: {
        fontSize: 12,
        fontWeight: '600',
    }
});
