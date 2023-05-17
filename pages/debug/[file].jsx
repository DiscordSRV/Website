import Head from 'next/head'
import {useEffect, useState} from 'react';
import styles from '../../styles/debug.module.css'
import Logs from "../../components/debug/files/logs";
import File from "../../components/debug/files/debug_file";
import SettingsModal, {STORAGE_EXPANDED_BY_DEFAULT} from "../../components/debug/settings_modal";
import TableOfContents from "../../components/debug/files/table_of_contents";
import {decrypt, getFromPaste} from "../../util/debug";
import Environment from "../../components/debug/files/environment";
import Plugins from "../../components/debug/files/plugins";

const LOCAL_STORAGE_KEY = "debug_options";

function Page({ data, serverError }) {
    const [ decryptedData, setDecryptedData ] = useState(null);
    const [ error, setError ] = useState(serverError);

    const [ allExpanded, setAllExpanded ] = useState(true);

    const [ settingsOpen, setSettingsOpen ] = useState(false);
    const [ settings, setSettings ] = useState(null);

    const [ hash, setHash ] = useState(null);
    const [ location, setLocation ] = useState(null);

    const [ debugFiles, setFiles ] = useState([]);

    function changeSettings(settings) {
        setSettings(settings);
        window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(settings));
    }

    useEffect(() => {
        // Load options from localStorage
        let value = window.localStorage.getItem(LOCAL_STORAGE_KEY);
        if (!value) {
            changeSettings({});
            return;
        }

        let settings = JSON.parse(value);
        setSettings(settings);
        setAllExpanded(settings[STORAGE_EXPANDED_BY_DEFAULT] === true);
    }, []);

    useEffect(() => {
        let location = window.location ? window.location.hash : "";
        if (location.startsWith("#")) {
            location = location.substring(1);
        }
        let lastIndex = location.lastIndexOf("#");
        if (lastIndex !== -1) {
            setLocation(location.substring(lastIndex + 1));
            location = location.substring(0, lastIndex);
        }
        setHash(location);
    }, []);

    // Decrypt data
    useEffect(() => {
        if (data == null || hash == null) {
            return;
        }

        // Load the initial file
        let key = hash;
        if (!key) {
            setError("Decryption key not specified");
            return;
        }

        try {
            setDecryptedData(decrypt(data, key));
        } catch (err) {
            setError(err);
        }
    }, [data, hash]);

    useEffect(() => {
        if (decryptedData == null) {
            return;
        }

        let files = [];

        function create(name, jsx) {
            let id = hash + "#" + name.toLowerCase();
            let key = files.length;

            let control = {
                defaultExpanded: allExpanded || name.toLowerCase() === location
            };

            let tableOfContents = (
                <a key={key} onClick={() => {
                    control.setExpanded(true);
                    setTimeout(() => window.location.hash = "#" + id, control.isExpanded() ? 0 : 500);
                }}>{name}</a>
            );

            files.push({
                control: control,
                toc: tableOfContents,
                jsx: jsx(id, control, key)
            });
        }

        let logs = [];
        decryptedData.forEach(file => {
            let name = file.name;
            if (name.startsWith("debug") && name.endsWith(".log")) {
                logs.push(file);
                return;
            } else if (logs.length !== 0) {
                create(
                    "Logs",
                    (id, fileControl, key) => <Logs id={id} fileControl={fileControl} key={key} logs={logs}/>
                );
                logs = [];
            }

            if (name === "environment.json") {
                create(
                    "Environment",
                    (id, fileControl, key) => <Environment id={id} fileControl={fileControl} key={key} file={file}/>
                );
            } else if (name === "plugins.json") {
                create(
                    "Plugins",
                    (id, fileControl, key) => <Plugins id={id} fileControl={fileControl} key={key} file={file}/>
                );
            } else {
                create(
                    name,
                    (id, fileControl, key) => <File id={id} fileControl={fileControl} key={key} file={file}/>
                );
            }
        });

        setFiles(files);

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [decryptedData]);

    debugFiles.forEach(file => {
        file.control.setExpandedParent = expanded => {
            file.control.setExpanded(expanded);

            let fail = true;
            for (let i = 0; i < debugFiles.length; i++) {
                let control = debugFiles[i].control;
                if ((control === file.control ? expanded : control.isExpanded()) === allExpanded) {
                    fail = false;
                }
            }
            if (fail) {
                setAllExpanded(!allExpanded);
            }
        }
    })

    useEffect(() => {
        // Changes the hash to itself after decryption so the browser jumps to the desired file
        // It's not silly if it works.

        // noinspection SillyAssignmentJS
        window.location.hash = window.location.hash;
    }, [debugFiles]);

    if (error != null) {
        return <>
            <h1>Whoops, looks like something went wrong</h1>
            <p>{error.toString()}</p>
        </>
    }
    if (decryptedData == null) {
        return <>
            <h2>Loading...</h2>
        </>
    }

    return <>
        <Head>
            <title>DiscordSRV | Debug report</title>
            <meta name="viewport" content="width=400"/>
        </Head>

        <div className={styles.container}>
            <div className={styles.heading}>
                <a href={"#" + hash}>
                    <h1>Debug report</h1>
                </a>
                <div className={`${styles.fileControl} ${styles.appControl}`}>
                    <button onClick={() => setSettingsOpen(true)}>Settings</button>
                    <button onClick={() => {
                        setAllExpanded(!allExpanded);
                        debugFiles.forEach(file => {
                            if (file.control?.setExpanded) {
                                file.control.setExpanded(!allExpanded);
                            }
                        })
                    }} style={{width: "5rem"}}>{allExpanded ? "Collapse all" : "Expand all"}</button>
                </div>
            </div>
            <TableOfContents headings={debugFiles.map(file => file.toc)} settings={settings} changeSettings={changeSettings}/>
            {debugFiles.map(file => file.jsx)}
        </div>
        <SettingsModal open={settingsOpen} close={() => setSettingsOpen(false)} settings={settings} changeSettings={changeSettings}/>
    </>
}

// noinspection JSUnusedGlobalSymbols
export async function getServerSideProps(context) {
    try {
        const { file } = context.query
        const data = await getFromPaste(`https://bytebin.lucko.me/${file}`)

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
