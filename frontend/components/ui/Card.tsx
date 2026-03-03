import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';

export function Card({ children, style }: { children: React.ReactNode, style?: ViewStyle }) {
    return <View style={[styles.card, style]}>{children}</View>;
}

export function CardHeader({ children, style }: { children: React.ReactNode, style?: ViewStyle }) {
    return <View style={[styles.header, style]}>{children}</View>;
}

export function CardTitle({ children, style }: { children: React.ReactNode, style?: import('react-native').TextStyle }) {
    return <Text style={[styles.title, style]}>{children}</Text>;
}

export function CardContent({ children, style }: { children: React.ReactNode, style?: ViewStyle }) {
    return <View style={[styles.content, style]}>{children}</View>;
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#ffffff',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e4e4e7',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 2,
        overflow: 'hidden',
    },
    header: {
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f4f4f5',
    },
    title: {
        fontSize: 18,
        fontWeight: '600',
        color: '#09090b',
    },
    content: {
        padding: 16,
    }
});
