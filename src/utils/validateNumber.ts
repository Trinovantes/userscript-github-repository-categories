import { Message } from './Message'

export function validateNumber(n: number, label: string, min?: number, max?: number): Array<Message> {
    const errors: Array<Message> = []

    if (!Number.isInteger(n)) {
        errors.push({
            label: `${label} "${n}" is not an integer`,
            type: 'error',
        })
    }

    if (min !== undefined && n < min) {
        errors.push({
            label: `${label} "${n}" must be greater than ${min}`,
            type: 'error',
        })
    }

    if (max !== undefined && n > max) {
        errors.push({
            label: `${label} "${n}" must be less than ${max}`,
            type: 'error',
        })
    }

    return errors
}
