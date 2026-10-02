import { type Category, useStore } from '../store/useStore.ts'
import { waitDelayedPredicate } from '../utils/waitDelayedPredicate.ts'
import { type Bucket, initBuckets } from './Bucket.ts'
import { computed, watch } from 'vue'
import { findDelayedElement } from './findDelayedElement.ts'

export function useGitHubHomePage() {
    const username = document.querySelector('aside .dashboard-sidebar img.avatar + div > div:has(+select-panel) span.text-bold')?.textContent?.trim()
    console.info(__NAME__, 'useGitHubHomePage', `username:"${username}"`)

    let hasOpened = false

    const store = useStore()
    const categories = computed(() => store.categories)
    watch(categories, async () => {
        if (!username) {
            return
        }

        if (!hasOpened) {
            await openRepoList()
            hasOpened = true
        }

        const buckets = parseBuckets(username, categories.value)
        await renderBuckets(username, buckets)
    }, {
        deep: true,
        immediate: true,
    })

    return {
        username,
    }
}

async function openRepoList() {
    console.groupCollapsed(__NAME__, 'Clicking showMoreBtn')
    const showMoreBtn = await findDelayedElement('nav[data-testid="dashboard-repositories"] button[data-testid="dynamic-side-panel-items-show-more"]')
    showMoreBtn.click()
    console.groupEnd()

    console.groupCollapsed(__NAME__, 'Waiting for showMoreBtn to be hidden')
    await waitDelayedPredicate(() => {
        if (showMoreBtn.offsetParent !== null) {
            return false
        }
        if (document.body.contains(showMoreBtn)) {
            return false
        }

        return true
    })
    console.groupEnd()
}

function parseBuckets(username: string, categories: Array<Category>) {
    const buckets = initBuckets(categories)
    const priorityBuckets = [...buckets].sort((b1, b2) => b2.priority - b1.priority)
    const externalBucket: Bucket = {
        title: 'External',
        regexp: /.*/,
        priority: 0,
        repos: [],
    }

    const repoRows = document.querySelectorAll<HTMLLIElement>('nav[data-testid="dashboard-repositories"] li[data-component="ActionList.Item"]')
    console.info(__NAME__, `Found ${repoRows?.length} repos`)

    for (const repoRow of repoRows) {
        const url = repoRow.querySelector('a[href^="/"]')?.getAttribute('href')
        if (!url) {
            continue
        }

        const matches = /^\/([\w-]+)\/([\w-]+$)/.exec(url)
        if (!matches) {
            continue
        }

        const ownerName = matches[1]
        const repoName = matches[2]

        if (ownerName === username) {
            for (const bucket of priorityBuckets) {
                if (bucket.regexp.test(repoName)) {
                    bucket.repos.push({
                        owner: ownerName,
                        name: repoName,
                        liNode: repoRow,
                    })
                    break
                }
            }
        } else {
            externalBucket.repos.push({
                owner: ownerName,
                name: `${ownerName}/${repoName}`,
                liNode: repoRow,
            })
        }
    }

    return [
        ...buckets,
        externalBucket,
    ]
}

async function renderBuckets(username: string, buckets: Array<Bucket>) {
    console.groupCollapsed(__NAME__, 'Bucket Root')

    const root = await findDelayedElement('nav[data-testid=dashboard-repositories] li[class^="prc-ActionList-Group"] > ul')

    // Add class for css
    root.classList.add('github-repository-categories')

    // Remove searchbox (since it doesn't work for some reason after inserting our own headings)
    const searchBox = await findDelayedElement('nav[data-testid="dashboard-repositories"] div[data-component="GroupHeadingWrap"]:has(button[data-testid="dynamic-side-panel-items-search-button"])')
    searchBox.remove()

    // Add back nodes with headings
    for (const bucket of buckets) {
        if (!bucket.repos.length) {
            continue
        }

        const heading = document.createElement('h3')
        heading.textContent = bucket.title || 'Untitled Category'

        const ul = document.createElement('ul')
        const repos = bucket.repos.sort((repoA, repoB) => repoA.name.localeCompare(repoB.name))

        for (const repo of repos) {
            const li = repo.liNode

            // Remove 'username/' prefix from our own repos
            if (repo.owner === username) {
                const labelNode = await findDelayedElement('span[data-component="ActionList.Item.Label"]', li)
                labelNode.textContent = labelNode.textContent.replace(`${username}/`, '')
            }

            ul.append(li)
        }

        root.append(heading)
        root.append(ul)
    }

    console.groupEnd()
}
