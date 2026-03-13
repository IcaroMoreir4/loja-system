import axios from 'axios';

// In Expo, localhost works for iOS simulator, but for Android emulator it's 10.0.2.2
// For web, it's localhost
import { Platform } from 'react-native';

const getBaseUrl = () => {
    const envBaseUrl = process.env.EXPO_PUBLIC_API_URL;
    if (envBaseUrl) {
        return envBaseUrl;
    }

    // Web: usa o hostname atual para evitar mismatch entre localhost/127.0.0.1/LAN IP
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
        return `http://${window.location.hostname}:8000/api`;
    }

    // Desenvolvimento local (native/simuladores)
    if (process.env.NODE_ENV === 'development') {
        return 'http://127.0.0.1:8000/api';
    }

    return 'https://loja-system.onrender.com/api';
};

export const api = axios.create({
    baseURL: getBaseUrl(),
    headers: {
        'Content-Type': 'application/json',
    },
});
