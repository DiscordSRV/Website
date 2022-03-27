import Head from 'next/head'
import {useEffect, useState} from 'react';
import styles from '../../styles/debug.module.css'
import 'highlight.js/styles/atom-one-dark.css'
import Logs from "../../components/debug/files/logs";
import File from "../../components/debug/files/debug_file";
import SettingsModal, {STORAGE_EXPANDED_BY_DEFAULT} from "../../components/debug/settings_modal";
import TableOfContents from "../../components/debug/files/table_of_contents";
import {decrypt, getFromPaste} from "../../util/debug";
//import Environment from "../../components/debug/files/environment";

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

        let control = makeControl();
        let currentLocation = location + "#" + file.name;
        let jsx = <File id={currentLocation} file={file} key={i} lineNumbers={true} fileControl={control}/>;
        if (name === "environment.json") {
            jsx = <Environment id={currentLocation} file={file} key={i} fileControl={control}/>
            name = "Environment"
        }

        tableOfContents.push(<a key={i} onClick={() => {
            control.expand(true)
            setTimeout(() => window.location.hash = "#" + currentLocation, control.currentExpanded ? 0 : 500);
        }}>{name}</a>);
        files.push(jsx);
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

//
// Environment file
//

const ERROR = "error";
const WARNING = "warning";
const OK = "ok";
const INFO = "info";

function Environment({ id, file, fileControl }) {
    const content = JSON.parse(file.content);

    return (
        <File id={id} file={{
            name: "Environment",
            content: (
                <div className={styles.environmentCardStack}>
                    <DiscordSRVCard discordSRV={content.discordSRV}/>
                    <VersionCard version={content.version} gitRevision={content.gitRevision} gitBranch={content.gitBranch}/>
                    <StatusCard status={content.status} jdaStatus={content.jdaStatus}/>
                    <OnlineModeCard onlineMode={content.onlineMode}/>
                    <JavaCard javaVersion={content.javaVersion} javaVendor={content.javaVendor}/>
                    <CPUCard cores={content.cores} docker={content.docker}/>
                    <MemoryCard free={content.freeMemory} total={content.totalMemory} max={content.maxMemory}/>
                    <DiskCard usable={content.usableSpace} total={content.totalSpace}/>
                    <LoggerCard platformLogger={content.platformLogger}/>
                </div>
            )
        }} fileControl={fileControl} noText={true}/>
    )
}

function DiscordSRVCard({ discordSRV }) {
    const known = {
        "com.discordsrv.bukkit.BukkitDiscordSRV": "Bukkit",
        "com.discordsrv.bungee.BungeeDiscordSRV": "Bungee",
        "com.discordsrv.sponge.SpongeDiscordSRV": "Sponge",
        "com.discordsrv.velocity.VelocityDiscordSRV": "Velocity"
    }
    let platform = known[discordSRV];
    if (platform) {
        return <EnvironmentCard title="Platform" content={platform + "\n(Official)"} status={OK}/>
    } else {
        return <EnvironmentCard title="Platform" content={discordSRV + "\n(Unofficial)"} status={ERROR}/>
    }
}

function VersionCard({ version, gitRevision, gitBranch }) {
    return <EnvironmentCard title="Version" content={version + " (" + gitBranch + ")\n" + gitRevision} status={INFO}/>
}

function StatusCard({ status, jdaStatus }) {
    return <EnvironmentCard title="Status" content={status + "\n(JDA: " + jdaStatus + ")"} status={status === "CONNECTED" ? OK : WARNING}/>
}

function OnlineModeCard({ onlineMode }) {
    return <EnvironmentCard title="Online Mode" content={onlineMode} status={onlineMode === "OFFLINE" ? ERROR : OK}/>
}

function JavaCard({ javaVersion, javaVendor }) {
    const LTS = [8, 11, 17];
    const CURRENT = 18;

    let status = INFO;
    try {
        if (javaVersion.indexOf("\.") !== -1) {
            javaVersion = javaVersion.split("\.")[javaVersion.startsWith("1.") ? 1 : 0];
        }

        let version = Number(javaVersion);
        if (version >= CURRENT /* Current or newer */ || version === LTS[LTS.length - 1] /* Latest LTS */) {
            status = OK;
        } else if (LTS.indexOf(version) !== -1 /* LTS */) {
            status = WARNING;
        } else {
            status = ERROR;
        }
    } catch (error) {
        console.log("Failed to parse java version", error);
    }

    return <EnvironmentCard title="Java Version" content={javaVersion + "\n" + javaVendor} status={status}/>
}

function CPUCard({ cores, docker }) {
    return <EnvironmentCard title="CPU Cores" content={cores + (docker ? " (Running in docker)" : "")} status={cores === 1 ? WARNING : OK}/>
}

const GIG = 1000000; // 1GB
function MemoryCard({ free, total, max }) {
    return <EnvironmentCard title="Memory" content={
        prettifyBytes(free) + " Free\n" +
        prettifyBytes(total) + " Total\n" +
        (max > 0 ? prettifyBytes(max) : "Unlimited") + " Max"
    } status={max > 0 && max < GIG ? WARNING : INFO}/>
}

function DiskCard({ usable, total }) {
    return <EnvironmentCard title="Disk" content={
        prettifyBytes(usable) + " Usable\n" +
        prettifyBytes(total) + " Total"
    } status={usable < GIG ? WARNING : INFO}/>
}

const PB = Math.pow(10, 15);
const TB = Math.pow(10, 12);
const GB = Math.pow(10, 9);
const MB = Math.pow(10, 6);
const KB = Math.pow(10, 3);
function prettifyBytes(bytes) {
    if (bytes >= PB) {
        return roundTo2Decimals(bytes / PB) + "PB";
    } else if (bytes >= TB) {
        return roundTo2Decimals(bytes / TB) + "TB";
    } else if (bytes >= GB) {
        return roundTo2Decimals(bytes / GB) + "GB";
    } else if (bytes >= MB) {
        return roundTo2Decimals(bytes / MB) + "MB";
    } else if (bytes >= KB) {
        return roundTo2Decimals(bytes / KB) + "kB";
    } else {
        return bytes + " bytes";
    }
}

function roundTo2Decimals(input) {
    return Math.round(input * 100) / 100;
}

function LoggerCard({ platformLogger }) {
    return <EnvironmentCard title="Logger" content={platformLogger} status={INFO}/>
}

function EnvironmentCard({ title, content, status }) {
    let statusClass = getStatusClass(status);

    return (
        <div className={`${styles.environmentCard} ${statusClass}`}>
            <h4>{title}</h4>
            <p>{content}</p>
        </div>
    )
}

function getStatusClass(status) {
    switch (status) {
        case ERROR: return styles.environmentError;
        case WARNING: return styles.environmentWarning;
        case OK: return styles.environmentOK;
        case INFO: return styles.environmentInfo;
        default: return "";
    }
}
