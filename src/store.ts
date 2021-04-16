/* eslint-disable no-use-before-define */

import { InjectionKey } from 'vue'
import { createStore, Store, useStore, MutationTree, ActionTree, CommitOptions, ActionContext, DispatchOptions } from 'vuex'
import { KEY_STATE } from '@/Constants'

// ----------------------------------------------------------------------------
// State
// ----------------------------------------------------------------------------

export interface Category {
    title: string
    regexp: string
    priority: number
}

export interface RootState {
    categories: Array<Category>
}

function createDefaultState(): RootState {
    const defaultState: RootState = {
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

export enum RootMutation {
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

type Mutations<S = RootState> = {
    [RootMutation.SET_STATE]: (state: S, replacement?: S) => void
    [RootMutation.ADD_CATEGORY]: (state: S) => void
    [RootMutation.DELETE_CATEGORY]: (state: S, idx?: number) => void
    [RootMutation.BUBBLE_CATEGORY]: (state: S, idx?: number) => void
    [RootMutation.SET_CATEGORY]: (state: S, payload?: SetCategoryPayload) => void
}

const mutations: MutationTree<RootState> & Mutations = {
    [RootMutation.SET_STATE]: (state: RootState, replacement?: RootState) => {
        console.info(DEFINE.NAME, RootMutation.SET_STATE)

        if (replacement === undefined) {
            throw new Error('Missing Payload')
        }

        Object.assign(state, replacement)
    },

    [RootMutation.ADD_CATEGORY]: (state: RootState) => {
        console.info(DEFINE.NAME, RootMutation.ADD_CATEGORY)

        state.categories.push({
            title: '',
            regexp: '',
            priority: 0,
        })
    },

    [RootMutation.DELETE_CATEGORY]: (state: RootState, idx?: number) => {
        console.info(DEFINE.NAME, RootMutation.DELETE_CATEGORY)

        if (idx === undefined) {
            throw new Error('Missing Payload')
        }

        state.categories.splice(idx, 1)
    },

    [RootMutation.BUBBLE_CATEGORY]: (state: RootState, idx?: number) => {
        console.info(DEFINE.NAME, RootMutation.BUBBLE_CATEGORY)

        if (idx === undefined) {
            throw new Error('Missing Payload')
        }

        const target = state.categories[idx]

        state.categories = [
            target,
            ...state.categories.filter((el) => el !== target),
        ]
    },

    [RootMutation.SET_CATEGORY]: (state: RootState, payload?: SetCategoryPayload) => {
        console.info(DEFINE.NAME, RootMutation.SET_CATEGORY)

        if (payload === undefined) {
            throw new Error('Missing Payload')
        }

        state.categories[payload.idx] = payload.category
    },
}

// ----------------------------------------------------------------------------
// Actions
// ----------------------------------------------------------------------------

export enum RootAction {
    LOAD = 'LOAD',
    SAVE = 'SAVE',
    RESET = 'RESET',
}

type AugmentedActionContext = {
    commit<K extends keyof Mutations>(
        key: K,
        payload?: Parameters<Mutations[K]>[1]
    ): ReturnType<Mutations[K]>
    dispatch<K extends keyof Actions>(
        key: K,
        payload?: Parameters<Actions[K]>[1]
    ): ReturnType<Actions[K]>
} & Omit<ActionContext<RootState, RootState>, 'commit' | 'dispatch'>

interface Actions {
    [RootAction.LOAD]: (context: AugmentedActionContext) => Promise<void>
    [RootAction.SAVE]: (context: AugmentedActionContext) => Promise<void>
    [RootAction.RESET]: (context: AugmentedActionContext) => Promise<void>
}

const actions: ActionTree<RootState, RootState> & Actions = {
    [RootAction.LOAD]: async({ commit }) => {
        try {
            const stateString = await GM.getValue(KEY_STATE, '{}') || '{}'
            const parsedState = JSON.parse(stateString) as RootState

            commit(RootMutation.SET_STATE, {
                ...createDefaultState(),
                ...parsedState,
            })

            console.info(DEFINE.NAME, RootAction.LOAD, parsedState)
        } catch (err) {
            console.warn(DEFINE.NAME, err)
        }
    },

    [RootAction.SAVE]: async({ state }) => {
        try {
            const stateString = JSON.stringify(state)
            await GM.setValue(KEY_STATE, stateString)
            console.info(DEFINE.NAME, RootAction.SAVE, `'${stateString}'`)
        } catch (err) {
            console.warn(DEFINE.NAME, err)
        }
    },

    [RootAction.RESET]: async({ commit, dispatch }) => {
        commit(RootMutation.SET_STATE, {
            ...createDefaultState(),
        })

        await dispatch(RootAction.SAVE)
    },
}

// ----------------------------------------------------------------------------
// TypeScript Helpers
// ----------------------------------------------------------------------------

export function createRootStore(): Store<RootState> {
    return createStore<RootState>({
        strict: DEFINE.IS_DEV,

        state: createDefaultState,
        mutations,
        actions,
    })
}

export type TypedStore = Omit<Store<RootState>, 'commit' | 'dispatch'> & {
    commit<K extends keyof Mutations, P extends Parameters<Mutations[K]>[1]>(
        key: K,
        payload?: P,
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
