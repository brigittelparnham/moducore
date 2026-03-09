import Parser from 'rss-parser'
import { z } from 'zod'
import type { ConnectorAdapter } from '../types'

const parser = new Parser()

export type RssConfig = {
  url: string
}

export type RssItem = {
  title: string | undefined
  link: string | undefined
  description: string | undefined
  pubDate: string | undefined
  author: string | undefined
  content: string | undefined
}

export type RssResult = {
  feedTitle: string | undefined
  feedDescription: string | undefined
  items: RssItem[]
}

export const rssConnector: ConnectorAdapter<RssConfig, RssResult> = {
  type: 'rss',
  configSchema: z.object({
    url: z.string().url('Must be a valid URL'),
  }),
  async fetch(config) {
    const feed = await parser.parseURL(config.url)
    return {
      feedTitle: feed.title,
      feedDescription: feed.description,
      items: feed.items.map((item) => ({
        title: item.title,
        link: item.link,
        description: item.description,
        pubDate: item.pubDate,
        author: item.creator ?? item.author,
        content: item.content,
      })),
    }
  },
}
