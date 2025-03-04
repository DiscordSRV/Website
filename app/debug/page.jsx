"use client";
import {unzip} from 'unzipit';
import {useCallback, useEffect, useState} from "react";
import styles from './debug.module.css'
import DebugClient from "./[file]/client";

export default function Page() {
    const [rawData, setRawData] = useState();

    useEffect(() => {
        if (!window.location.hash) {
            window.location.hash = "zip";
        }
    }, []);

    const fileCallback = useCallback(async (file) => {
        if (!file) {
            return;
        }

        let entries = (await unzip(file)).entries;
        const files = [];
        for (const [name, entry] of Object.entries(entries)) {
            files.push({
                name: name,
                content: await entry.text()
            });
        }
        console.log("zip files", files);
        setRawData(files);
    }, []);

    const dropHandler = event => {
        event.preventDefault();

        let singleFile = null;
        if (event.dataTransfer.items) {
            [...event.dataTransfer.items].forEach((item) => {
                if (item.kind === "file") {
                    singleFile = item.getAsFile();
                }
            });
        } else {
            [...event.dataTransfer.files].forEach((file) => singleFile = file);
        }
        if (singleFile) {
            fileCallback(singleFile);
        }
    };
    const dragOverHandler = event => event.preventDefault();
    const inputHandler = event => {
        let singleFile = null;
        [...event.target.files].forEach(file => singleFile = file);
        if (singleFile) {
            fileCallback(singleFile);
        }
        event.target.value = null;
    };

    if (rawData) {
        return <DebugClient preDecryptedData={rawData} params={{}} />
    }

    return (
        <div className={styles.zipAreaWrapper} style={{display: "flex", justifyContent: "center"}}>
            <div onDrop={dropHandler} onDragOver={dragOverHandler} className={styles.zipArea}>
                <label onDrop={dropHandler} onDragOver={dragOverHandler}>
                    Upload debug zip<br/>
                    <input type="file" accept="application/zip" multiple={false} onInput={inputHandler}/>
                </label>
            </div>
        </div>
    )
}