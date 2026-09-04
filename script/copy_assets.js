import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const fromFilePath = path.join(
    path.dirname(path.dirname(fileURLToPath(import.meta.url))),
    'src/',
    'template/',
    'mail_code.html'
)
const toFilePath = path.join(
    path.dirname(path.dirname(fileURLToPath(import.meta.url))),
    'dist/',
    'template/',
    'mail_code.html'
)

fs.mkdirSync(path.dirname(toFilePath), { recursive: true })
fs.copyFileSync(fromFilePath, toFilePath)
