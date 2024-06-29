import { useCollapse } from "react-collapsed";
import styles from "../../debug.module.css";
import {lazy, Suspense, useCallback, useContext, useEffect, useState} from "react";
import {b64Decode, decrypt, getFromBytebin} from "../../(util)/util";
import {SettingsContext} from "../../client";
import {HIGHLIGHT_BY_DEFAULT, VALIDATE_YAML_BY_DEFAULT} from "../settings_modal";

// Only load in highlight.js if we're going to highlight something
const Highlight = lazy(() => import("../highlight"));

export default function DebugFile({ id, file, fileControl, lineNumbers, nonText }) {
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

    const highlightable = file.name.indexOf(".") !== -1 && !file.name.endsWith(".txt");
    const yaml = /\.ya?ml$/.test(file.name);
    const settings = useContext(SettingsContext);

    const [ highlight, setHighlight ] = useState(false);

    const [ yamlValidating, setYamlValidating ] = useState(false);
    const [ yamlValidated, setYamlValidated ] = useState(false);
    const [ yamlValidationVisible, setYamlValidationVisible ] = useState(true);
    const [ yamlWarnings, setYamlWarnings ] = useState([]);

    const [ loading, setLoading ] = useState(false);
    const [ error, setError ] = useState(null);

    // File downloading logic
    useEffect(() => {
        if (!loading) {
            // Prevent running during initial render
            return;
        }

        getFromBytebin(file.url).then(async(result) => {
            const decrypted = await decrypt(b64Decode(result), b64Decode(file.decryption_key));
            setContent(JSON.parse(decrypted).content);
            setLoading(false);
        }).catch(err => {
            console.error("Failed to load file", err);
            setError(err.message);
            setLoading(false);
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [loading]);

    const validateYaml = useCallback(async () => {
        setYamlValidating(true);
        let addWarning = warning => {
            let warnings = [];
            warnings.push(warning);
            setYamlWarnings(warnings);
        };
        try {
            // Only load js-yaml if needed
            (await import('js-yaml')).load(file.content, addWarning);
        } catch (e) {
            console.log(e);
            addWarning(e);
        }
        setYamlValidated(true);
        setYamlValidating(false);
    }, [file]);

    useEffect(() => {
        if (!nonText && settings[HIGHLIGHT_BY_DEFAULT] && highlightable && file.content && file.content.length < 50_000) {
            // Auto highlight files that are less than 50k chars based on setting
            setHighlight(true);
        }
    }, [settings, highlightable, file, nonText]);
    useEffect(() => {
        if (!yamlValidated && !yamlValidating && yaml && settings[VALIDATE_YAML_BY_DEFAULT]) {
            // Auto yaml validate based on setting
            validateYaml()
        }
    }, [settings, validateYaml, yaml, yamlValidated, yamlValidating]);

    const plainViewer = () => <PlainContentViewer
        content={content}
        lineNumbers={lineNumbers}
        nonText={nonText}
        yamlWarnings={yamlWarnings}
        yamlValidationVisible={yamlValidationVisible}
    />
    return (
        <div id={id} className={styles.file}>
            <div className={styles.fileHeader}>
                <h4 className={styles.fileName}>{file.name}</h4>
                <div className={`${styles.fileControl} ${styles.fileControlBar}`}>
                    {/* YAML validation indicator & Button */}
                    <span style={{marginRight: "0.3rem"}}>
                        {
                            yamlWarnings.length > 0
                                ? <span
                                    style={{color: "red"}}>{yamlWarnings.length} {yamlWarnings.length === 1 ? "warning" : "warnings"}</span>
                                : yamlValidated
                                    ? <span style={{color: "limegreen"}}>Ok</span>
                                    : (yamlValidating ? <span>Validating...</span> : null)
                        }
                    </span>
                    {
                        yaml && (
                            <button onClick={async () => {
                                if (yamlValidated) {
                                    setYamlValidationVisible(!yamlValidationVisible);
                                } else {
                                    await validateYaml()
                                }
                            }} disabled={yamlValidating || (yamlValidated && yamlWarnings.length === 0)}>
                                {
                                    yamlValidated
                                        ? (yamlWarnings.length === 0 ? "Validated" : (yamlValidationVisible ? "Hide" : "Show") + " val.")
                                        : "Validate"
                                }
                            </button>
                        )
                    }
                    {
                        highlightable && <button
                            onClick={() => setHighlight(!highlight)}
                        >{highlight ? "Plain" : "Highlight"}</button>
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
                                highlight
                                    ? <Suspense fallback={plainViewer()}><Highlight content={content}/></Suspense>
                                    : plainViewer()
                            }
                        </div>
                    </div>
                ) : (
                    /* Unloaded file handling */
                    <div className={styles.bigFile}>
                        <p>This file is {file.length.toLocaleString('en-US')} characters long. It wasn&apos;t loaded to
                            prevent overloading your browser.</p>
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

function PlainContentViewer(
    {
        content, lineNumbers, nonText,
        yamlWarnings, yamlValidationVisible
    }
) {

    const [ currentLineNumbers, setCurrentLineNumbers ] = useState(null);
    const [ yamlShownWarning, setYamlShownWarning ] = useState(-1);
    const shownWarning = yamlShownWarning !== -1 ? yamlWarnings[yamlShownWarning] : null;

    useEffect(() => {
        if (content == null || nonText) {
            return;
        }

        setCurrentLineNumbers(lineNumbers != null ? lineNumbers : content.split("\n").map((_, i) => i + 1));
    }, [content, lineNumbers, nonText]);

    return (
        <div className={nonText ? null : styles.plainTextWrapper}>
            {
                /* Non-text rendering */
                nonText && <div style={{overflowX: "auto"}}>{content}</div>
            }
            {
                /* Line numbers */
                currentLineNumbers !== null && (
                    <div className={styles.lineNumbers}>
                        {
                            currentLineNumbers.map((line, i) => {
                                const warningIndex = yamlWarnings.findIndex(x => x?.mark?.line && (x.mark.line + 1) === line);
                                return (
                                    <div style={yamlValidationVisible && warningIndex !== -1 ? {
                                        display: "flex",
                                        flexDirection: "row"
                                    } : null} key={i}>
                                        {
                                            /* YAML validation line error indicator */
                                            yamlValidationVisible && warningIndex !== -1 && (
                                                <>
                                                    <pre style={{color: "red", cursor: "pointer"}}
                                                         onClick={() => setYamlShownWarning(yamlShownWarning >= 0 ? -1 : warningIndex)}>!</pre>
                                                </>
                                            )
                                        }
                                        <pre>{line}</pre>
                                    </div>
                                )
                            })
                        }
                    </div>
                )
            }
            {
                !nonText && (
                    <pre>
                        {
                            /* YAML syntax error box */
                            yamlValidationVisible && shownWarning && (
                                <div style={{position: "relative"}}>
                                    <div style={{position: "absolute"}}>
                                        <pre className={styles.validationCursor} style={{
                                            top: ((shownWarning.mark.line) * 2.2) + "ex",
                                            left: (shownWarning.mark.column) + "ch"
                                        }}>^</pre>
                                        <div className={styles.validationBox} style={{
                                            top: ((shownWarning.mark.line - 1) * 2.2) + "ex",
                                            width: Math.max(60, shownWarning.mark.column + 5) + "ch"
                                        }}>
                                            <span>{shownWarning.reason}</span>
                                        </div>
                                    </div>
                                </div>
                            )
                        }
                        {
                            /* Text Content */
                            content
                        }
                    </pre>
                )
            }
        </div>
    )
}
