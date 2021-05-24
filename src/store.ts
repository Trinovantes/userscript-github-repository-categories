import { InjectionKey } from 'vue'
import { createStore as _createStore, Store, useStore, MutationTree, ActionTree, CommitOptions, ActionContext, DispatchOptions } from 'vuex'
import { KEY_STATE } from '@/Constants'

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
// Mutations
// ----------------------------------------------------------------------------

export enum Mutation {
    SET_STATE = 'SET_STATE',
    ADD_CATEGORY = 'ADD_CATEGORY',
    DELETE_CATEGORY = 'DELETE_CATEGORY',
    BUBBLE_CATEGORY = 'BUBBLE_CATEGORY',
    SET_CATEGORY = 'SET_CATEGORY',
}

export interface SetCategoryPayload {
    idx: number
    category: Category
}

interface Mutations {
    [Mutation.SET_STATE]: (state: State, replacement?: State) => void
    [Mutation.ADD_CATEGORY]: (state: State) => void
    [Mutation.DELETE_CATEGORY]: (state: State, idx?: number) => void
    [Mutation.BUBBLE_CATEGORY]: (state: State, idx?: number) => void
    [Mutation.SET_CATEGORY]: (state: State, payload?: SetCategoryPayload) => void
}

const mutations: MutationTree<State> & Mutations = {
    [Mutation.SET_STATE]: (state: State, replacement?: State) => {
        console.info(DEFINE.NAME, Mutation.SET_STATE)

        if (replacement === undefined) {
            throw new Error('Missing Payload')
        }

        Object.assign(state, replacement)
    },

    [Mutation.ADD_CATEGORY]: (state: State) => {
        console.info(DEFINE.NAME, Mutation.ADD_CATEGORY)

        state.categories.push({
            title: '',
            regexp: '',
            priority: 0,
        })
    },

    [Mutation.DELETE_CATEGORY]: (state: State, idx?: number) => {
        console.info(DEFINE.NAME, Mutation.DELETE_CATEGORY)

        if (idx === undefined) {
            throw new Error('Missing Payload')
        }

        state.categories.splice(idx, 1)
    },

    [Mutation.BUBBLE_CATEGORY]: (state: State, idx?: number) => {
        console.info(DEFINE.NAME, Mutation.BUBBLE_CATEGORY)

        if (idx === undefined) {
            throw new Error('Missing Payload')
        }

        const target = state.categories[idx]

        state.categories = [
            target,
            ...state.categories.filter((el) => el !== target),
        ]
    },

    [Mutation.SET_CATEGORY]: (state: State, payload?: SetCategoryPayload) => {
        console.info(DEFINE.NAME, Mutation.SET_CATEGORY)

        if (payload === undefined) {
            throw new Error('Missing Payload')
        }

        state.categories[payload.idx] = payload.category
    },
}

// ----------------------------------------------------------------------------
// Actions
// ----------------------------------------------------------------------------

export enum Action {
    LOAD = 'LOAD',
    SAVE = 'SAVE',
    RESET = 'RESET',
}

type TypedActionContext = Omit<ActionContext<State, State>, 'commit' | 'dispatch' | 'getters' | 'rootState' | 'rootGetters'> & {
    commit<K extends keyof Mutations>(
        key: K,
        payload?: Parameters<Mutations[K]>[1]
    ): ReturnType<Mutations[K]>

    // eslint-disable-next-line no-use-before-define
    dispatch<K extends keyof Actions>(
        key: K,
        // eslint-disable-next-line no-use-before-define
        payload?: Parameters<Actions[K]>[1]
    // eslint-disable-next-line no-use-before-define
    ): ReturnType<Actions[K]>
}

interface Actions {
    [Action.LOAD]: (context: TypedActionContext) => Promise<void>
    [Action.SAVE]: (context: TypedActionContext) => Promise<void>
    [Action.RESET]: (context: TypedActionContext) => Promise<void>
}

const actions: ActionTree<State, State> & Actions = {
    [Action.LOAD]: async({ commit }) => {
        try {
            const stateString = await GM.getValue(KEY_STATE, '{}') || '{}'
            const parsedState = JSON.parse(stateString) as State

            commit(Mutation.SET_STATE, {
                ...createDefaultState(),
                ...parsedState,
            })

            console.info(DEFINE.NAME, Action.LOAD, parsedState)
        } catch (err) {
            console.warn(DEFINE.NAME, err)
        }
    },

    [Action.SAVE]: async({ state }) => {
        try {
            const stateString = JSON.stringify(state)
            await GM.setValue(KEY_STATE, stateString)
            console.info(DEFINE.NAME, Action.SAVE, `'${stateString}'`)
        } catch (err) {
            console.warn(DEFINE.NAME, err)
        }
    },

    [Action.RESET]: async({ commit, dispatch }) => {
        commit(Mutation.SET_STATE, {
            ...createDefaultState(),
        })

        await dispatch(Action.SAVE)
    },
}

// ----------------------------------------------------------------------------
// TypeScript Helpers
// ----------------------------------------------------------------------------

export function createStore(): Store<State> {
    return _createStore<State>({
        strict: DEFINE.IS_DEV,

        state: createDefaultState,
        mutations,
        actions,
    })
}

type TypedStore = Omit<Store<State>, 'commit' | 'dispatch' | 'getters'> & {
    commit<K extends keyof Mutations>(
        key: K,
        payload?: Parameters<Mutations[K]>[1],
        options?: CommitOptions
    ): ReturnType<Mutations[K]>
} & {
    dispatch<K extends keyof Actions>(
        key: K,
        payload?: Parameters<Actions[K]>[1],
        options?: DispatchOptions
    ): ReturnType<Actions[K]>
}

export const key: InjectionKey<TypedStore> = Symbol('Vuex InjectionKey')

export function useTypedStore(): TypedStore {
    return useStore(key)
}
