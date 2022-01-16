import { rm } from "fs/promises";
import { NextApiRequest, NextApiResponse } from "next";
import { strict } from "assert";
import { promisify } from "util";
import { transactions } from "./transaction_store";
import { createReadStream, stat } from "fs";

const statPromise = promisify(stat);

function AssertValidPath(path: string) {
    strict.ok(path.startsWith("/tmp"), "Must be a TMP file");
    strict.ok(
        path.includes(".zip") || !path.includes("."),
        "Must either have a zip extension or no extension"
    );
    strict.ok(!path.includes("*"), "Must not contain any wildcards");
    strict.ok(!path.includes(".."), "Must not reverse relative");
}

export default async function GetResult(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== "GET") {
        // Invalid method
        return res.status(405);
    }

    const failed = (err: any) => {
        console.error(`Error: ${err}`);
        res.status(400).json("Failed");
    };

    const id = req.query.id;
    if (id == null || Array.isArray(id)) {
        return failed("Invalid array query");
    }

    const transaction = transactions[id];
    if (!transaction) {
        return failed(`Non-existent transaction with ID=${id}`);
    }

    const ocrPromise = transaction.promise;
    if (!ocrPromise) {
        delete transactions[id];
        return failed(`Invalid promise with ID=${id}`);
    }

    const output = await ocrPromise;
    if (output.stderr.length > 0) {
        return failed(output.stderr);
    }

    const path = output.stdout.trim();
    AssertValidPath(path);

    try {
        const fileStat = await statPromise(path);
        const rs = createReadStream(path);

        await new Promise((resolve, reject) => {
            res.writeHead(200, {
                "Content-Type": "application/zip",
                "Content-Length": fileStat.size
            });
            rs.on("end", resolve);
            rs.on("error", reject);
            rs.pipe(res);
        });
    } catch (err) {
        failed(err);
    } finally {
        await rm(path).catch((err) => console.error(`Error: ${err}`));
    }

    AssertValidPath(transaction.tmpfile);
    await rm(transaction.tmpfile).catch((err) =>
        console.error(`Error: ${err}`)
    );
    delete transactions[id];
}
