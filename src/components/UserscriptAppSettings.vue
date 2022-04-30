<script lang="ts">
import { computed, defineComponent, ref } from 'vue'
import { useStore } from '@/store'
import type { Message } from '@/utils/Message'
import { validateNumber } from '@/utils/validateNumber'
import { validateRegex } from '@/utils/validateRegex'

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
            title: `${DEFINE.PRODUCT_NAME} ${DEFINE.VERSION}`,
            projectUrl: DEFINE.REPO.url,
            messages,

            categories,
            addCategory,
            bubbleCategory,
            deleteCategory,

            save,
            reset,
        }
    },
})
</script>

<template>
    <div class="settings">
        <div class="group">
            <h1>
                {{ title }}
            </h1>
            <a :href="projectUrl" class="project-url">
                {{ projectUrl }}
            </a>
        </div>

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
                                v-model="category.title"
                                type="text"
                            >
                        </td>
                        <td>
                            <input
                                v-model="category.regexp"
                                type="text"
                                spellcheck="false"
                            >
                        </td>
                        <td>
                            <input
                                v-model.number="category.priority"
                                type="number"
                                title="Higher priority RegExp will be checked first"
                                placeholder="Priority"
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

            <div>
                <a
                    class="btn"
                    @click="addCategory"
                >
                    Add Category
                </a>
            </div>
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
    </div>
</template>

<style lang="scss" scoped>
.settings{
    display: grid;
    gap: $padding;
}

.group{
    display: grid;
    gap: math.div($padding, 2);

    &:not(:first-child){
        border-top: $border;
        padding-top: $padding;
    }

    &.actions{
        display: flex;
        gap: math.div($padding, 2);

        .hspace{
            flex: 1;
        }
    }
}

h1{
    font-size: 24px;
    font-weight: bold;
}

h2{
    font-size: 21px;
    font-weight: bold;
}

a.project-url{
    display: block;
    color: blue;
    text-decoration: none;

    &:hover{
        text-decoration: underline;
    }
}

label{
    cursor: pointer;
    font-weight: bold;

    align-items: center;
    display: grid;
    gap: math.div($padding, 2);
    grid-template-columns: 1fr 2fr;
    justify-items: left;
}

input{
    font-weight: normal;

    border: $border;
    border-radius: $border-radius;
    padding: math.div($padding, 4);

    &:focus{
        border-color: black;
    }

    &:not([type='checkbox']){
        width: 100%;
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

.message{
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
</style>
