import { defineStore } from 'pinia'

export const HYDRATION_KEY = 'KEY_STATE'

// ----------------------------------------------------------------------------
// State
// ----------------------------------------------------------------------------

export type Category = {
    title: string
    regexp: string
    priority: number
}

export type State = {
    categories: Array<Category>
}

function createDefaultState(): State {
    const defaultState: State = {
        categories: [
            {
                title: 'Projects',
                regexp: '^(\\d+)?[A-Z]',
                priority: 0,
            },
            {
                title: 'Templates',
                regexp: '^template-',
                priority: 0,
            },
            {
                title: 'Userscripts',
                regexp: '^userscript-',
                priority: 0,
            },
            {
                title: 'GitHub Actions',
                regexp: '^action-',
                priority: 0,
            },
            {
                title: 'Issues',
                regexp: '^issue-',
                priority: 0,
            },
        ],
    }

    return defaultState
}

// ----------------------------------------------------------------------------
// Store
// ----------------------------------------------------------------------------

export const useStore = defineStore('Store', {
    state: createDefaultState,

    actions: {
        async load() {
            try {
                const stateString = await GM.getValue(HYDRATION_KEY, '{}')
                const parsedState = JSON.parse(stateString) as State
                this.$patch(parsedState)

                console.info(DEFINE.NAME, 'Store::load', parsedState)
            } catch (err) {
                console.warn(DEFINE.NAME, err)
            }
        },

        async save() {
            try {
                const stateString = JSON.stringify(this.$state)
                await GM.setValue(HYDRATION_KEY, stateString)
                console.info(DEFINE.NAME, 'Store::save', `'${stateString}'`)
            } catch (err) {
                console.warn(DEFINE.NAME, err)
            }
        },

        addCategory() {
            this.categories.push({
                title: '',
                regexp: '',
                priority: 0,
            })
        },

        deleteCategory(idx: number) {
            this.categories.splice(idx, 1)
        },

        moveCategoryUp(idx: number) {
            if (idx === 0) {
                return
            }

            const prev = this.categories[idx - 1]
            const target = this.categories[idx]

            this.categories = [
                ...this.categories.slice(0, idx - 1),
                target,
                prev,
                ...this.categories.slice(idx + 1),
            ]
        },

        moveCategoryDown(idx: number) {
            if (idx === this.categories.length - 1) {
                return
            }

            const target = this.categories[idx]
            const next = this.categories[idx + 1]

            this.categories = [
                ...this.categories.slice(0, idx),
                next,
                target,
                ...this.categories.slice(idx + 2),
            ]
        },
    },
})
