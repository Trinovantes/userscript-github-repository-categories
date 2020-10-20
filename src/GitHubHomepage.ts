import { EOL } from 'os'

// ----------------------------------------------------------------------------
// Constants
// ----------------------------------------------------------------------------

const UI_WAIT_TIME = 500

// In order of appearance
enum Categories {
    PROJECTS = 'Projects',
    TEMPLATE = 'Templates',
    GITHUB_ACTION = 'GitHub Actions',
    USERSCRIPTS = 'Userscripts',
    EXTERNALS = 'Externals', // Anything that doesn't belong to current user
    SCHOOL = 'School',
    MISC = 'Miscellaneous', // Anything that doesn't match
}

type CategorizedRepositories = {
    [key in Categories]?: Array<{
        owner: string,
        name: string,
        node: HTMLElement,
    }>
}

type Matcher = {
    name: Categories,
    regex: RegExp,
}

// In order matching priority
const Matchers: Array<Matcher> = [
    {
        name: Categories.TEMPLATE,
        regex: /^template-/,
    },
    {
        name: Categories.GITHUB_ACTION,
        regex: /^action-/,
    },
    {
        name: Categories.USERSCRIPTS,
        regex: /^userscript-/,
    },
    {
        name: Categories.SCHOOL,
        regex: /^[A-Z]+([\d]+)-/,
    },
    {
        name: Categories.PROJECTS,
        regex: /^(\d+)?[A-Z]/,
    },
]

// ----------------------------------------------------------------------------
// GitHubHomepage
// ----------------------------------------------------------------------------

export default class GitHubHomepage {
    constructor() {
        console.info(
            '-'.repeat(80) + EOL +
            'Initializing GitHubHomepage' + EOL +
            '-'.repeat(80) + EOL)
    }

    async run(): Promise<void> {
        const username = $('.dashboard-sidebar summary > span.css-truncate').text().trim()
        console.log('Username:', username)

        const root = $('#repos-container')

        // Get full list of repos
        const showMoreBtn = root.find('> form.js-more-repos-form > button')
        showMoreBtn.trigger('click')
        await sleep(UI_WAIT_TIME)

        // Categorize repos
        const categoriesNodes = initCategories()
        const repoRows = root.find('> ul[data-filterable-for="dashboard-repos-filter-left"] > li')
        for (const repoRow of repoRows) {
            const ownerName = $(repoRow).find('a > span:nth-of-type(1)').text()
            const repoName = $(repoRow).find('a > span:nth-of-type(2)').text()
            console.log('Repository', ownerName, repoName)

            let category: Categories

            if (ownerName !== username) {
                category = Categories.EXTERNALS
            } else {
                category = findMatch(repoName)
            }

            categoriesNodes[category]?.push({
                owner: ownerName,
                name: repoName,
                node: repoRow,
            })
        }

        // Render repos in categories
        root.find('> ul[data-filterable-for="dashboard-repos-filter-left"]').remove()
        root.addClass('github-repository-categories')
        for (const [category, repos] of Object.entries(categoriesNodes)) {
            if (!repos?.length) {
                continue
            }

            const ul = $('<ul>')
            for (const repo of repos) {
                const li = repo.node

                // Remove 'username/' prefix from our own repos
                if (repo.owner === username) {
                    const icon = $(li).find('a > div').clone()
                    const repoLabel = $(li).find('a > span:nth-of-type(2)').clone()

                    const a = $(li).find('a')
                    const aClone = a.clone()
                    aClone.text('')
                    aClone.append(icon)
                    aClone.append(repoLabel)
                    a.replaceWith(aClone)
                }

                ul.append(li)
            }

            root.append(`<h3>${category}</h3>`)
            root.append(ul)
        }
    }
}

// ----------------------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------------------

function sleep(timeout: number): Promise<void> {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve()
        }, timeout)
    })
}

function initCategories(): CategorizedRepositories {
    const dict: CategorizedRepositories = {}

    for (const category of Object.values(Categories)) {
        dict[category] = []
    }

    return dict
}

function findMatch(repoName: string): Categories {
    for (const matcher of Matchers) {
        if (matcher.regex.exec(repoName)) {
            return matcher.name
        }
    }

    return Categories.MISC
}
