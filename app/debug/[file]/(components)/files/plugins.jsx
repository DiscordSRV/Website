import {FileDisplay} from "./debug_file";
import styles from "../../debugclient.module.css";
import Modal from "../../../../(components)/modal";
import {useState} from "react";

export default function Plugins({ id, fileControl, file }) {
    const content = JSON.parse(file.content);
    const [modalPlugin, setModalPlugin] = useState(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [search, setSearch] = useState("");

    let useId = !content.find(x => x.name === x.identifier);

    return (
        <>
            <FileDisplay id={id} fileControl={fileControl} nonText={true} file={{name: "Plugins"}} content={(
                <div>
                    <label>
                        Search: <input type="text" onChange={event => setSearch(event.target.value)} value={search} />
                    </label>

                    <div className={styles.pluginsTable}>
                        <div>
                            {useId ? <span>ID</span> : null}
                            <span>Name</span>
                            <span>Version</span>
                        </div>
                        {content
                            .filter(plugin => plugin.name.toLowerCase().indexOf(search.toLowerCase()) !== -1
                                           || (plugin.id && plugin.id.toLowerCase().indexOf(search.toLowerCase()) !== -1))
                            .map((plugin, i) => (
                                <div key={i}>
                                    {useId ? <td>{plugin.identifier}</td> : null}
                                    <span className={styles.pointer} style={{color: "#6363FF"}} onClick={() => {
                                        setModalPlugin(plugin);
                                        setModalOpen(true);
                                    }}>{plugin.name}</span>
                                    <span>{plugin.version}</span>
                                </div>
                            )
                        )}
                    </div>
                </div>
            )}/>
            <Modal title={modalPlugin?.name} open={modalOpen} close={() => setModalOpen(false)}>
                <span>Authors: {modalPlugin?.authors?.join(", ")}</span>
            </Modal>
        </>
    )
}