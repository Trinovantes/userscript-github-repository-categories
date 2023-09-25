import { Message } from './Message'

export function validateRegex(regexp: string): Message | null {
    try {
        RegExp(regexp)
        return null
    } catch (err) {
        const error = err as Error
        return {
            label: error.message,
            type: 'error',
        }
    }
}
