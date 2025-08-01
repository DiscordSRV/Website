"use client";
import {useEffect, useState} from "react";

interface MetadataResponse {
    metadata: Metadata;
    artifactMetadata: { [ key: string ] : ArtifactMetadata }
}

interface Metadata {
    downloadAuthorization?: string;
}

interface ArtifactMetadata {
    supportedVersions?: string[];
}

export default function Page() {
    const [metadata, setMetadata] = useState<MetadataResponse | undefined>();
    const [error, setError] = useState();
    const [show, setShow] = useState<boolean>(false);

    useEffect(() => {
        fetch("https://download.discordsrv.com/v2/DiscordSRV/Ascension/testing/metadata")
            .then(result => result.json())
            .then(json => setMetadata(json))
            .catch(error => setError(error));
        fetch("https://download.discordsrv.com/v2/DiscordSRV/Ascension/testing/metadata")
            .then(result => result.json())
            .then(json => setMetadata(json))
            .catch(error => setError(error));
    }, []);

    if (!metadata && !error) {
        return <h1>Loading, please wait...</h1>
    }

    if (error || !metadata) {
        console.log(error);
        return <h1>Something went wrong, please try again later</h1>
    }

    let hash = window.location.hash;
    if (hash.startsWith("#")) hash = hash.substring(1);
    console.log(hash, metadata.metadata.downloadAuthorization);
    if (!metadata.metadata.downloadAuthorization || hash !== metadata.metadata.downloadAuthorization) {
        return (
            <div style={{display: "flex", flexDirection: "column", margin: "2rem", gap: "1rem"}}>
                <span>To download DiscordSRV v1 <a href="https://get.discordsrv.com" style={{textDecoration: "underline"}}>click here</a></span>
                <span>For Ascension information, read more <a href="https://github.com/DiscordSRV/Ascension?tab=readme-ov-file#ascension" style={{textDecoration: "underline"}}>here</a></span>
            </div>
        )
    }

    return (
        <div style={{display: "flex", flexDirection: "column", margin: "2rem", gap: "0.5rem"}}>
            <h1>Ascension download</h1>

            <span style={{color: "red"}}>These are development builds for a future version of DiscordSRV, no stability or support is guaranteed for these versions.</span>
            <span>Join our <a href="https://discordsrv.com/discord" style={{textDecoration: "underline"}}>Discord server</a> and visit the <code>#ascension-testing</code> channel (you need the <code>Tester</code> role from <code>Channels & Roles</code>) for more information</span>
            {!show && <button onClick={() => setShow(true)} style={{maxWidth: "10rem", color: "black"}}>I understand</button>}

            {show && Object.keys(metadata.artifactMetadata).filter(key => key !== "velocity" && key !== "bungee").map(key => {
                return (
                    <div key={key} style={{display: "flex", flexDirection: "column"}}>
                        <h3>{key}</h3>
                        <span>Supports: {metadata.artifactMetadata[key].supportedVersions}</span>
                        <a href={"https://download.discordsrv.com/v2/DiscordSRV/Ascension/testing/download/latest/" + key} style={{textDecoration: "underline"}}>Download</a>
                    </div>
                )
            })}
        </div>
    )
}