import File from "./debug_file";
import styles from "../../../styles/debug.module.css";

const ERROR = "error";
const WARNING = "warning";
const OK = "ok";
const INFO = "info";

export default function Environment({ id, file, fileControl }) {
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
