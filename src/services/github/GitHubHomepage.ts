import type { Category } from '@/store'
import { waitDelayedPredicate } from '@/utils/waitDelayedPredicate'
import { Bucket, initBuckets } from './Bucket'

export class GitHubHomepage {
    readonly username: string
    hasOpened: boolean

    constructor(username: string) {
        this.username = username
        this.hasOpened = false

        console.info(DEFINE.NAME, 'GitHubHomepage::GitHubHomepage()')
        console.info(DEFINE.NAME, 'Username:', this.username)
    }

    async run(categories: Array<Category>): Promise<void> {
        if (!this.username) {
            console.warn(DEFINE.NAME, 'Skipping GitHubHomepage::run() because user is logged out')
            return
        }

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
            $showMoreBtn = $('.js-repos-container > .js-more-repos-form > button')
            return $showMoreBtn.length === 2 // 1 btn for desktop, 1 btn for mobile
        })

        $showMoreBtn?.trigger('click')

        // Wait until the "Show more" button is no longer visible
        console.info(DEFINE.NAME, 'Waiting for $showMoreBtn to be hidden')
        await waitDelayedPredicate(() => {
            const isVisible = $showMoreBtn?.is(':visible')
            const isInDom = $showMoreBtn && document.body.contains($showMoreBtn[0]) && document.body.contains($showMoreBtn[1])
            return !isVisible || !isInDom
        })

        this.hasOpened = true
    }

    private organizeRepos(categories: Array<Category>): void {
        if (!this.hasOpened) {
            console.warn(`Trying to call GitHubHomePage::organizeRepos when hasOpened=${this.hasOpened}`)
            return
        }

        const buckets = initBuckets(categories)
        const priorityBuckets = [...buckets].sort((b1, b2) => b2.priority - b1.priority)
        const externalBucket: Bucket = {
            title: 'External',
            regexp: /.*/,
            priority: 0,
            repos: [],
        }

        // Categorize repos into buckets
        const $root = $($('.js-repos-container .js-repos-container')?.[0])
        const $repoRows = $root.find('> ul > li')
        console.info(DEFINE.NAME, `Found ${$repoRows.length} repos`)

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
