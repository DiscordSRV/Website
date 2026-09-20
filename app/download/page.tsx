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

interface VersionResponse {
    latest_base_url: string;
    versions: { [ key: number ] : Version }
}

interface Version {
    identifier: string;
    artifacts: { [ key: string ] : object }
}

export default function Page() {
    const [metadata, setMetadata] = useState<MetadataResponse | undefined>();
    const [versions, setVersions] = useState<VersionResponse | undefined>();
    const [error, setError] = useState();
    const [show, setShow] = useState<boolean>(false);

    const [selectedArtifacts, setSelectedArtifacts] = useState<string[]>([]);
    const [selectedVersionRange, setSelectedVersionRange] = useState<string | undefined>(undefined);

    useEffect(() => {
        fetch("https://download.discordsrv.com/v2/DiscordSRV/Ascension/testing/metadata")
            .then(result => result.json())
            .then(json => setMetadata(json))
            .catch(error => setError(error));
        fetch("https://download.discordsrv.com/v2/DiscordSRV/Ascension/testing/versions")
            .then(result => result.json())
            .then(json => setVersions(json))
            .catch(error => setError(error));
    }, []);

    if ((!metadata || !versions) && !error) {
        return <h1>Loading, please wait...</h1>
    }

    if (error || !metadata || !versions) {
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

            {show && <Filter
                metadata={metadata}
                selectedArtifacts={selectedArtifacts}
                setSelectedArtifacts={setSelectedArtifacts}
                selectedVersionRange={selectedVersionRange}
                setSelectedVersionRange={setSelectedVersionRange}
            />}

            {show && Object.keys(metadata.artifactMetadata)
                .filter(artifact => versions.versions[0].artifacts[artifact])
                .filter(artifact => selectedArtifacts.length === 0 || selectedArtifacts.indexOf(artifact) !== -1)
                .filter(artifact => selectedVersionRange == null || metadata.artifactMetadata[artifact].supportedVersions.indexOf(selectedVersionRange) !== -1)
                .map(key => {
                    return (
                        <div key={key} style={{display: "flex", flexDirection: "column"}}>
                            <h3>{key}</h3>
                            <span>Supports: {metadata.artifactMetadata[key].supportedVersions.join(", ")}</span>
                            <span><a href={versions.latest_base_url + key} style={{textDecoration: "underline"}}>Download</a> (<code>{versions.versions[0].identifier}</code>)</span>
                        </div>
                    )
                })
            }
        </div>
    )
}

function Filter({metadata, selectedArtifacts, setSelectedArtifacts, selectedVersionRange, setSelectedVersionRange} : {
    metadata : MetadataResponse,
    selectedArtifacts : string[],
    setSelectedArtifacts,
    selectedVersionRange : string | undefined,
    setSelectedVersionRange
}) {
    const [platforms, setPlatforms] = useState<string[]>();
    const [artifactsByPlatform, setArtifactsByPlatform] = useState<Map<string, string[]>>();

    const [selectedPlatform, setSelectedPlatform] = useState<string | undefined>(undefined);

    useEffect(() => {
        const platforms = new Set<string>();
        const artifactsByPlatform = new Map<string, string[]>();
        Object.keys(metadata.artifactMetadata).map(artifact => {
            const platform = artifact.split("-")[0];
            platforms.add(platform);

            const artifacts = artifactsByPlatform.get(platform) ?? [];
            artifacts.push(artifact);
            artifactsByPlatform.set(platform, artifacts);
        });
        setPlatforms([...platforms]);
        setArtifactsByPlatform(artifactsByPlatform);
    }, [metadata]);

    const [versionRanges, setVersionRanges] = useState<string[]>();
    useEffect(() => {
        const selectedArtifacts : string[] = [];
        if (!selectedPlatform) {
            setSelectedArtifacts(selectedArtifacts);
            return;
        }
        artifactsByPlatform.get(selectedPlatform)?.forEach(artifact => selectedArtifacts.push(artifact));
        setSelectedArtifacts(selectedArtifacts);
    }, [selectedPlatform]);
    useEffect(() => {
        const allVersionRanges : string[] = [];
        if (!selectedArtifacts) {
            setVersionRanges(allVersionRanges);
            return;
        }
        selectedArtifacts.forEach(artifact => {
            const versionsRanges = metadata.artifactMetadata[artifact]?.supportedVersions;
            if (versionsRanges) {
                versionsRanges.forEach(versionRange => allVersionRanges.push(versionRange));
            }
        });
        setVersionRanges(allVersionRanges);
    }, [selectedArtifacts]);
    useEffect(() => {
        if (!versionRanges) {
            return;
        }
        if (selectedVersionRange && versionRanges.indexOf(selectedVersionRange) !== -1) {
            return;
        }

        setSelectedVersionRange(versionRanges.length === 1 ? versionRanges[0] : undefined);
    }, [versionRanges]);

    return (
        <div style={{marginTop: "2rem", display: "flex", flexDirection: "column", gap: "0.5rem"}}>
            <label>
                Filter platform:&nbsp;
                <select value={selectedPlatform === undefined ? "" : selectedPlatform} onChange={event => {
                    const value = event.target.value;
                    setSelectedPlatform(value === "" ? undefined : value);
                }}>
                    <option value=""></option>
                    {platforms?.map(platform => <option value={platform} key={platform}>{platform}</option>)}
                </select>
            </label>

            <label>
                Filter version:&nbsp;
                <select value={selectedVersionRange === undefined ? "" : selectedVersionRange} onChange={event => {
                    const value = event.target.value;
                    setSelectedVersionRange(value === "" ? undefined : value);
                }}>
                    {versionRanges != null && versionRanges.length != 1 && <option value=""></option>}
                    {versionRanges?.map(versionRange => <option value={versionRange} key={versionRange}>{versionRange}</option>)}
                </select>
            </label>
        </div>
    )
}