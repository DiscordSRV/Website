import useCollapse from "react-collapsed";
import styles from "../../../styles/debug.module.css";
import {useEffect, useState} from "react";
import {decrypt, getFromPaste} from "../../../util/debug";
import dynamic from "next/dynamic";

// Only load in highlight.js if we're going to highlight something
const Highlight = dynamic(() => import("../../debug/highlight"), { ssr: false });

export default function File({ id, file, fileControl, lineNumbers, noText }) {
    const { getCollapseProps, isExpanded, setExpanded } = useCollapse({defaultExpanded: fileControl ? fileControl.expanded : true, duration: 300});
    const [ highlight, setHighlight ] = useState(false);

    const [ content, setContent ] = useState(file.content);
    const [ loading, setLoading ] = useState(false);
    const [ error, setError ] = useState(null);

    let currentContent = content;
    let currentLineNumbers = null;
    if (fileControl) {
        if (currentContent && fileControl.contentEditor) {
            // Apply changes to content based on the fileControl's contentEditor function, if available
            let content = fileControl.contentEditor(currentContent);
            currentContent = content.content;
            currentLineNumbers = content.lineNumbers;
        }

        // Give fileControl the current expanded status of this file
        fileControl.currentExpanded = isExpanded;
        fileControl.expand = expanded => setExpanded(expanded);
    }
    if (!currentLineNumbers) {
        currentLineNumbers = currentContent && lineNumbers ? currentContent.split("\n").map((line, i) => i) : [];
    }

    // Update the expanded status if fileControl's expanded status changes
    let expanded = fileControl ? fileControl.expanded : fileControl;
    useEffect(() => {
        if (fileControl && fileControl.expanded !== isExpanded) {
            setExpanded(fileControl.expanded);
        }

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [expanded]);

    // File downloading logic
    useEffect(() => {
        if (!loading) {
            // Prevent running during initial render
            return;
        }
        getFromPaste(file.url).then(result => {
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
                                    <Highlight content={file.content}/> :
                                    <div className={noText ? null : styles.plainTextWrapper}>
                                        {
                                            !lineNumbers ? null : (
                                                <div className={styles.lineNumbers}>
                                                    {
                                                        currentLineNumbers.map((line, i) => <pre key={i}>{line + 1}</pre>)
                                                    }
                                                </div>
                                            )
                                        }
                                        {
                                            noText ? <div>{currentContent}</div> : <pre>{currentContent}</pre>
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
