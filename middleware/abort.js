export default function abort (req, res, next) {
  // If the client aborts the connection, send an error
  req.once('aborted', () => {
    // ignore aborts from next, usually has to do with webpack-hmr
    if (req.path.startsWith('/_next')) {
      return
    }
    // NOTE: Node.js will also automatically set `req.aborted = true`

    const abortError = new Error('Client closed request')
    abortError.statusCode = 499
    abortError.code = 'ECONNRESET'

    // Pass the error to the Express error handler
    return next(abortError)
  })

  return next()
}
