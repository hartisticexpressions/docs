import getLinkData from '../lib/get-link-data.js'

// this middleware adds properties to the context object
export default async function featuredLinks (req, res, next) {
  if (!req.context.page) return next()

  if (!(req.context.page.relativePath.endsWith('index.md') || req.context.page.layout === 'product-landing')) return next()

  if (!req.context.page.featuredLinks) return next()

  req.context.featuredLinks = {}
  for (const key in req.context.page.featuredLinks) {
    req.context.featuredLinks[key] = await getLinkData(req.context.page.featuredLinks[key], req.context)
  }

  return next()
}
