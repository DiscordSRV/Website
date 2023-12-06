import {FileDisplay} from "./debug_file";
import styles from "../../debug.module.css";
import Modal from "../../../../(components)/modal";
import {useState} from "react";

export default function Plugins({ id, fileControl, file }) {
    const content = JSON.parse(file.content);
    const [modalPlugin, setModalPlugin] = useState(null);
    const [modalOpen, setModalOpen] = useState(false);

    let useId = !content.find(x => x.name === x.identifier);

    return (
        <>
            <FileDisplay id={id} fileControl={fileControl} nonText={true} file={{name: "Plugins"}} content={(
                <div>
                    <div className={styles.pluginsTable}>
                        <div>
                            {useId ? <span>ID</span> : null}
                            <span>Name</span>
                            <span>Version</span>
                        </div>
                        {content.map((plugin, i) => (
                            <div key={i}>
                                {useId ? <td>{plugin.identifier}</td> : null}
                                <span className={styles.pointer} style={{color: "#6363FF"}} onClick={() => {
                                    setModalPlugin(plugin);
                                    setModalOpen(true);
                                }}>{plugin.name}</span>
                                <span>{plugin.version}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}/>
            <Modal title={modalPlugin?.name} open={modalOpen} close={() => setModalOpen(false)}>
                <span>Authors: {modalPlugin?.authors?.join(", ")}</span>
            </Modal>
        </>
    )
}