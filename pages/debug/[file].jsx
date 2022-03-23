import Head from 'next/head'
import axios from 'axios'
import {useEffect, useState} from 'react';
import useCollapse from 'react-collapsed';
import * as aesjs from 'aes-js'
import styles from '../../styles/debug.module.css'
import hljs from 'highlight.js/lib/common'
import 'highlight.js/styles/atom-one-dark.css'
import Modal from "../../components/modal";

const STORAGE_EXPANDED_BY_DEFAULT = "expandedByDefault";
const STORAGE_TABLE_OF_CONTENTS_OPEN = "tableOfContentsOpen";

function Page({ data, serverError }) {
    const [ decrypted, setDecrypted ] = useState(null);
    const [ error, setError ] = useState(serverError);
    const [ allExpanded, setAllExpanded ] = useState(true);
    const [ settingsOpen, setSettingsOpen ] = useState(false);

    useEffect(() => {
        // Load settings from localstorage
        let byDefault = window.localStorage.getItem(STORAGE_EXPANDED_BY_DEFAULT);
        if (!byDefault) {
            window.localStorage.setItem(STORAGE_EXPANDED_BY_DEFAULT, "true");
            byDefault = "true";
        }
        setAllExpanded(byDefault === "true")
    }, []);

    useEffect(() => {
        if (data == null) {
            return;
        }

        // Load the initial file
        let key = window.location ? window.location.hash : null;
        if (key && key.startsWith('#')) {
            key = key.substring(1);
        }
        let indexOf = key.indexOf("#");
        if (indexOf !== -1) {
            key = key.substring(0, indexOf);
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
    }, [data]);

    useEffect(() => {
        // Changes the hash to itself after decryption so the browser jumps to the desired file
        // It's not silly if it works.

        // noinspection SillyAssignmentJS
        window.location.hash = window.location.hash;
    }, [decrypted]);

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

    let location = window.location ? window.location.hash : "";
    if (location.startsWith("#")) {
        location = location.substring(1);
    }
    let lastIndex = location.lastIndexOf("#");
    if (lastIndex !== -1) {
        location = location.substring(0, lastIndex);
    }

    // Keep track of controls, so we can check if we need to change the "Collapse all" / "Show all" button based on
    // all the files being in the opposite status
    let fileControls = [];
    function makeControl() {
        let control = {expanded: allExpanded, notifyExpanded: () => {
            let fail = true;
            fileControls.forEach(control => {
                if (control.currentExpanded === allExpanded) {
                    fail = false;
                }
            });

            if (fail) {
                setAllExpanded(!allExpanded);
            }
        }};
        fileControls.push(control);
        return control;
    }

    let tableOfContents = [];
    let files = [];
    let logs = [];
    decrypted.forEach((file, i) => {
        let name = file.name;
        if (name.startsWith("debug") && name.endsWith(".log")) {
            logs.push(file);
            return;
        } else if (logs.length !== 0) {
            let currentLocation = location + "#logs";
            let control = makeControl();
            tableOfContents.push(<a key={i - 1} onClick={() => {
                control.expand(true)
                setTimeout(() => window.location.hash = "#" + currentLocation, control.currentExpanded ? 0 : 500);
            }}>Debug Logs</a>);
            files.push(<Logs id={currentLocation} logs={logs} key={i - 1} fileControl={control}/>);
            logs = [];
        }

        let currentLocation = location + "#" + file.name;
        let control = makeControl();
        tableOfContents.push(<a key={i} onClick={() => {
            control.expand(true)
            setTimeout(() => window.location.hash = "#" + currentLocation, control.currentExpanded ? 0 : 500);
        }}>{file.name}</a>);
        files.push(<File id={currentLocation} file={file} key={i} lineNumbers={true} fileControl={control}/>);
    });

    return <>
        <Head>
            <title>DiscordSRV | Debug report</title>
            <meta name="viewport" content="width=400"/>
        </Head>

        <div className={styles.container}>
            <div className={styles.heading}>
                <a href={"#" + location}>
                    <h1>Debug report</h1>
                </a>
                <div className={`${styles.fileControl} ${styles.appControl}`}>
                    <button onClick={() => setSettingsOpen(true)}>Settings</button>
                    <button onClick={() => setAllExpanded(!allExpanded)} style={{width: "5rem"}}>{allExpanded ? "Collapse all" : "Expand all"}</button>
                </div>
            </div>
            <TableOfContents headings={tableOfContents}/>
            {files}
        </div>
        <SettingsModal open={settingsOpen} close={() => setSettingsOpen(false)}/>
    </>
}

function SettingsModal({ open, close }) {
    let expandedByDefault = window.localStorage.getItem(STORAGE_EXPANDED_BY_DEFAULT) === "true";
    return (
        <Modal title="Settings" open={open} close={close}>
            <label>
                Expand files by default&nbsp;
                <input type="checkbox" onChange={event => window.localStorage.setItem(STORAGE_EXPANDED_BY_DEFAULT, event.target.checked.toString())} defaultChecked={expandedByDefault}/>
            </label>
        </Modal>
    )
}

function TableOfContents({ headings }) {
    let control = {
        expanded: window.localStorage.getItem(STORAGE_TABLE_OF_CONTENTS_OPEN) === "true",
    };
    control.notifyExpanded = () => window.localStorage.setItem(STORAGE_TABLE_OF_CONTENTS_OPEN, control.currentExpanded.toString())

    return (
        <File file={{
            name: "Table of contents",
            content: (<div className={styles.tableOfContents}>{headings}</div>)
        }} fileControl={control}/>
    )
}

const logPattern = /\[(\w*)] (?:\[(\w*)])?/;

function Logs({ id, logs, fileControl }) {
    const [ selected, setSelected ] = useState(0);
    const [ isExpanded, setExpanded ] = useState(true);
    const [ categories, setCategories ] = useState([]);
    const [ loadedContents, setLoadedContents ] = useState([]);
    const [ selectedCategory, setSelectedCategory ] = useState(null);

    // Give fileControl our current expanded status
    fileControl.currentExpanded = isExpanded;
    fileControl.expand = expanded => setExpanded(expanded);

    useEffect(() => {
        // Update expanded status based on fileControl's expanded status
        setExpanded(fileControl.expanded);
    }, [fileControl.expanded]);

    // Figure out what loggers & log levels are in the logs
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
            <div id={id} className={`${styles.fileControl} ${styles.logControl}`}>
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
                                setExpanded: expanded => {
                                    setExpanded(expanded);

                                    // Notify fileControl of the expanded status changing
                                    if (fileControl && fileControl.notifyExpanded) {
                                        fileControl.currentExpanded = !isExpanded;
                                        fileControl.notifyExpanded();
                                    }
                                },
                                expanded: isExpanded,
                                childLoadedContent: content => {
                                    let contents = loadedContents;
                                    contents.push(content);
                                    setLoadedContents(contents);
                                }
                            }
                        }

                        return (
                            <div key={i} style={{display: selected === i ? "block" : "none"}}>
                                {<File file={log} fileControl={control} lineNumbers={true}/>}
                            </div>
                        )
                    })
                }
            </div>
        </>
    )
}

function File({ id, file, fileControl, lineNumbers }) {
    const { getCollapseProps, isExpanded, setExpanded } = useCollapse({defaultExpanded: true, duration: 300});
    const [ rendered, setRendered ] = useState(null);
    const [ highlight, setHighlight ] = useState(false);

    const [ content, setContent ] = useState(file.content);
    const [ loading, setLoading ] = useState(false);
    const [ error, setError ] = useState(null);

    let currentContent = content;
    if (fileControl) {
        if (currentContent && fileControl.contentEditor) {
            // Apply changes to content based on the fileControl's contentEditor function, if available
            currentContent = fileControl.contentEditor(currentContent);
        }

        // Give fileControl the current expanded status of this file
        fileControl.currentExpanded = isExpanded;
        fileControl.expand = expanded => setExpanded(expanded);
    }

    // Update the expanded status if fileControl's expanded status changes
    let expanded = fileControl ? fileControl.expanded : fileControl;
    useEffect(() => {
        if (fileControl && fileControl.expanded !== isExpanded) {
            setExpanded(fileControl.expanded);
        }

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [expanded]);

    // Render if highlighting is enabled
    useEffect(() => {
        if (highlight) {
            setRendered(hljs.highlightAuto(file.content).value);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [highlight]);

    // File downloading logic
    useEffect(() => {
        if (!loading) {
            // Prevent running during initial render
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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [loading]);

    return (
        <div id={id} className={styles.file}>
            <div className={styles.fileHeader}>
                <h4 className={styles.fileName}>{file.name}</h4>
                {
                    content != null ? (
                        <div className={`${styles.fileControl} ${styles.fileControlBar}`}>
                            {
                                file.name.indexOf(".") === -1 || file.name.endsWith(".txt") || file.name.endsWith(".log") ? null :
                                    <button onClick={() => setHighlight(!highlight)}>{highlight ? "Plain" : "Highlight"}</button>
                            }
                            <button onClick={() => {
                                // Use either the fileControl's expanding function or this file's expanded state
                                // based on if the fileControl has an expanding function or not
                                if (fileControl && fileControl.setExpanded) {
                                    fileControl.setExpanded(!isExpanded)
                                } else {
                                    setExpanded(!isExpanded)
                                }

                                // Notify fileControl of the expanded status changing
                                if (fileControl && fileControl.notifyExpanded) {
                                    fileControl.currentExpanded = !isExpanded;
                                    fileControl.notifyExpanded();
                                }
                            }}>{isExpanded ? "Collapse" : "Expand"}</button>
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
                                        {
                                            !lineNumbers ? null : (
                                                <div className={styles.lineNumbers}>
                                                    {
                                                        currentContent.split("\n").map((line, i) => {
                                                            return <pre key={i}>{i + 1}</pre>
                                                        })
                                                    }
                                                </div>
                                            )
                                        }
                                        {
                                            <pre>{currentContent}</pre>
                                        }
                                    </div>
                            }
                        </div>
                    </div>
                ) : (
                    <div className={styles.bigFile}>
                        <p>This file is {file.length.toLocaleString('en-US')} characters long. It wasn&apos;t loaded to prevent overloading your browser.</p>
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

// noinspection JSUnusedGlobalSymbols
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

// noinspection JSUnusedGlobalSymbols
export default Page
