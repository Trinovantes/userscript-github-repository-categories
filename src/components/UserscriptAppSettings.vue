<script lang="ts" setup>
import { computed, ref } from 'vue'
import { projectTitle, projectUrl } from '@/Constants'
import { useStore } from '@/store/useStore'
import { Message } from '@/utils/Message'
import { validateNumber } from '@/utils/validateNumber'
import { validateRegex } from '@/utils/validateRegex'

const emit = defineEmits(['close'])

const store = useStore()
const categories = computed(() => store.categories)
const errorMessages = ref<Array<Message>>([])
const save = async() => {
    errorMessages.value = []

    for (const category of categories.value) {
        const regexError = validateRegex(category.regexp)
        if (regexError) {
            errorMessages.value.push(regexError)
        }

        const priorityErrors = validateNumber(category.priority, 'Priority')
        if (priorityErrors.length > 0) {
            errorMessages.value = [
                ...errorMessages.value,
                ...priorityErrors,
            ]
        }
    }

    // Check if validators found any problems
    if (errorMessages.value.length > 0) {
        return
    }

    await store.save()
    emit('close')
}

const cancel = async() => {
    await store.load()
    emit('close')
}

const resetToDefaults = async() => {
    store.$reset()
    await store.save()
}
</script>

<template>
    <article>
        <div class="group header flex-vgap">
            <h1>
                {{ projectTitle }}
            </h1>
            <a :href="projectUrl" class="project-url">
                {{ projectUrl }}
            </a>
        </div>

        <div class="group categories flex-vgap">
            <div
                v-for="[idx, message] of Object.entries(errorMessages)"
                :key="idx"
                :class="`message ${message.type}`"
            >
                {{ message.label }}
            </div>

            <div class="category">
                <span />
                <span />
                <strong>Title</strong>
                <strong>RegExp</strong>
                <strong>Priority</strong>
                <strong />
            </div>
            <div
                v-for="(category, idx) in categories"
                :key="idx"
                class="category"
            >
                <button
                    class="icon-btn up"
                    title="Move category up"
                    @click="store.moveCategoryUp(idx)"
                >
                    Up
                </button>
                <button
                    class="icon-btn down"
                    title="Move category down"
                    @click="store.moveCategoryDown(idx)"
                >
                    Down
                </button>
                <input
                    v-model="category.title"
                    type="text"
                >
                <input
                    v-model="category.regexp"
                    type="text"
                    spellcheck="false"
                >
                <input
                    v-model.number="category.priority"
                    type="number"
                    title="Higher priority RegExp will be checked first"
                    placeholder="Priority"
                >
                <button
                    class="icon-btn delete"
                    title="Delete category"
                    @click="store.deleteCategory(idx)"
                >
                    Delete
                </button>
            </div>

            <div>
                <button
                    @click="store.addCategory()"
                >
                    Add Category
                </button>
            </div>
        </div>

        <div class="group actions flex-hgap">
            <button
                class="positive"
                @click="save"
            >
                Save
            </button>
            <button
                @click="resetToDefaults"
            >
                Reset to Defaults
            </button>

            <div class="flex-1" />
            <button
                @click="cancel"
            >
                Cancel
            </button>
        </div>
    </article>
</template>

<style lang="scss" scoped>
article{
    display: grid;
    max-height: 80vh;
    overflow-y: auto;
    max-width: 600px;
    width: 50vw;
}

.group{
    padding: $padding;

    &:not(:first-child){
        border-top: $border;
    }

    &.header{
        gap: math.div($padding, 2);
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

.categories{
    $icon-size: math.div($btn-size, 1.5);

    gap: math.div($padding, 2);

    button.icon-btn{
        background-size: 75% 75%;
        background-repeat: no-repeat;
        background-position: center;
        width: $icon-size;
        height: $icon-size;
        text-indent: -9999px;

        &.up{
            background-image: url('@/assets/img/up.png');
        }
        &.down{
            background-image: url('@/assets/img/down.png');
        }
        &.delete{
            background-image: url('@/assets/img/delete.png');
        }
    }

    .category{
        display: grid;
        gap: math.div($padding, 2);
        grid-template-columns: $icon-size $icon-size 1fr 1fr 1fr $icon-size;
        align-items: center;

        strong{
            font-weight: bold;
        }
    }
}
</style>
