'use strict'

import GitHubHomepage from './GitHubHomepage'

async function main() {
    await $.when($.ready)
    const homepage = new GitHubHomepage()
    homepage.run()
}

import '@css/main.scss'
void main()
