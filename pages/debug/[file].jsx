import Head from 'next/head'
import axios from 'axios'
import {useEffect, useState} from 'react';
import useCollapse from 'react-collapsed';
import * as aesjs from 'aes-js'
import styles from '../../styles/debug.module.css'
import hljs from 'highlight.js/lib/common'
import 'highlight.js/styles/atom-one-dark.css'

function Page({ data, serverError }) {
    const [decrypted, setDecrypted] = useState(null);
    const [error, setError] = useState(serverError);

    useEffect(() => {
        if (data == null) {
            return;
        }

        let key = window.location ? window.location.hash : null;
        if (key && key.startsWith('#')) {
            key = key.substring(1);
        }
        if (!key) {
            setError("Decryption key not specified");
            return;
        }

        try {
            setDecrypted(decrypt(data, key));
        } catch (err) {
            setError(err);
        }
    }, []);

    if (error != null) {
        return <>
            <h1>Whoops, looks like something went wrong</h1>
            <p>{error.toString()}</p>
        </>
    }
    if (decrypted == null) {
        return <>
            <h2>Loading...</h2>
        </>
    }

    let files = [];
    let logs = [];
    decrypted.forEach((file, i) => {
        let name = file.name;
        if (name.startsWith("debug") && name.endsWith(".log")) {
            logs.push(file);
            return;
        } else if (logs.length !== 0) {
            files.push(<Logs logs={logs} key={i - 1}/>);
            logs = [];
        }
        files.push(<File file={file} key={i}/>);
    })

    return <>
        <Head>
            <title>Debug report</title>
            <meta name="viewport" content="width=400"/>
        </Head>

        <div className={styles.container}>
            <h1>Debug report</h1>
            {files}
        </div>
    </>
}

const logPattern = /\[(\w*)] (?:\[(\w*)])?/;

function Logs({ logs }) {
    const [ selected, setSelected ] = useState(0);
    const [ expanded, setExpanded ] = useState(true);
    const [ categories, setCategories ] = useState([]);
    const [ loadedContents, setLoadedContents ] = useState([]);
    const [ selectedCategory, setSelectedCategory ] = useState(null);

    useEffect(() => {
        let contents = [];
        logs.forEach(log => contents.push(log.content));
        loadedContents.forEach(content => contents.push(content));

        let levels = [];
        let gatheredCategories = [];

        contents.forEach(content => {
            if (!content) {
                return;
            }

            content.split("\n").forEach(line => {
                let match = line.match(logPattern);
                let level = match[1];
                let category = match[2];
                if (levels.indexOf(level) === -1) {
                    levels.push(level);
                }
                if (category && gatheredCategories.indexOf(category) === -1) {
                    gatheredCategories.push(category);
                }
            })
        });

        setCategories(gatheredCategories);
    }, [logs, loadedContents]);

    return (
        <>
            <div className={`${styles.fileControl} ${styles.logControl}`}>
                <h3>Debug logs</h3>
                {
                    logs.map((log, i) => {
                        return <button key={i} onClick={() => setSelected(i)} style={{width: "5rem"}}>{i === selected ? (i + 1) + " (Current)" : (i + 1)}</button>
                    })
                }
                <select onChange={event => setSelectedCategory(event.target.value)} className={styles.fileControl}>
                    <option value={null}>Uncategorized</option>
                    {
                        categories.map((cat, i) => <option key={i} value={cat}>{cat}</option>)
                    }
                </select>
            </div>
            <div>
                {
                    logs.map((log, i) => {
                        let control = null
                        if (i === selected) {
                            control = {
                                contentEditor: content => {
                                    let finalContent = "";
                                    content.split("\n").forEach(line => {
                                        let match = line.match(logPattern);
                                        let level = match[1];
                                        let category = match[2];
                                        if ((!category && selectedCategory === null) || category === selectedCategory) {
                                            finalContent += line + "\n";
                                        }
                                    });
                                    return finalContent.substring(0, finalContent.length - 1);
                                },
                                setExpanded: expanded => setExpanded(expanded),
                                expanded: expanded,
                                childLoadedContent: content => {
                                    let contents = loadedContents;
                                    contents.push(content);
                                    setLoadedContents(contents);
                                }
                            }
                        }

                        return (
                            <div key={i} style={{display: selected === i ? "block" : "none"}}>
                                {<File file={log} fileControl={control}/>}
                            </div>
                        )
                    })
                }
            </div>
        </>
    )
}

function File({ file, fileControl }) {
    const { getCollapseProps, isExpanded, setExpanded } = useCollapse({defaultExpanded: true, duration: 300});
    const [ rendered, setRendered ] = useState(null);
    const [ highlight, setHighlight ] = useState(false);

    const [ content, setContent ] = useState(file.content);
    const [ loading, setLoading ] = useState(false);
    const [ error, setError ] = useState(null);

    let currentContent = content;
    if (fileControl && currentContent && fileControl.contentEditor) {
        currentContent = fileControl.contentEditor(currentContent);
    }

    useEffect(() => {
        if (fileControl && fileControl.expanded !== isExpanded) {
            setExpanded(fileControl.expanded);
        }
    }, [fileControl]);

    useEffect(() => {
        if (highlight) {
            setRendered(hljs.highlightAuto(file.content).value);
        }
    }, [highlight]);

    useEffect(() => {
        if (!loading) {
            return;
        }
        get(file.url).then(result => {
            let content = decrypt(result, file.decryption_key).content;
            setContent(content);
            if (fileControl) {
                fileControl.childLoadedContent(content);
            }
        }).catch(err => {
            setError(err.message);
        });
    }, [loading]);

    return (
        <div className={styles.file}>
            <div className={styles.fileHeader}>
                <h4 className={styles.fileName}>{file.name}</h4>
                {
                    content != null ? (
                        <div className={`${styles.fileControl} ${styles.fileControlBar}}`}>
                            {
                                file.name.endsWith(".txt") || file.name.endsWith(".log") ? null :
                                    <button onClick={() => setHighlight(!highlight)}>{highlight ? "Plain" : "Highlight"}</button>
                            }
                            <button onClick={() => fileControl ? fileControl.setExpanded(!isExpanded) : setExpanded(!isExpanded)}>{isExpanded ? "Collapse" : "Show"}</button>
                        </div>
                    ) : null
                }
            </div>
            {
                currentContent != null ? (
                    <div
                        className={styles.fileContentWrapper}
                        {...getCollapseProps()}
                    >
                        <div className={styles.fileContent}>
                            {
                                highlight ?
                                    <div dangerouslySetInnerHTML={{__html: rendered != null ? rendered : "<div/>"}}/> :
                                    <div className={styles.plainTextWrapper}>
                                        <div className={styles.lineNumbers}>
                                            {
                                                currentContent.split("\n").map((line, i) => {
                                                    return <pre key={i}>{i + 1}</pre>
                                                })
                                            }
                                        </div>
                                        {
                                            <pre>{currentContent}</pre>
                                        }
                                    </div>
                            }
                        </div>
                    </div>
                ) : (
                    <div className={styles.bigFile}>
                        <p>This file is over 20,000 characters long.</p>
                        <div className={styles.fileControl}>
                            <button onClick={() => {
                                if (loading) {
                                    return;
                                }

                                setLoading(true);
                            }}>{loading ? (error ? "Failed, try again?" : "Loading...") : "Load file"}</button>
                        </div>
                        {error != null ? <p>{error}</p> : null}
                    </div>
                )
            }
        </div>
    )
}

function decrypt(data, decryptionKey) {
    decryptionKey = toArray(b64Decode(decryptionKey));
    const encrypted = toArray(b64Decode(data));
    if (decryptionKey.length < 32 || decryptionKey.length % 16 !== 0) {
        throw "Invalid length decryption key"
    }

    let iv = encrypted.subarray(0, 16);
    let content = encrypted.subarray(16);
    const aes = new aesjs.ModeOfOperation.cbc(decryptionKey, iv);

    let decrypted = aes.decrypt(content);
    // Remove padding
    decrypted = decrypted.subarray(0, decrypted.byteLength - decrypted[decrypted.byteLength - 1]);

    let decryptedString = aesjs.utils.utf8.fromBytes(decrypted);
    return JSON.parse(decryptedString);
}

function toArray(input) {
    return Uint8Array.from(input, c => c.charCodeAt(0));
}

function b64Decode(b64) {
    let standard = b64.replaceAll('-', '+').replaceAll('_', '/');
    return atob(standard);
}

async function get(url) {
    const res = await axios.get(url, { headers: { accept: "gzip" }, decompress: true});
    if (res.headers['content-type'] !== 'application/octet-stream') {
        throw {notFound: true};
    }
    const data = res.data;
    return data.files ? data.files[0].content : data
}

export async function getServerSideProps(context) {
    try {
        const { file } = context.query
        const data = await get(`https://bytebin.lucko.me/${file}`)

        return { props: { data } }
    } catch (err) {
        if ((err.response && err.response.status === 404) || err.notFound) {
            return { notFound: true }
        }
        return { props: { serverError: err.message } }
    }
}

export default Page