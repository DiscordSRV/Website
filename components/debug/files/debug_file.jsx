import useCollapse from "react-collapsed";
import styles from "../../../styles/debug.module.css";
import {useEffect, useState} from "react";
import {decrypt, getFromPaste} from "../../../util/debug";
import dynamic from "next/dynamic";

// Only load in highlight.js if we're going to highlight something
const Highlight = dynamic(() => import("../../debug/highlight"), { ssr: false });

export default function File({ id, file, fileControl, lineNumbers, nonText }) {
    const [ content, setContent ] = useState(file.content);
    return <FileDisplay
        id={id}
        file={file}
        fileControl={fileControl}
        lineNumbers={lineNumbers}
        nonText={nonText}
        content={content}
        setContent={setContent}
    />
}

export function FileDisplay({ id, file, fileControl, lineNumbers, nonText, content, setContent }) {
    const { getCollapseProps, isExpanded, setExpanded } = useCollapse({defaultExpanded: fileControl?.defaultExpanded ?? true, duration: 300});
    if (fileControl) {
        fileControl.isExpanded = () => isExpanded;
        fileControl.setExpanded = expanded => setExpanded(expanded);
    }

    const [ highlight, setHighlight ] = useState(false);
    const [ currentLineNumbers, setCurrentLineNumbers ] = useState(null);
    const [ loading, setLoading ] = useState(false);
    const [ error, setError ] = useState(null);

    useEffect(() => {
        if (content == null || nonText) {
            return;
        }

        setCurrentLineNumbers(lineNumbers != null ? lineNumbers : content.split("\n").map((_, i) => i + 1));
    }, [content, lineNumbers, nonText]);

    // File downloading logic
    useEffect(() => {
        if (!loading) {
            // Prevent running during initial render
            return;
        }

        getFromPaste(file.url).then(result => {
            setContent(decrypt(result, file.decryption_key).content);
            setLoading(false);
        }).catch(err => {
            setError(err.message);
            setLoading(false);
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [loading]);

    return (
        <div id={id} className={styles.file}>
            <div className={styles.fileHeader}>
                <h4 className={styles.fileName}>{file.name}</h4>
                <div className={`${styles.fileControl} ${styles.fileControlBar}`}>
                    {
                        file.name.indexOf(".") === -1 || file.name.endsWith(".txt") || file.name.endsWith(".log") ? null :
                            <button onClick={() => setHighlight(!highlight)}>{highlight ? "Plain" : "Highlight"}</button>
                    }
                    <button onClick={() => {
                        // Use either the fileControl's expanding function or this file's expanded state
                        // based on if the fileControl has an expanding function or not
                        if (fileControl?.setExpandedParent) {
                            fileControl.setExpandedParent(!isExpanded);
                        } else {
                            setExpanded(!isExpanded);
                        }
                    }}>{isExpanded ? "Collapse" : "Expand"}</button>
                </div>
            </div>
            <div {...getCollapseProps()}>{
                content != null ? (
                    <div className={styles.fileContentWrapper}>
                        <div className={styles.fileContent}>
                            {
                                highlight ?
                                    <Highlight content={content}/> :
                                    <div className={nonText ? null : styles.plainTextWrapper}>
                                        {
                                            currentLineNumbers == null ? null : (
                                                <div className={styles.lineNumbers}>
                                                    {
                                                        currentLineNumbers.map((line, i) => <pre key={i}>{line}</pre>)
                                                    }
                                                </div>
                                            )
                                        }
                                        {
                                            nonText ? <div>{content}</div> : <pre>{content}</pre>
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
        </div>
    )
}
