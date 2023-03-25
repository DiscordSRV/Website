import styles from "../../../styles/debug.module.css";
import {FileDisplay} from "./debug_file";
import {useEffect, useState} from "react";

const STORAGE_TABLE_OF_CONTENTS_OPEN = "tableOfContentsOpen";

export default function TableOfContents({ headings, settings, changeSettings }) {
    const [control] = useState({ defaultExpanded: false });
    control.setExpandedParent = expanded => {
        control.setExpanded(expanded);

        settings[STORAGE_TABLE_OF_CONTENTS_OPEN] = expanded;
        changeSettings(settings);
    };

    useEffect(() => {
        control.setExpanded(settings[STORAGE_TABLE_OF_CONTENTS_OPEN] === true);
    }, [control, settings]);

    return (
        <FileDisplay file={{name: "Table of contents"}} fileControl={control} nonText={true} content={<div className={styles.tableOfContents}>{headings}</div>}/>
    )
}
