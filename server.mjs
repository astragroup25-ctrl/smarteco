import http from 'node:http'
import next from 'next'

const dev = process.env.NODE_ENV !== 'production'
const hostname = process.env.HOST || '0.0.0.0'
const port = Number.parseInt(process.env.PORT || '80', 10)

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error(`PORT invalide: ${process.env.PORT}`)
}

const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

await app.prepare()

const server = http.createServer((request, response) => {
  // Le portail captif reste volontairement en HTTP: aucune redirection HTTPS.
  handle(request, response)
})

server.listen(port, hostname, () => {
  console.log(`SMART.ECO écoute sur http://${hostname}:${port}`)
})