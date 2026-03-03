import axios from 'axios';

// In Expo, localhost works for iOS simulator, but for Android emulator it's 10.0.2.2
// For web, it's localhost
import { Platform } from 'react-native';

const getBaseUrl = () => {
    // Apontando para o backend oficial na nuvem (Render)
    return 'https://loja-system.onrender.com/api';
};

export const api = axios.create({
    baseURL: getBaseUrl(),
    headers: {
        'Content-Type': 'application/json',
    },
});
