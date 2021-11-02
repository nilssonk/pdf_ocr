import { IncomingForm } from 'formidable'
import * as child_process from 'child_process'
import * as crypto from 'crypto'
import { promisify } from 'util'
import { transactions, ExecOutput } from './transaction_store'
import { IncomingMessage } from 'http'
import { NextApiRequest, NextApiResponse } from 'next'
import { join } from 'path'

export const config = {
    api: {
        bodyParser: false,
    },
}

function RunOCR(filePath: String) {
    const token = crypto.randomBytes(8) // 64-bit random token
    const id = token.toString('hex')

    const scriptPath = join(process.cwd(), 'pdf_ocr.sh')

    const promExec = promisify(child_process.exec)
    const promise = promExec(
        `${scriptPath} "${filePath}"`
    ) as Promise<ExecOutput>

    return { id: id, promise: promise }
}

export default async function Upload(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== 'POST') {
        // Invalid method
        return res.status(405)
    }

    const failed = (err: any) => {
        console.error(err)
        res.status(400).json('Failed')
    }

    const form = new IncomingForm({ maxFileSize: 30 * 1024 * 1024 } as any)

    const asyncParse = promisify((req: IncomingMessage, cb: Function) =>
        form.parse(req, (err, fields, files) =>
            cb(err, { fields: fields, files: files })
        )
    )

    await asyncParse(req)
        .then((result) => {
            //@ts-ignore
            const file = result.files.file

            const { id, promise } = RunOCR(file.path)

            if (transactions[id]) {
                return failed('Transaction already exists')
            }
            transactions[id] = {
                tmpfile: file.path,
                promise: promise,
            }

            res.status(200).json({ id: id })
        })
        .catch((err) => failed(err))
}
