import { MAX_UI_WAIT_ATTEMPTS, UI_WAIT_TIME } from '../Constants.ts'
import { sleep } from './sleep.ts'

export async function waitDelayedPredicate(pred: () => boolean): Promise<void> {
    let attempts = 0
    while (attempts < MAX_UI_WAIT_ATTEMPTS) {
        // Exponential back off
        const delay = UI_WAIT_TIME * Math.pow(2, attempts)
        console.info(__NAME__, `Waiting ${delay}ms`)
        await sleep(delay)
        attempts += 1

        if (pred()) {
            return
        }
    }

    throw new Error('waitDelayedPredicate() reached max attempts')
}
