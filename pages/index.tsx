import Head from 'next/head'
import { Component, createRef, FormEvent, RefObject } from 'react'
import styles from '../styles/Home.module.css'
import { saveAs } from 'file-saver'
import { NextRouter, useRouter } from 'next/router'

enum UploadStatus {
    IDLE,
    UPLOADING,
    WORKING,
    FAILED,
}

const SubmitControl = ({status} : {status: UploadStatus}): JSX.Element => {
    switch (status) {
        case UploadStatus.IDLE:
            return <button type="submit">Upload</button>
        case UploadStatus.UPLOADING:
            return <div>Uploading...</div>
        case UploadStatus.WORKING:
            return <div>Working...</div>
        case UploadStatus.FAILED:
            return <div>Failed!</div>
        default:
            return <></>
    }
}

interface UploadFormState {
    fileInput: RefObject<HTMLInputElement>
    fileName: string
    status: UploadStatus
    basePath: string
}

interface UploadFormProps {
    basePath: string
}

class UploadForm extends Component<UploadFormProps, UploadFormState> {
    constructor(props: UploadFormProps) {
        super(props)

        this.state = {
            fileInput: createRef(),
            fileName: 'ocr_result',
            status: UploadStatus.IDLE,
            basePath: props.basePath,
        }
    }

    getResult = async (id: string) => {
        const result = await fetch(
            `${this.state.basePath}/api/results?id=${id}`,
            {
                method: 'GET',
            }
        )

        if (result.ok) {
            this.setState({ status: UploadStatus.IDLE })

            const name = this.state.fileName
            const new_name = name.endsWith('.pdf')
                ? name.substr(0, name.lastIndexOf('.pdf')) + '.zip'
                : name + '.zip'

            const blob = await result.blob()
            saveAs(blob, new_name)
        } else {
            this.setState({ status: UploadStatus.FAILED })
        }
    }

    handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault()

        if (
            !this.state.fileInput.current ||
            !this.state.fileInput.current.files ||
            !this.state.fileInput.current.files[0]
        ) {
            return
        }
        const file = this.state.fileInput.current.files[0]

        this.setState({ status: UploadStatus.UPLOADING, fileName: file.name })

        const formData = new FormData(event.currentTarget.value)
        formData.append('file', file)

        const upload_result = await fetch(
            `${this.state.basePath}/api/uploads`,
            {
                method: 'POST',
                body: formData,
            }
        )

        if (upload_result.ok) {
            this.setState({ status: UploadStatus.WORKING })

            const upload_json = await upload_result.json()
            await this.getResult(upload_json.id)
        } else {
            this.setState({ status: UploadStatus.FAILED })
        }
    }

    render = () => {
        return (
            <>
                <h2>File upload</h2>
                <div className={styles.card}>
                    <form onSubmit={this.handleSubmit}>
                        <ul>
                            <li>
                                <input
                                    id="file"
                                    type="file"
                                    ref={this.state.fileInput}
                                    required
                                />
                            </li>
                            <li>
                                <SubmitControl status={this.state.status} />
                            </li>
                        </ul>
                    </form>
                </div>
                <style jsx>{`
                    ul {
                        margin: 2em;
                        list-style-type: none;
                    }
                    li {
                        margin: 1em;
                    }
                    div {
                        margin: 1em;
                        padding: 0.5em;
                        border: 1px solid #000000;
                    }
                `}</style>
            </>
        )
    }
}

export default function Home() {
    const router = useRouter()

    return (
        <div className={styles.container}>
            <Head>
                <title>PDF OCR</title>
                <link rel="icon" href="/favicon.ico" />
            </Head>

            <main className={styles.main}>
                <h1 className={styles.title}>PDF OCR</h1>
                <UploadForm basePath={router.basePath} />
            </main>

            <footer className={styles.footer}></footer>
        </div>
    )
}
