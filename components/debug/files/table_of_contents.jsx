import styles from "../../../styles/debug.module.css";
import File from "./debug_file";

const STORAGE_TABLE_OF_CONTENTS_OPEN = "tableOfContentsOpen";

export default function TableOfContents({ headings, settings, changeSettings }) {
    let control = {
        expanded: settings[STORAGE_TABLE_OF_CONTENTS_OPEN] === true
    };
    control.notifyExpanded = () => {
        settings[STORAGE_TABLE_OF_CONTENTS_OPEN] = control.currentExpanded;
        changeSettings(settings);
    }

    return (
        <File file={{
            name: "Table of contents",
            content: (<div className={styles.tableOfContents}>{headings}</div>)
        }} fileControl={control}/>
    )
}
