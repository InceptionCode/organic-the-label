const BOT_UA =
  /bot|crawl|spider|slurp|scrape|fetch|preview|facebookexternalhit|embedly|quora link|whatsapp|telegram|discord|slack|skype|vkshare|pinterest|bingpreview|headless|phantom|puppeteer|playwright|selenium|lighthouse|pagespeed|gtmetrix|curl|wget|python|java\/|go-http|okhttp|axios|node-fetch|undici|httpclient|libwww|monitor|uptime/i

export function isBot(userAgent: string | null | undefined): boolean {
  const ua = userAgent?.trim()
  return !ua || BOT_UA.test(ua)
}
