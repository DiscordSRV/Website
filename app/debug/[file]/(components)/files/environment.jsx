import {FileDisplay} from "./debug_file";
import styles from "../../debug.module.css";
import {useEffect, useState} from "react";
import Index from "../../../../(components)/modal";

const ERROR = "error";
const WARNING = "warning";
const OK = "ok";
const INFO = "info";

export default function Environment({ id, file, fileControl }) {
    const content = JSON.parse(file.content);

    return (
        <FileDisplay id={id} fileControl={fileControl} nonText={true} file={{name: "Environment"}} content={((
                <div className={styles.environmentCardStack}>
                    <DiscordSRVCard discordSRV={content.discordSRV}/>
                    <VersionCard version={content.version} gitRevision={content.gitRevision} gitBranch={content.gitBranch} buildTime={content.buildTime}/>
                    <StatusCard status={content.status} jdaStatus={content.jdaStatus}/>
                    <OnlineModeCard onlineMode={content.onlineMode} offlineModeUuid={content.offlineModeUuid}/>
                    <JavaCard javaVersion={content.javaVersion} javaVendor={content.javaVendor}/>
                    <OSCard operatingSystem={content.operatingSystem} operatingSystemVersion={content.operatingSystemVersion}/>
                    <CPUCard cores={content.cores} docker={content.docker}/>
                    <MemoryCard free={content.freeMemory} total={content.totalMemory} max={content.maxMemory}/>
                    <DiskCard usable={content.usableSpace} total={content.totalSpace}/>
                    <LoggerCard platformLogger={content.platformLogger}/>
                </div>
            )
        )}/>
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
        return <EnvironmentCard title="Platform" content={platform} status={OK}/>
    } else {
        return <EnvironmentCard title="Platform" content={discordSRV + "\n(Unofficial)"} status={ERROR}/>
    }
}

function VersionCard({ version, gitRevision, gitBranch, buildTime }) {
    const [versionCheck, setVersionCheck] = useState({});
    const [versionCheckFailed, setVersionCheckFailed] = useState(false);

    useEffect(() => {
        async function runAsync() {
            try {
                const snapshot = version.endsWith("-SNAPSHOT");
                const response = await fetch("https://download.discordsrv.com/v2/DiscordSRV/Ascension/"
                    + (snapshot ? "testing" : null) + "/version-check/" + (snapshot ? gitRevision : version))
                setVersionCheck(await response.json());
            } catch (e) {
                console.error("Failed to check version status", e);
                setVersionCheckFailed(true);
            }
        }
        runAsync();
    }, [version, gitRevision]);

    let status = INFO;
    if (versionCheck && versionCheck.status) {
        if (versionCheck.insecure) {
            status = ERROR;
        } else if (versionCheck.status === "UP_TO_DATE") {
            status = OK;
        } else if (versionCheck.status === "OUTDATED") {
            status = WARNING;
        } else {
            // Unknown
            status = WARNING;
        }
    } else if (versionCheckFailed) {
        status = WARNING;
    }

    return <EnvironmentCard title="Version" content={version + " (" + gitBranch + ")"} status={status}>
        <p>Rev: {gitRevision}</p>
        <p>Build Time: {buildTime}</p>
        <hr/>
        <h3>Version check status</h3>
        <p>{versionCheck.status ?? (versionCheckFailed ? "Failed to version check" : "")}</p>
        {versionCheck.amount > -1 ? <p>Behind by {versionCheck.amount} {versionCheck.amountType}</p> : <></>}
        {versionCheck.insecure ? <p style={{fontWeight: "bold"}}>This version is insecure!</p> : <></>}
        {versionCheck.securityIssues && versionCheck.securityIssues.length !== 0 ? <>
            <p>Security issues</p>
            <ul>
                {
                    versionCheck.securityIssues.map((issue, i) => <li key={i}>{issue}</li>)
                }
            </ul>
        </> : <></>}
    </EnvironmentCard>
}

function StatusCard({ status, jdaStatus }) {
    return <EnvironmentCard title="Status" content={status} status={status === "CONNECTED" ? OK : WARNING}>
        <p>JDA: {jdaStatus}</p>
    </EnvironmentCard>
}

function OnlineModeCard({ onlineMode, offlineModeUuid }) {
    let isUuid = offlineModeUuid === true;
    return <EnvironmentCard title="Online Mode"
                            content={onlineMode}
                            status={onlineMode === "OFFLINE" ? ERROR : (isUuid ? WARNING : OK)}>
        {onlineMode !== "OFFLINE" && isUuid ? (<>
            <p>A player with a version 3 UUID has logged into this server.</p>
            <p>This likely means the proxy is in offline mode or ip forwarding is not configured</p>
        </>) : null}
    </EnvironmentCard>
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

    return <EnvironmentCard title="Java Version" content={javaVersion} status={status}>
        <p>{javaVendor}</p>
    </EnvironmentCard>
}

function OSCard({ operatingSystem, operatingSystemVersion }) {
    return <EnvironmentCard title="Operating system" content={operatingSystem} status={INFO}>
        <p>{operatingSystemVersion}</p>
    </EnvironmentCard>
}

function CPUCard({ cores, docker }) {
    return <EnvironmentCard title="CPU Cores" content={cores + (docker ? " (Running in docker)" : "")} status={cores === 1 ? WARNING : INFO}/>
}

const GIG = 1000000; // 1GB
function MemoryCard({ free, total, max }) {
    return <EnvironmentCard title="Memory" content={
        (max > 0 ? prettifyBytes(max) : "Unlimited") + " Max"
    } status={max > 0 && max < GIG ? WARNING : INFO}>
        <div style={{display: "flex", flexDirection: "column"}}>
            <span>{prettifyBytes(free) + " Free"}</span>
            <span>{prettifyBytes(total) + " Total"}</span>
        </div>
    </EnvironmentCard>
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

function EnvironmentCard({ title, content, status, children }) {
    let statusClass = getStatusClass(status);
    let [modalOpen, setModalOpen] = useState(false);

    return (
        <div>
            <div
                className={`${styles.environmentCard} ${statusClass} ${children ? styles.pointer : ""}`}
                onClick={() => {
                    if (children) {
                        setModalOpen(!modalOpen);
                    }
                }}
            >
                <h4>{title}</h4>
                <p>{content}{children ? <span style={{fontWeight: "bold"}}>*</span> : <></>}</p>
            </div>

            {children ? (
                <Index title={title} open={modalOpen} close={() => setModalOpen(false)}>
                    <p>{content}</p>
                    {children}
                </Index>
            ) : <></>}
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
