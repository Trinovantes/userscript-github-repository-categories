<template>
    <div class="userscript-github-repository-categories">
        <div v-if="isOpen" class="dialog-wrapper">
            <div class="dialog">
                <h1>
                    {{ title }}
                </h1>
                <a :href="projectUrl" class="url">
                    {{ projectUrl }}
                </a>

                <Settings
                    @close="isOpen = false"
                />
            </div>
        </div>

        <a
            class="settings-btn"
            :title="title"
            @click="isOpen = true"
        >
            Settings
        </a>
    </div>
</template>

<script lang="ts">
import { GitHubHomepage } from '@/GitHubHomepage'
import { useTypedStore } from '@/store'
import { ref, defineComponent, computed, watch, onMounted } from 'vue'
import Settings from './Settings.vue'

export default defineComponent({
    components: {
        Settings,
    },

    setup() {
        const store = useTypedStore()
        const categories = computed(() => store.state.categories)
        const githubHomepage = new GitHubHomepage()

        const render = async() => {
            await githubHomepage.run(store.state.categories)
        }

        onMounted(render)
        watch(categories, render, {
            deep: true,
        })

        return {
            title: `${DEFINE.PRODUCT_NAME} ${DEFINE.VERSION}`,
            projectUrl: DEFINE.REPO.url,
            isOpen: ref(false),
        }
    },
})
</script>

<style lang="scss">
.userscript-github-repository-categories{
    *{
        background: none;
        outline: none;
        border: none;
        margin: 0;
        padding: 0;

        color: #111;
        font-size: 15px;
        font-weight: normal;
        line-height: 1.5;
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

            h1{
                font-size: 24px;
                font-weight: bold;
            }

            a.url{
                display: block;
                margin-bottom: $padding;

                color: blue;
                text-decoration: none;

                &:hover{
                    text-decoration: underline;
                }
            }
        }
    }
}
</style>
