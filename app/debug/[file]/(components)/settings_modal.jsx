import Modal from "../../../(components)/modal";

export const STORAGE_EXPANDED_BY_DEFAULT = "expandedByDefault";
export const POLITICS = "politics";

export default function SettingsModal({ open, close, settings, changeSettings }) {
    let expandedByDefault = settings[STORAGE_EXPANDED_BY_DEFAULT] === true;
    let politics = settings[POLITICS] === true;
    return (
        <Modal title="Settings" open={open} close={close}>
            <label>
                Expand files by default&nbsp;
                <input type="checkbox" onChange={event => {
                    settings[STORAGE_EXPANDED_BY_DEFAULT] = event.target.checked;
                    changeSettings(settings);
                }} defaultChecked={expandedByDefault}/>
            </label>
            <label>
                Politics&nbsp;
                <input type="checkbox" onChange={event => {
                    settings[POLITICS] = event.target.checked;
                    changeSettings(settings);
                }} defaultChecked={politics}/>
            </label>
        </Modal>
    )
}
