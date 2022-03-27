import Head from 'next/head'
import {useEffect, useState} from 'react';
import styles from '../../styles/debug.module.css'
import 'highlight.js/styles/atom-one-dark.css'
import Logs from "../../components/debug/files/logs";
import File from "../../components/debug/files/debug_file";
import SettingsModal, {STORAGE_EXPANDED_BY_DEFAULT} from "../../components/debug/settings_modal";
import TableOfContents from "../../components/debug/files/table_of_contents";
import {decrypt, getFromPaste} from "../../util/debug";

const LOCAL_STORAGE_KEY = "debug_options";

function Page({ data, serverError }) {
    const [ decryptedData, setDecryptedData ] = useState(null);
    const [ error, setError ] = useState(serverError);
    const [ allExpanded, setAllExpanded ] = useState(true);
    const [ settingsOpen, setSettingsOpen ] = useState(false);
    const [ settings, setSettings ] = useState(null);

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
            setDecryptedData(decrypt(data, key));
        } catch (err) {
            setError(err);
        }
    }, [data]);

    useEffect(() => {
        // Changes the hash to itself after decryption so the browser jumps to the desired file
        // It's not silly if it works.

        // noinspection SillyAssignmentJS
        window.location.hash = window.location.hash;
    }, [decryptedData]);

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
    decryptedData.forEach((file, i) => {
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
            <TableOfContents headings={tableOfContents} settings={settings} changeSettings={changeSettings}/>
            {files}
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
