import Modal from "../../../(components)/modal";

export const STORAGE_EXPANDED_BY_DEFAULT = "expandedByDefault";
export const HIGHLIGHT_BY_DEFAULT = "highlightByDefault";
export const POLITICS = "politics";

export default function SettingsModal({ open, close, settings, changeSettings }) {
    let expandedByDefault = settings[STORAGE_EXPANDED_BY_DEFAULT] === true;
    let highlightByDefault = settings[HIGHLIGHT_BY_DEFAULT] === true;
    let politics = settings[POLITICS] === true;
    return (
        <Modal title="Settings" open={open} close={close}>
            <div style={{display: "flex", flexDirection: "column", gap: "1rem"}}>
                <label>
                    Expand files by default&nbsp;
                    <input type="checkbox" onChange={event => {
                        settings[STORAGE_EXPANDED_BY_DEFAULT] = event.target.checked;
                        changeSettings(settings);
                    }} defaultChecked={expandedByDefault}/>
                </label>
                <label>
                    Highlight files by default&nbsp;
                    <input type="checkbox" onChange={event => {
                        settings[HIGHLIGHT_BY_DEFAULT] = event.target.checked;
                        changeSettings(settings);
                    }} defaultChecked={highlightByDefault}/>
                </label>
                <label>
                    Politics&nbsp;
                    <input type="checkbox" onChange={event => {
                        settings[POLITICS] = event.target.checked;
                        changeSettings(settings);
                    }} defaultChecked={politics}/>
                </label>
            </div>
        </Modal>
    )
}
