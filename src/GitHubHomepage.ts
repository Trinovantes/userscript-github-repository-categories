import { Category } from '@/store'
import { waitDelayedPredicate } from '@/utils'

interface Bucket {
    title: string
    regexp: RegExp
    priority: number
    repos: Array<{
        owner: string
        name: string
        liNode: HTMLElement
    }>
}

export class GitHubHomepage {
    readonly username: string
    hasOpened: boolean

    constructor() {
        this.username = $('.dashboard-sidebar summary > span.css-truncate').text().trim()
        this.hasOpened = false

        console.info(DEFINE.NAME, 'GitHubHomepage::GitHubHomepage()')
        console.info(DEFINE.NAME, 'Username:', this.username)
    }

    async run(categories: Array<Category>): Promise<void> {
        await this.openRepoList()
        this.organizeRepos(categories)
    }

    private async openRepoList(): Promise<void> {
        if (this.hasOpened) {
            return
        }

        let $showMoreBtn: JQuery | undefined

        console.info(DEFINE.NAME, 'Searching for $showMoreBtn')
        await waitDelayedPredicate(() => {
            $showMoreBtn = $('#repos-container > form.js-more-repos-form > button')
            return $showMoreBtn !== undefined
        })

        $showMoreBtn?.trigger('click')

        // Wait until the "Show more" button is no longer visible
        console.info(DEFINE.NAME, 'Waiting for $showMoreBtn to be hidden')
        await waitDelayedPredicate(() => {
            return $showMoreBtn?.is(':visible') === false
        })

        this.hasOpened = true
    }

    private organizeRepos(categories: Array<Category>): void {
        const buckets: Array<Bucket> = initBuckets(categories)
        const priorityBuckets: Array<Bucket> = [...buckets].sort((b1, b2) => b2.priority - b1.priority)
        const externalBucket: Bucket = {
            title: 'External',
            regexp: /.*/,
            priority: 0,
            repos: [],
        }

        const $root = $('#repos-container')

        // Categorize repos into buckets
        const $repoRows = $root.find('> ul > li')
        for (const repoRow of $repoRows) {
            const url = $(repoRow).find('a[href^="/"]').attr('href')
            if (!url) {
                continue
            }

            const matches = /^\/([\w-]+)\/([\w-]+$)/.exec(url)
            if (!matches) {
                continue
            }

            const ownerName = matches[1]
            const repoName = matches[2]

            if (ownerName === this.username) {
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

        // Render repos into categories
        $root.find('> ul li').remove()
        $root.find('> h3').remove()
        $root.addClass('github-repository-categories')
        for (const bucket of buckets) {
            this.renderBucket(bucket, $root)
        }

        this.renderBucket(externalBucket, $root)
    }

    private renderBucket(bucket: Bucket, $root: JQuery) {
        if (!bucket.repos.length) {
            return
        }

        const $ul = $('<ul>')
        const repos = bucket.repos.sort((repoA, repoB) => repoA.name.localeCompare(repoB.name))

        for (const repo of repos) {
            const li = repo.liNode

            // Remove 'username/' prefix from our own repos
            if (repo.owner === this.username) {
                const $slash = $(li).find('a > span')
                $slash.hide()

                const $a = $(li).find('a.markdown-title')
                const $ownerName = $a[0].childNodes[0]
                if ($ownerName.textContent?.trim() === this.username) {
                    $ownerName.remove()
                }
            }

            $ul.append(li)
        }

        $root.append(`<h3>${bucket.title || 'Untitled Category'}</h3>`)
        $root.append($ul)
    }
}

function initBuckets(categories: Array<Category>): Array<Bucket> {
    const buckets = categories.map((category) => {
        return {
            title: category.title,
            regexp: new RegExp(category.regexp),
            priority: category.priority,
            repos: [],
        }
    })

    buckets.push({
        title: 'Uncategorized',
        regexp: /.*/,
        priority: 0,
        repos: [],
    })

    return buckets
}
