"use client"
import {createContext, useEffect, useState} from 'react';
import styles from './debugclient.module.css'
import Logs from "./(components)/files/logs";
import SettingsModal, {
    POLITICS,
    STORAGE_EXPANDED_BY_DEFAULT
} from "./(components)/settings_modal";
import TableOfContents from "./(components)/files/table_of_contents";
import {b64Decode, decrypt, getFromBin, getFromBytebin} from "./(util)/util";
import Environment from "./(components)/files/environment";
import Plugins from "./(components)/files/plugins";
import MultiFiles from "./(components)/files/multi_files";
import {politics_summary} from "./(util)/politics_util";
import DebugFile from "./(components)/files/debug_file";

const LOCAL_STORAGE_KEY = "debug_options";

export const SettingsContext = createContext({});

export default function DebugClient({ params, serverError, legacy, preDecryptedData }) {
    "use client"
    const { file } = params;

    const [ data, setData ] = useState(null);

    const [ decryptedData, setDecryptedData ] = useState(preDecryptedData);
    const [ error, setError ] = useState(serverError);

    const [ allExpanded, setAllExpanded ] = useState(true);

    const [ settingsOpen, setSettingsOpen ] = useState(false);
    const [ settings, setSettings ] = useState(null);

    const [ hash, setHash ] = useState(null);
    const [ location, setLocation ] = useState(null);

    const [ debugFiles, setFiles ] = useState([]);
    const [ politics, setPolitics ] = useState(null);

    function changeSettings(settings) {
        setSettings({...settings});
        window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(settings));
    }

    useEffect(() => {
        if (!file || !hash) {
            return;
        }

        async function queryLegacyData() {
            let data = await getFromBin(`/api/bincors/${file}`);
            let files = data.files;

            let decryptedFiles = [];
            for (const file of files) {
                let name = await decrypt(b64Decode(file.name), hash);
                let content = await decrypt(b64Decode(file.content), hash);

                decryptedFiles.push({ name: name, content: content });
            }
            setDecryptedData(decryptedFiles);
        }

        async function queryData() {
            let data;
            if (file?.length > 16) {
                data = await getFromBin(`/api/bincors/${file}`).files[0].content;
            } else {
                data = await getFromBytebin(`https://bytebin.lucko.me/${file}`);
            }
            setData(data);
        }

        (legacy ? queryLegacyData() : queryData()).catch(err => setError(err)).then(() => {});
    }, [file, hash, legacy]);

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

        if (!location) {
            // Fail on missing hash (decryption key)
            setError("Decryption key not specified");
        }
    }, []);

    // Decrypt data
    useEffect(() => {
        if (!data || !hash) {
            return;
        }

        async function getData() {
            try {
                const decrypted = await decrypt(b64Decode(data), b64Decode(hash));
                setDecryptedData(JSON.parse(decrypted));
            } catch (err) {
                setError(err);
            }
        }
        getData();
    }, [data, hash]);

    useEffect(() => {
        if (!decryptedData) {
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
        let config = [];
        let messageConfigs = [];

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

            if (name.endsWith("config.yaml")) {
                file.label = name.startsWith("parsed") ? "Parsed" : "Disk";
                config.push(file);
                return;
            } else if (config.length !== 0) {
                create(
                    "Config",
                    (id, fileControl, key) => <MultiFiles id={id} fileControl={fileControl} key={key} files={config} header="Config"/>
                );
                config = [];
            }

            if (name.endsWith("messages.yaml")) {
                let isParsed = name.startsWith("parsed_");
                let split = name.split("_", 3);
                let lang = split.length === 3 ? split[2] : null;

                file.label = (isParsed ? "Parsed" : "Disk") + (lang ? " (" + lang + ")" : "");
                messageConfigs.push(file);
                return;
            } else if (messageConfigs.length !== 0) {
                create(
                    "Messages",
                    (id, fileControl, key) => <MultiFiles id={id} fileControl={fileControl} key={key} files={messageConfigs} header="Messages"/>
                );
                messageConfigs = [];
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
                    (id, fileControl, key) => <DebugFile id={id} fileControl={fileControl} key={key} file={file}/>
                );
            }
        });

        setFiles(files);

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [decryptedData]);

    useEffect(() => {
        if (!decryptedData || !settings) {
            return;
        }

        if (settings[POLITICS] === true) {
            setPolitics(politics_summary(decryptedData));
        } else {
            setPolitics(null);
        }
    }, [decryptedData, settings]);

    useEffect(() => {
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
        });
    }, [allExpanded, debugFiles]);

    useEffect(() => {
        // Changes the hash to itself after decryption so the browser jumps to the desired file
        // It's not silly if it works.

        // noinspection SillyAssignmentJS
        window.location.hash = window.location.hash;
    }, [debugFiles]);

    if (error != null) {
        console.log(error);
        return (
            <div style={{margin: "3rem"}}>
                <h1>Whoops, looks like something went wrong</h1>
                <p>{error.toString()}</p>
            </div>
        )
    }
    if (!debugFiles || debugFiles.length === 0) {
        return <>
            <h2>Loading...</h2>
        </>
    }

    return <>
        <div className={styles.container}>
            <div className={styles.heading}>
                <a href={"#" + hash}>
                    <h1>{legacy ? "Bin" : "Debug report"}</h1>
                </a>
                {
                    !!politics && (
                        <div style={{display: "flex", flexDirection: "column"}}>
                            <p>Politics enabled</p>
                            {politics.map((file, i) => {
                                return (
                                    <table key={i}>
                                        <thead>
                                        <tr>
                                            <th>{file.name}</th>
                                            <th></th>
                                        </tr>
                                        </thead>
                                        <tbody>
                                        {file.files.map((file, i2) => <tr key={i2}><td>{file.name}</td><td>{file.count}</td></tr>)}
                                        </tbody>
                                    </table>
                                )
                            })}
                        </div>
                    )
                }
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
            <SettingsContext.Provider value={settings}>
                {debugFiles.map(file => file.jsx)}
            </SettingsContext.Provider>
        </div>
        <SettingsModal open={settingsOpen} close={() => setSettingsOpen(false)} settings={settings} changeSettings={changeSettings}/>
    </>
}

