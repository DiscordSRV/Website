import styles from "../../../styles/debug.module.css";
import Modal from "../../modal";
import {useEffect, useState} from "react";
import File from "./debug_file";

const LOG_LINE_PATTERN = /\[(\w*)] (?:\[(\w*)])?/;
const UNCATEGORIZED = "Uncategorized";

function Logs({ id, logs, fileControl }) {
    const [ selected, setSelected ] = useState(0);
    const [ isExpanded, setExpanded ] = useState(fileControl.expanded);
    const [ loadedContents, setLoadedContents ] = useState([]);

    const [ modalOpen, setModalOpen ] = useState(false);
    const [ availableCategories, setAvailableCategories ] = useState([]);
    const [ availableLevels, setAvailableLevels ] = useState([]);
    const [ selectedCategories, setSelectedCategories ] = useState(null);
    const [ selectedLevels, setSelectedLevels ] = useState(null);

    // Give fileControl our current expanded status
    fileControl.currentExpanded = isExpanded;
    fileControl.expand = expanded => setExpanded(expanded);

    useEffect(() => {
        // Update expanded status based on fileControl's expanded status
        setExpanded(fileControl.expanded);
    }, [fileControl.expanded]);

    // Figure out what loggers & log levels are in the logs
    useEffect(() => {
        let contents = [];
        logs.forEach(log => contents.push(log.content));
        loadedContents.forEach(content => contents.push(content));

        let levels = [];
        let categories = [];
        categories.push(UNCATEGORIZED);

        contents.forEach(content => {
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

        let usingAllCategories = categories.length === availableCategories.length;
        let usingAllLevels = levels.length === availableLevels.length;

        setAvailableCategories(categories);
        setAvailableLevels(levels);
        if (selectedCategories == null || usingAllCategories) {
            setSelectedCategories([...categories]);
        }
        if (selectedLevels == null || usingAllLevels) {
            setSelectedLevels([...levels]);
        }

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [logs, loadedContents]);

    return (
        <>
            <div id={id} className={`${styles.fileControl} ${styles.logControl}`}>
                <h3>Debug logs</h3>
                {
                    logs.map((log, i) => {
                        return <button key={i} onClick={() => setSelected(i)} style={{width: "5rem"}}>{i === selected ? (i + 1) + " (Current)" : (i + 1)}</button>
                    })
                }
                <button onClick={() => setModalOpen(true)}>Filters</button>
            </div>
            <div>
                {
                    logs.map((log, i) => {
                        let control = null
                        if (i === selected) {
                            control = {
                                contentEditor: content => {
                                    let finalContent = "";
                                    let matches = false;
                                    let lineNumbers = [];
                                    content.split("\n").forEach((line, i) => {
                                        let match = line.match(LOG_LINE_PATTERN);
                                        if (match == null) {
                                            // Stack traces, random newlines etc.
                                            if (matches) {
                                                finalContent += line + "\n";
                                                lineNumbers.push(i);
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
                                            lineNumbers.push(i);
                                        }
                                    });
                                    return {
                                        content: finalContent.substring(0, finalContent.length - 1),
                                        lineNumbers
                                    };
                                },
                                setExpanded: expanded => {
                                    setExpanded(expanded);

                                    // Notify fileControl of the expanded status changing
                                    if (fileControl && fileControl.notifyExpanded) {
                                        fileControl.currentExpanded = !isExpanded;
                                        fileControl.notifyExpanded();
                                    }
                                },
                                expanded: isExpanded,
                                childLoadedContent: content => {
                                    let contents = loadedContents;
                                    contents.push(content);
                                    setLoadedContents(contents);
                                }
                            }
                        }

                        return (
                            <div key={i} style={{display: selected === i ? "block" : "none"}}>
                                {<File file={log} fileControl={control} lineNumbers={true}/>}
                            </div>
                        )
                    })
                }
            </div>
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
        <Modal title="Log filters" open={open} close={close} selectedCategories={selectedCategories}>
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
        </Modal>
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
