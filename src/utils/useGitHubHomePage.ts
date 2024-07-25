import { Category, useStore } from '@/store/useStore'
import { waitDelayedPredicate } from '@/utils/waitDelayedPredicate'
import { Bucket, initBuckets } from './Bucket'
import { computed, watch } from 'vue'

export function useGitHubHomePage() {
    const username = document.querySelector('aside.feed-left-sidebar button[data-test-selector="account-context"] .Button-label')?.textContent?.trim()
    console.info(DEFINE.NAME, 'useGitHubHomePage', `username:"${username}"`)

    const store = useStore()
    const categories = computed(() => store.categories)
    watch(categories, async() => {
        if (!username) {
            return
        }

        await openRepoList()
        const buckets = parseBuckets(username, categories.value)
        renderBuckets(username, buckets)
    }, {
        deep: true,
        immediate: true,
    })

    return {
        username,
    }
}

let hasOpened = false
async function openRepoList() {
    if (hasOpened) {
        return
    }

    // GitHub homepage has 2 "Show More" buttons
    //  - 1 btn for desktop
    //  - 1 btn for mobile
    let showMoreBtns: Array<HTMLElement> = []
    const allBtnsHidden = () => {
        for (const btn of showMoreBtns) {
            if (btn.offsetParent !== null) {
                return false
            }
            if (document.body.contains(btn)) {
                return false
            }
        }

        return true
    }

    console.info(DEFINE.NAME, 'Searching for showMoreBtns')
    await waitDelayedPredicate(() => {
        showMoreBtns = [...document.querySelectorAll<HTMLButtonElement>('.Details.js-repos-container .js-more-repos-form > button')]
        return showMoreBtns.length === 2
    })

    for (const btn of showMoreBtns) {
        btn.click()
    }

    // Wait until the "Show more" button is no longer visible
    console.info(DEFINE.NAME, 'Waiting for showMoreBtns to be hidden')
    await waitDelayedPredicate(allBtnsHidden)

    hasOpened = true
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

    const root = document.querySelectorAll<HTMLDivElement>('.Details.js-repos-container > .js-repos-container')[0]
    const repoRows = root.querySelectorAll<HTMLLIElement>('ul li.source')
    console.info(DEFINE.NAME, `Found ${repoRows?.length} repos`)

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

function renderBuckets(username: string, buckets: Array<Bucket>) {
    const root = document.querySelectorAll<HTMLDivElement>('.Details.js-repos-container > .js-repos-container')[0]
    root.classList.add('github-repository-categories')

    for (const el of root.querySelectorAll('ul li.source')) {
        el.parentElement?.removeChild(el)
    }
    for (const el of root.querySelectorAll('h3')) {
        el.parentElement?.removeChild(el)
    }

    for (const bucket of buckets) {
        if (!bucket.repos.length) {
            continue
        }

        const h3 = document.createElement('h3')
        h3.textContent = bucket.title || 'Untitled Category'

        const ul = document.createElement('ul')
        const repos = bucket.repos.sort((repoA, repoB) => repoA.name.localeCompare(repoB.name))

        for (const repo of repos) {
            const li = repo.liNode

            // Remove 'username/' prefix from our own repos
            if (repo.owner === username) {
                const slash = li.querySelector('a > span')
                slash?.setAttribute('style', 'display:none;')

                const ownerName = li.querySelector('a.markdown-title')?.childNodes?.[0]
                if (ownerName?.textContent?.trim() === username) {
                    ownerName.remove()
                }
            }

            ul.append(li)
        }

        root.append(h3)
        root.append(ul)
    }
}
