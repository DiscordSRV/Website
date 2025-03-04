import styles from "../../debugclient.module.css";
import Index from "../../../../(components)/modal";
import {useEffect, useState} from "react";
import {FileDisplay} from "./debug_file";
import MultiFiles from "./multi_files";

const LOG_LINE_PATTERN = /\[(\w*)] (?:\[(\w*)])?/;
const UNCATEGORIZED = "Uncategorized";

function Logs({ id, logs, fileControl }) {
    const [ modalOpen, setModalOpen ] = useState(false);
    const [ availableCategories, setAvailableCategories ] = useState([]);
    const [ availableLevels, setAvailableLevels ] = useState([]);
    const [ selectedCategories, setSelectedCategories ] = useState(null);
    const [ selectedLevels, setSelectedLevels ] = useState(null);

    const [ debugLogs, setDebugLogs ] = useState(null);

    function filterContent(content) {
        if (!content) {
            return {};
        }

        let finalContent = "";
        let matches = false;
        let lineNumbers = [];
        content.split("\n").forEach((line, i) => {
            let match = line.match(LOG_LINE_PATTERN);
            if (match == null) {
                // Stack traces, random newlines etc.
                if (matches) {
                    finalContent += line + "\n";
                    lineNumbers.push(i + 1);
                }
                return;
            }

            let level = match[1];
            let category = match[2];
            matches = selectedCategories != null && selectedLevels != null
                && selectedCategories.indexOf(category ? category : UNCATEGORIZED) !== -1
                && selectedLevels.indexOf(level) !== -1;
            if (matches) {
                finalContent += line + "\n";
                lineNumbers.push(i + 1);
            }
        });
        return {
            content: finalContent.substring(0, finalContent.length - 1),
            lineNumbers
        };
    }

    useEffect(() => {
        if (logs == null) {
            return;
        }

        let debugLogs = [];
        logs.forEach((file, i) => {
            let log = {
                file: file,
                content: file.content,
                label: i + 1,
                control: {
                    //defaultExpanded: expanded,
                    setExpandedParent: expanded => fileControl.setExpandedParent(expanded)
                }
            };

            debugLogs.push(log);
        });

        setDebugLogs(debugLogs);

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [logs]);

    // Figure out what loggers & log levels are in the logs
    useEffect(() => {
        if (!debugLogs) {
            return;
        }

        let usingAllCategories = selectedCategories?.length === availableCategories?.length;
        let usingAllLevels = selectedLevels?.length === availableLevels?.length;

        let levels = [];
        let categories = [];
        categories.push(UNCATEGORIZED);

        debugLogs.forEach(log => {
            let content = log.content;
            if (!content) {
                return;
            }

            content.split("\n").forEach(line => {
                let match = line.match(LOG_LINE_PATTERN);
                if (match == null) {
                    return;
                }
                let level = match[1];
                let category = match[2];
                if (levels.indexOf(level) === -1) {
                    levels.push(level);
                }
                if (category && categories.indexOf(category) === -1) {
                    categories.push(category);
                }
            })
        });

        setAvailableCategories(categories);
        setAvailableLevels(levels);
        if (selectedCategories == null || usingAllCategories) {
            setSelectedCategories([...categories]);
        }
        if (selectedLevels == null || usingAllLevels) {
            setSelectedLevels([...levels]);
        }

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [debugLogs]);

    return (
        <>
            <MultiFiles id={id} header="Debug logs" fileControl={fileControl} files={debugLogs}
                mapFileToJSX={(controllable, i) => {
                    let filtered = filterContent(controllable.file.content);
                    return (
                        <FileDisplay
                            file={controllable.file.file} fileControl={controllable.control} lineNumbers={filtered.lineNumbers} content={filtered.content}
                            setContent={(content) => {
                                setDebugLogs(debugLogs.map((log, i2) => {
                                    if (i === i2) {
                                        log.content = content;
                                    }
                                    return log;
                                }));
                            }}
                        />
                    )
                }}
                extraHeaderJSX={(
                    <button onClick={() => setModalOpen(true)}>Filters</button>
                )}
            />
            <LogModal
                open={modalOpen} close={() => setModalOpen(false)}
                availableCategories={availableCategories} availableLevels={availableLevels}
                selectedCategories={selectedCategories} setSelectedCategories={categories => setSelectedCategories([...categories])}
                selectedLevels={selectedLevels} setSelectedLevels={levels => setSelectedLevels([...levels])}
            />
        </>
    )
}

function LogModal({ open, close, availableCategories, availableLevels, selectedCategories, setSelectedCategories, selectedLevels, setSelectedLevels }) {
    return (
        <Index title="Log filters" open={open} close={close} selectedCategories={selectedCategories}>
            <div className={styles.logFiltersWrapper}>
                <div>
                    <h3>Levels</h3>
                    <FilterSelection available={availableLevels} selected={selectedLevels} setSelected={setSelectedLevels}/>
                </div>
                <div>
                    <h3>Categories</h3>
                    <FilterSelection available={availableCategories} selected={selectedCategories} setSelected={setSelectedCategories}/>
                </div>
            </div>
        </Index>
    );
}

function FilterSelection({ available, selected, setSelected }) {
    if (selected == null) {
        return <></>
    }
    return (
        <div className={styles.logFilters}>
            <label>
                <input type="checkbox" checked={selected.length === 0} onChange={() => setSelected([])}/>
                None
            </label>
            <label>
                <input type="checkbox" checked={available.length === selected.length} onChange={() => setSelected([...available])}/>
                All
            </label>
            {
                available.map((category, i) => {
                    let checked = selected.indexOf(category) !== -1;
                    return (
                        <label key={i}>
                            <input type="checkbox" checked={checked} onChange={() => {
                                let current = selected;
                                if (selected.indexOf(category) === -1) {
                                    current.push(category);
                                } else {
                                    current.splice(current.indexOf(category), 1);
                                }
                                setSelected(current);
                            }}/>
                            {category}
                        </label>
                    )
                })
            }
        </div>
    )
}

export default Logs
