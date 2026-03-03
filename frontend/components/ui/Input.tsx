import React, { useState } from 'react';
import { TextInput, StyleSheet, TextInputProps, View, Text } from 'react-native';

interface InputProps extends TextInputProps {
    label?: string;
    error?: string;
}

export function Input({ label, error, style, ...props }: InputProps) {
    const [isFocused, setIsFocused] = useState(false);

    return (
        <View style={styles.container}>
            {label && <Text style={styles.label}>{label}</Text>}
            <TextInput
                style={[
                    styles.input,
                    isFocused && styles.inputFocused,
                    error && styles.inputError,
                    style
                ]}
                onFocus={(e) => {
                    setIsFocused(true);
                    props.onFocus && props.onFocus(e);
                }}
                onBlur={(e) => {
                    setIsFocused(false);
                    props.onBlur && props.onBlur(e);
                }}
                placeholderTextColor="#a1a1aa"
                {...props}
            />
            {error && <Text style={styles.errorText}>{error}</Text>}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: 16,
    },
    label: {
        fontSize: 14,
        fontWeight: '500',
        color: '#09090b',
        marginBottom: 6,
    },
    input: {
        height: 48,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#e4e4e7',
        borderRadius: 8,
        paddingHorizontal: 16,
        fontSize: 16,
        color: '#09090b',
    },
    inputFocused: {
        borderColor: '#18181b',
    },
    inputError: {
        borderColor: '#ef4444',
    },
    errorText: {
        fontSize: 12,
        color: '#ef4444',
        marginTop: 4,
    }
});
