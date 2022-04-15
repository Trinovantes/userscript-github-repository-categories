import { KEY_STATE } from '@/Constants'
import { defineStore } from 'pinia'

// ----------------------------------------------------------------------------
// State
// ----------------------------------------------------------------------------

export interface Category {
    title: string
    regexp: string
    priority: number
}

export interface State {
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
            {
                title: 'School',
                regexp: '^[A-Z]+([\\d]+)-',
                priority: 1,
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
                const stateString = await GM.getValue(KEY_STATE, '{}') || '{}'
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
                await GM.setValue(KEY_STATE, stateString)
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

        bubbleCategory(idx: number) {
            const target = this.categories[idx]

            this.categories = [
                target,
                ...this.categories.filter((el) => el !== target),
            ]
        },
    },
})
