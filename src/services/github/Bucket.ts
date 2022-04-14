import { Category } from '@/store'

export interface Bucket {
    title: string
    regexp: RegExp
    priority: number
    repos: Array<{
        owner: string
        name: string
        liNode: HTMLElement
    }>
}

export function initBuckets(categories: Array<Category>): Array<Bucket> {
    const buckets: Array<Bucket> = []

    for (const category of categories) {
        buckets.push({
            title: category.title,
            regexp: new RegExp(category.regexp),
            priority: category.priority,
            repos: [],
        })
    }

    buckets.push({
        title: 'Uncategorized',
        regexp: /.*/,
        priority: 0,
        repos: [],
    })

    return buckets
}
