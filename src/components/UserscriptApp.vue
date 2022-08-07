<script lang="ts" setup>
import { ref, computed, watch } from 'vue'
import { TITLE } from '@/Constants'
import { GitHubHomepage } from '@/services/github/GitHubHomepage'
import { useStore } from '@/store'
import UserscriptAppSettings from './UserscriptAppSettings.vue'

const username = $('.dashboard-sidebar summary > span.css-truncate').text().trim()
const githubHomepage = new GitHubHomepage(username)

const store = useStore()
const categories = computed(() => store.categories)
watch(categories, async() => {
    await githubHomepage.run(store.categories)
}, {
    deep: true,
    immediate: true,
})

const isOpen = ref(false)
</script>

<template>
    <div
        v-if="username"
        class="userscript-github-repository-categories"
    >
        <div
            v-if="isOpen"
            class="dialog-wrapper"
        >
            <div class="dialog">
                <UserscriptAppSettings
                    @close="isOpen = false"
                />
            </div>
        </div>

        <a
            class="settings-btn"
            :title="TITLE"
            @click="isOpen = true"
        >
            Settings
        </a>
    </div>
</template>

<style lang="scss" scoped>
:global(.userscript-github-repository-categories *){
    background: none;
    outline: none;
    border: none;
    margin: 0;
    padding: 0;

    color: #111;
    font-size: 15px;
    font-weight: normal;
    font-family: Arial, Helvetica, sans-serif;
    line-height: 1.5;
    vertical-align: baseline;
}

a.settings-btn{
    @extend .icon-btn;

    position: fixed;
    bottom: $padding;
    right: $padding;
    z-index: 9999;

    background-image: url('@/assets/img/settings.png');
    box-shadow: rgba(11, 11, 11, 0.1) 0 2px 8px;

    &:hover{
        box-shadow: rgba(11, 11, 11, 0.4) 0 0px 8px;
    }
}

.dialog-wrapper{
    background: rgba(11, 11, 11, 0.4);

    position: fixed;
    top: 0; left: 0;
    width: 100%; height: 100%;
    z-index: 99999;

    > .dialog{
        background: white;
        padding: $padding;
        border-radius: $border-radius;

        position: absolute;
        top: 50%; left: 50%;
        transform: translateY(-50%) translateX(-50%);
        min-width: $min-dialog-width;
    }
}
</style>
