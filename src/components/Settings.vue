<template>
    <div class="group">
        <div
            v-for="[idx, message] of Object.entries(messages)"
            :key="idx"
            :class="`message ${message.type}`"
        >
            {{ message.label }}
        </div>

        <h3>Categories</h3>
        <table>
            <thead>
                <tr>
                    <td />
                    <td>Title</td>
                    <td>RegExp</td>
                    <td>Priority</td>
                    <td />
                </tr>
            </thead>
            <tbody>
                <tr
                    v-for="[idx, category] of Object.entries(categories)"
                    :key="idx"
                    class="category"
                >
                    <td>
                        <a
                            class="bubble"
                            title="Bubble category to top"
                            @click="bubbleCategory(idx)"
                        >
                            Bubble
                        </a>
                    </td>
                    <td>
                        <input
                            type="text"
                            :value="category.title"
                            @input="(val) => setCategoryTitle(idx, val)"
                        >
                    </td>
                    <td>
                        <input
                            type="text"
                            spellcheck="false"
                            :value="category.regexp"
                            @input="(val) => setCategoryRegex(idx, val)"
                        >
                    </td>
                    <td>
                        <input
                            type="number"
                            title="Higher priority RegExp will be checked first"
                            placeholder="Priority"
                            :value="category.priority"
                            @input="(val) => setCategoryPriority(idx, val)"
                        >
                    </td>
                    <td>
                        <a
                            class="delete"
                            title="Delete category"
                            @click="deleteCategory(idx)"
                        >
                            Delete
                        </a>
                    </td>
                </tr>
            </tbody>
        </table>

        <a
            class="btn"
            @click="addCategory"
        >
            Add Category
        </a>
    </div>

    <div class="group actions">
        <a
            class="btn positive"
            @click="onSave"
        >
            Save
        </a>
        <a
            class="btn"
            @click="onReset"
        >
            Reset to Defaults
        </a>
        <div class="hspace" />
        <a
            class="btn"
            @click="onClose"
        >
            Close
        </a>
    </div>
</template>

<script lang="ts">
import { RootAction, RootMutation, useTypedStore } from '@/store'
import { computed, defineComponent, onMounted, ref } from 'vue'

interface Message {
    label: string
    type: string
}

export default defineComponent({
    emits: [
        'close',
    ],

    setup(props, { emit }) {
        const store = useTypedStore()
        const messages = ref<Array<Message>>([])

        onMounted(async() => {
            await store.dispatch(RootAction.LOAD)
        })

        const categories = computed(() => store.state.categories)

        const addCategory = () => {
            store.commit(RootMutation.ADD_CATEGORY)
        }

        const deleteCategory = (idx: number) => {
            store.commit(RootMutation.DELETE_CATEGORY, idx)
        }

        const bubbleCategory = (idx: number) => {
            store.commit(RootMutation.BUBBLE_CATEGORY, idx)
        }

        const setCategoryTitle = (idx: number, event: InputEvent) => {
            store.commit(RootMutation.SET_CATEGORY, {
                idx,
                category: {
                    ...categories.value[idx],
                    title: (event.target as HTMLInputElement).value,
                },
            })
        }

        const setCategoryRegex = (idx: number, event: InputEvent) => {
            store.commit(RootMutation.SET_CATEGORY, {
                idx,
                category: {
                    ...categories.value[idx],
                    regexp: (event.target as HTMLInputElement).value,
                },
            })
        }

        const setCategoryPriority = (idx: number, event: InputEvent) => {
            const priority = parseInt((event.target as HTMLInputElement).value)
            store.commit(RootMutation.SET_CATEGORY, {
                idx,
                category: {
                    ...categories.value[idx],
                    priority,
                },
            })
        }

        const onSave = async() => {
            messages.value = []

            for (const category of categories.value) {
                const regexError = validateRegex(category.regexp)
                if (regexError) {
                    messages.value.push(regexError)
                }

                const priorityErrors = validateNumber(category.priority, 'Priority')
                if (priorityErrors.length > 0) {
                    messages.value = [
                        ...messages.value,
                        ...priorityErrors,
                    ]
                }
            }

            // Check if validators found any problems
            if (messages.value.length > 0) {
                return
            }

            await store.dispatch(RootAction.SAVE)
            messages.value.push({
                label: 'Saved',
                type: 'success',
            })
        }

        const onReset = async() => {
            await store.dispatch(RootAction.RESET)
            messages.value.push({
                label: 'Successfully resetted everything to defaults',
                type: 'success',
            })
        }

        const onClose = () => {
            emit('close')
        }

        return {
            messages,

            categories,
            addCategory,
            bubbleCategory,
            deleteCategory,
            setCategoryTitle,
            setCategoryRegex,
            setCategoryPriority,

            onSave,
            onReset,
            onClose,
        }
    },
})

function validateNumber(n: number, label: string, min?: number, max?: number): Array<Message> {
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

function validateRegex(regexp: string): Message | null {
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
</script>

<style lang="scss" scoped>
.message{
    @extend .margins;

    padding: ($padding / 2) $padding;

    &.error{
        background: darkred;
        color: white;
    }

    &.success{
        background: darkgreen;
        color: white;
    }
}

.group{
    border-top: $border;
    padding: $padding 0;

    &:last-child{
        padding-bottom: 0;
    }
}

.actions{
    display: flex;
    gap: $padding / 2;

    .hspace{
        flex: 1;
    }
}

input{
    border: $border;
    border-radius: $border-radius;
    padding: $padding / 4;

    &:focus{
        border-color: black;
    }
}

a.bubble,
a.delete{
    @extend .icon-btn;

    background-size: cover;
    width: $btn-size / 2;
    height: $btn-size / 2;
}
a.bubble{
    background-image: url('@/assets/img/bubble.png');
}
a.delete{
    background-image: url('@/assets/img/delete.png');
}

table{
    @extend .margins;

    thead{
        td{
            font-weight: bold;
            padding-top: $padding / 4 !important;
            padding-bottom: $padding / 4 !important;
        }
    }

    tr{
        td{
            padding: $padding / 4;

            &:first-child{
                padding-left: 0;
            }
            &:last-child{
                padding-right: 0;
            }
        }

        &:first-child{
            td{
                padding-top: 0;
            }
        }
        &:last-child{
            td{
                padding-bottom: 0;
            }
        }
    }
}
</style>
