import axios from 'axios';

export function getApiErrorMessage(error: unknown, fallback: string): string {
    if (axios.isAxiosError(error)) {
        const message = error.response?.data?.message;
        if (typeof message === 'string' && message) return message;
        return error.message || fallback;
    }

    if (typeof error === 'object' && error && 'message' in error) {
        const message = String(error.message);
        if (message) return message;
    }

    return fallback;
}
