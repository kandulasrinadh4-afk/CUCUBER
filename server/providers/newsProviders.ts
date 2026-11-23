import {
  CricketNewsProvider,
  NormalizedNewsArticle,
  ProviderFetchNewsResult,
} from '../types/cricket';
import { sanitizeHttpUrl } from '../normalizers/matchNormalizer';

interface RssFeedConfig {
  id: string;
  name: string;
  url: string;
  baseOrigin: string;
}

const DEFAULT_RSS_FEEDS: RssFeedConfig[] = [
  {
    id: 'espncricinfo-rss',
    name: 'ESPNcricinfo',
    url: 'https://www.espncricinfo.com/rss/content/story/feeds/0.xml',
    baseOrigin: 'https://www.espncricinfo.com',
  },
  {
    id: 'bbc-sport-cricket-rss',
    name: 'BBC Sport Cricket',
    url: 'https://feeds.bbci.co.uk/sport/cricket/rss.xml',
    baseOrigin: 'https://www.bbc.co.uk',
  },
  {
    id: 'cricket-australia-rss',
    name: 'Cricket Australia',
    url: 'https://www.cricket.com.au/news/rss',
    baseOrigin: 'https://www.cricket.com.au',
  },
  {
    id: 'guardian-cricket-rss',
    name: 'The Guardian Cricket',
    url: 'https://www.theguardian.com/sport/cricket/rss',
    baseOrigin: 'https://www.theguardian.com',
  },
];

function decodeHtmlEntities(input: string): string {
  return (input || '')
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(parseInt(dec, 10)));
}

function stripHtmlToPlainText(input: string): string {
  const decoded = decodeHtmlEntities(input);
  return decoded
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractTagContent(block: string, tagName: string): string {
  const regex = new RegExp(`<${tagName}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tagName}>`, 'i');
  const match = block.match(regex);
  return match ? match[1].trim() : '';
}

function extractAttributeValue(block: string, tagName: string, attrName: string): string {
  const regex = new RegExp(`<${tagName}[^>]*\\s${attrName}=["']([^"']+)["'][^>]*>`, 'i');
  const match = block.match(regex);
  return match ? decodeHtmlEntities(match[1].trim()) : '';
}

function resolveArticleUrl(rawLink: string, baseOrigin: string): string {
  const cleaned = decodeHtmlEntities(rawLink).trim();
  if (!cleaned) return '';
  if (cleaned.startsWith('/')) {
    return sanitizeHttpUrl(`${baseOrigin}${cleaned}`);
  }
  return sanitizeHttpUrl(cleaned);
}

function computeTimeAgo(pubDateStr?: string): { iso?: string; timeAgo: string } {
  if (!pubDateStr) return { timeAgo: 'Recent' };
  const parsed = new Date(pubDateStr);
  if (isNaN(parsed.getTime())) return { timeAgo: 'Recent' };

  const diffMs = Math.max(0, Date.now() - parsed.getTime());
  const mins = Math.floor(diffMs / 60000);
  if (mins < 60) return { iso: parsed.toISOString(), timeAgo: `${Math.max(1, mins)}m ago` };
  const hours = Math.floor(mins / 60);
  if (hours < 24) return { iso: parsed.toISOString(), timeAgo: `${hours}h ago` };
  const days = Math.floor(hours / 24);
  return { iso: parsed.toISOString(), timeAgo: `${days}d ago` };
}

function categorizeArticle(title: string, summary: string): NormalizedNewsArticle['category'] {
  const text = `${title} ${summary}`.toLowerCase();
  if (text.includes('breaking') || text.includes('ruled out') || text.includes('injury') || text.includes('suspended')) {
    return 'Breaking News';
  }
  if (text.includes('ipl') || text.includes('world cup') || text.includes('champions trophy') || text.includes('ashes') || text.includes('wtc') || text.includes('shield') || text.includes('bbl')) {
    return 'Tournaments';
  }
  if (text.includes('won by') || text.includes('innings') || text.includes('stumps') || text.includes('match report') || text.includes('draw') || text.includes('century')) {
    return 'Matches';
  }
  if (text.includes('captain') || text.includes('kohli') || text.includes('gill') || text.includes('root') || text.includes('cummins') || text.includes('smith') || text.includes('bumrah')) {
    return 'Players';
  }
  if (text.includes('squad') || text.includes('selector') || text.includes('india') || text.includes('australia') || text.includes('england') || text.includes('south africa') || text.includes('new zealand')) {
    return 'Teams';
  }
  return 'Latest';
}

function estimateReadTime(summary: string): string {
  const words = summary.split(/\s+/).filter(Boolean).length;
  const mins = Math.max(2, Math.min(6, Math.ceil(words / 40) + 1));
  return `${mins} min read`;
}

function buildTags(title: string, sourceName: string): string[] {
  const tags: string[] = [sourceName];
  const keywords = ['Test', 'ODI', 'T20', 'IPL', 'WTC', 'Ashes', 'India', 'Australia', 'England', 'New Zealand', 'Pakistan', 'South Africa'];
  for (const kw of keywords) {
    if (title.toLowerCase().includes(kw.toLowerCase())) {
      tags.push(kw);
    }
  }
  return Array.from(new Set(tags)).slice(0, 4);
}

function parseRssOrAtomItems(xml: string, config: RssFeedConfig): NormalizedNewsArticle[] {
  const articles: NormalizedNewsArticle[] = [];
  const itemMatches = xml.match(/<item\b[\s\S]*?<\/item>/gi) || xml.match(/<entry\b[\s\S]*?<\/entry>/gi) || [];

  for (let idx = 0; idx < itemMatches.length && articles.length < 15; idx++) {
    const block = itemMatches[idx];
    const title = stripHtmlToPlainText(extractTagContent(block, 'title'));
    if (!title) continue;

    const rawUrl =
      extractTagContent(block, 'url') ||
      extractTagContent(block, 'link') ||
      extractAttributeValue(block, 'link', 'href');
    const url = resolveArticleUrl(rawUrl, config.baseOrigin);
    if (!url) continue;

    const rawDesc =
      extractTagContent(block, 'description') ||
      extractTagContent(block, 'summary') ||
      extractTagContent(block, 'content');
    let summary = stripHtmlToPlainText(rawDesc).replace(/Continue reading\.\.\.$/i, '').trim();
    if (summary.length > 260) {
      summary = summary.slice(0, 257).trimEnd() + '...';
    }
    if (!summary) {
      summary = title;
    }

    const rawPubDate =
      extractTagContent(block, 'pubDate') ||
      extractTagContent(block, 'published') ||
      extractTagContent(block, 'updated');
    const { iso, timeAgo } = computeTimeAgo(rawPubDate);

    // Legitimate image URL only if provided in feed tags (upgraded to https when needed)
    const rawImg =
      extractTagContent(block, 'coverImages') ||
      extractAttributeValue(block, 'media:thumbnail', 'url') ||
      extractAttributeValue(block, 'media:content', 'url') ||
      extractAttributeValue(block, 'enclosure', 'url');
    const safeImg = sanitizeHttpUrl(
      rawImg.startsWith('http://') ? rawImg.replace(/^http:\/\//i, 'https://') : rawImg
    );

    const idBase = Buffer.from(url).toString('base64url').slice(0, 16);

    articles.push({
      id: `${config.id}-${idBase}`,
      title,
      summary,
      source: config.name,
      sourceUrl: url,
      url,
      publishedTime: iso,
      category: categorizeArticle(title, summary),
      timeAgo,
      readTime: estimateReadTime(summary),
      imageUrl: safeImg,
      tags: buildTags(title, config.name),
    });
  }

  return articles;
}

function isPublicSafeHttpsUrl(raw: string): boolean {
  try {
    const u = new URL(raw);
    if (u.protocol !== 'https:') return false;
    const host = u.hostname.toLowerCase();
    if (
      host === 'localhost' ||
      host === '127.0.0.1' ||
      host === '0.0.0.0' ||
      host.endsWith('.local') ||
      host.startsWith('10.') ||
      host.startsWith('192.168.') ||
      /^172\.(1[6-9]|2\d|3[01])\./.test(host) ||
      host.startsWith('169.254.')
    ) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

export class RssCricketNewsProvider implements CricketNewsProvider {
  readonly id: string;
  readonly name: string;
  private readonly config: RssFeedConfig;

  constructor(config: RssFeedConfig) {
    this.id = config.id;
    this.name = config.name;
    this.config = config;
  }

  isEnabled(): boolean {
    return isPublicSafeHttpsUrl(this.config.url);
  }

  async fetchArticles(): Promise<ProviderFetchNewsResult> {
    if (!this.isEnabled()) {
      return {
        articles: [],
        provider: this.name,
        error: 'Feed URL is disabled or invalid.',
      };
    }

    try {
      const response = await fetch(this.config.url, {
        headers: {
          Accept: 'application/rss+xml, application/xml, text/xml;q=0.9, */*;q=0.8',
          'User-Agent': 'Cucuber-Cricket-News/2.0',
        },
        signal: AbortSignal.timeout(9000),
      });

      if (!response.ok) {
        return {
          articles: [],
          provider: this.name,
          error: `HTTP ${response.status} from ${this.name}`,
        };
      }

      const xml = await response.text();
      if (!xml || (!xml.includes('<item') && !xml.includes('<entry'))) {
        return {
          articles: [],
          provider: this.name,
          error: `No valid RSS/Atom items returned by ${this.name}`,
        };
      }

      const articles = parseRssOrAtomItems(xml, this.config);
      return {
        articles,
        provider: this.name,
      };
    } catch (err: any) {
      return {
        articles: [],
        provider: this.name,
        error: err?.message || `Network error fetching ${this.name}`,
      };
    }
  }
}

export function getConfiguredNewsProviders(): CricketNewsProvider[] {
  const feeds = [...DEFAULT_RSS_FEEDS];

  // Optional custom comma-separated RSS feeds configured by operator via server env
  const customEnv = (process.env.CRICKET_NEWS_RSS_FEEDS || '').trim();
  if (customEnv) {
    const urls = customEnv.split(',').map((s) => s.trim()).filter(Boolean);
    urls.forEach((rawUrl, i) => {
      if (isPublicSafeHttpsUrl(rawUrl)) {
        const parsed = new URL(rawUrl);
        feeds.push({
          id: `custom-rss-${i + 1}`,
          name: parsed.hostname.replace(/^www\./, ''),
          url: parsed.toString(),
          baseOrigin: parsed.origin,
        });
      }
    });
  }

  return feeds.map((cfg) => new RssCricketNewsProvider(cfg));
}
