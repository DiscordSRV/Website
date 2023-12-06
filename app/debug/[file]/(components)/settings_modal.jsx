import Modal from "../../../(components)/modal";

const STORAGE_EXPANDED_BY_DEFAULT = "expandedByDefault";

export default function SettingsModal({ open, close, settings, changeSettings }) {
    let expandedByDefault = settings[STORAGE_EXPANDED_BY_DEFAULT] === true;
    return (
        <Modal title="Settings" open={open} close={close}>
            <label>
                Expand files by default&nbsp;
                <input type="checkbox" onChange={event => {
                    settings[STORAGE_EXPANDED_BY_DEFAULT] = event.target.checked;
                    changeSettings(settings);
                }} defaultChecked={expandedByDefault}/>
            </label>
        </Modal>
    )
}
export { STORAGE_EXPANDED_BY_DEFAULT }
