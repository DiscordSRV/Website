import {useEffect, useState} from "react";
import styles from "../../debug.module.css";
import {FileDisplay} from "./debug_file";

export default function MultiFiles({ id, header, fileControl, files, mapFileToJSX, extraHeaderJSX }) {
    const [ selected, setSelected ] = useState(0);

    const [ expanded, setExpanded ] = useState(fileControl.defaultExpanded);
    if (fileControl) {
        fileControl.isExpanded = () => expanded;
        fileControl.setExpanded = expanded => setExpanded(expanded)
    }

    const [ controllableFiles, setControllableFiles ] = useState([]);
    useEffect(() => {
        if (controllableFiles == null || selected == null) {
            return;
        }
        controllableFiles[selected]?.control.setExpanded(expanded);
    }, [controllableFiles, selected, expanded]);

    useEffect(() => {
        if (files == null) {
            return;
        }

        let controllableFiles = [];
        files.forEach(file => {
            let controllableFile = {
                file: file,
                content: file.content,
                control: {
                    defaultExpanded: expanded,
                    setExpandedParent: expanded => fileControl.setExpandedParent(expanded)
                }
            };

            controllableFiles.push(controllableFile);
        });

        setControllableFiles(controllableFiles);

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [files]);

    return (
        <>
            <div id={id} className={`${styles.fileControl} ${styles.multiFileControl}`}>
                <h3>{header}</h3>
                {
                    files?.map((file, i) => {
                        return <button key={i} onClick={() => setSelected(i)} style={{width: "6rem"}}>
                            {file.label + (i === selected ? " (Current)" : "")}
                        </button>
                    })
                }
                { extraHeaderJSX }
            </div>
            <div>
                {
                    controllableFiles?.map((file, i) => {
                        return (
                            <div key={i} style={{display: selected === i ? "block" : "none"}}>
                                {
                                    mapFileToJSX
                                        ? mapFileToJSX(file, i)
                                        : <FileDisplay file={file.file} content={file.content} fileControl={file.control} />
                                }
                            </div>
                        )
                    })
                }
            </div>
        </>
    )
}