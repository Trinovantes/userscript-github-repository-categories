<script lang="ts">
import { useStore } from '@/store'
import { computed, defineComponent, ref } from 'vue'

interface Message {
    label: string
    type: string
}

export default defineComponent({
    emits: [
        'close',
    ],

    setup() {
        const store = useStore()
        const categories = computed(() => store.categories)

        const addCategory = () => {
            store.addCategory()
        }

        const deleteCategory = (idx: number) => {
            store.deleteCategory(idx)
        }

        const bubbleCategory = (idx: number) => {
            store.bubbleCategory(idx)
        }

        const setCategoryTitle = (idx: number, event: Event) => {
            store.setCategory(idx, {
                title: (event.target as HTMLInputElement).value,
            })
        }

        const setCategoryRegex = (idx: number, event: Event) => {
            store.setCategory(idx, {
                regexp: (event.target as HTMLInputElement).value,
            })
        }

        const setCategoryPriority = (idx: number, event: Event) => {
            store.setCategory(idx, {
                priority: parseInt((event.target as HTMLInputElement).value),
            })
        }

        const messages = ref<Array<Message>>([])
        const save = async() => {
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

            await store.save()
            messages.value.push({
                label: 'Saved',
                type: 'success',
            })
        }

        const reset = async() => {
            store.$reset()

            await store.save()
            messages.value.push({
                label: 'Successfully resetted everything to defaults',
                type: 'success',
            })
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

            save,
            reset,
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

<template>
    <div class="group">
        <div
            v-for="[idx, message] of Object.entries(messages)"
            :key="idx"
            :class="`message ${message.type}`"
        >
            {{ message.label }}
        </div>

        <h2>Categories</h2>
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
                    v-for="(category, idx) in categories"
                    :key="idx"
                    class="category"
                >
                    <td>
                        <a
                            class="icon-btn bubble"
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
                            class="icon-btn delete"
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
            @click="save"
        >
            Save
        </a>
        <a
            class="btn"
            @click="reset"
        >
            Reset to Defaults
        </a>
        <div class="hspace" />
        <a
            class="btn"
            @click="$emit('close')"
        >
            Close
        </a>
    </div>
</template>

<style lang="scss" scoped>
h2{
    @extend .margins;

    font-size: 21px;
    font-weight: bold;
}

.message{
    @extend .margins;

    padding: math.div($padding, 2) $padding;

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

input{
    border: $border;
    border-radius: $border-radius;
    padding: math.div($padding, 4);

    &:focus{
        border-color: black;
    }
}

a.icon-btn{
    background-size: cover;
    width: math.div($btn-size, 2);
    height: math.div($btn-size, 2);

    &.bubble{
        background-image: url('@/assets/img/bubble.png');
    }

    &.delete{
        background-image: url('@/assets/img/delete.png');
    }
}

table{
    @extend .margins;

    thead{
        td{
            font-weight: bold;
            padding-top: math.div($padding, 4) !important;
            padding-bottom: math.div($padding, 4) !important;
        }
    }

    tr{
        td{
            padding: math.div($padding, 4);

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

.actions{
    display: flex;
    gap: math.div($padding, 2);

    .hspace{
        flex: 1;
    }
}

a.btn{
    background-color: white;
    border: $border;
    border-radius: $border-radius;
    cursor: pointer;
    display: inline-block;
    padding: math.div($padding, 4) math.div($padding, 2);
    text-decoration: none;

    &:hover{
        background-color: #eee;
    }

    &.positive{
        background-color: green;
        border-color: darkgreen;
        color: white;

        &:hover{
            background-color: darkgreen;
        }
    }
}
</style>
