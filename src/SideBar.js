import './SideBar.css';
import { useState } from 'react';
import Collapsible from 'react-collapsible';
import { Button } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import DefineReferenceModelModal from './reference_model_modal.js';
import DefineLogModal from './log_modal.js';
import SecurityControlList from './SecurityControlList.js';
import DefineMapping from './mapping_modal.js';

function SideBar({ refreshTrigger, refreshControls }) {
    const [showReferenceModelModal, setShowReferenceModelModal] = useState(false);
    const [showLogModal, setShowLogModal] = useState(false);
    const [showMappingModal, setShowMappingModal] = useState(false);

    const handleMappingModelLog = () => {
        setShowMappingModal(true);
    };

    const handleDefineReferenceModel = () => {
        setShowReferenceModelModal(true);
    };

    const handleCloseReferenceModelModal = () => {
        setShowReferenceModelModal(false);
    };

    const handleDefineLog = () => {
        setShowLogModal(true);
    };

    const handleCloseLogModal = () => {
        setShowLogModal(false);
    };

    const handleDefineMapping = () => {
        setShowMappingModal(true);
    };

    const handleCloseMappingModal = () => {
        setShowMappingModal(false);
    };

    return (
        <div className="sidebar">
            <div className="div-36">
                <div className="div-37">
                    <div className="div-38">
                        <div className="div-39">
                            <div className="div-40" />
                            <Collapsible
                                trigger={["Init Assessment", <img
                                loading="lazy"
                                src="https://cdn.builder.io/api/v1/image/assets/TEMP/c9992667147f295b32eec0696cb0fef65388fa9af146ce7034e2a192b713c079?"
                                className="img-30"
                            />]}>
                                <div className="div-41">
                                    <Button onClick={handleDefineReferenceModel}>Define Reference Model</Button>
                                    <DefineReferenceModelModal show={showReferenceModelModal} handleClose={handleCloseReferenceModelModal} />
                                    <Button onClick={handleDefineLog}>Define Log</Button>
                                    <DefineLogModal show={showLogModal} handleClose={handleCloseLogModal} />
                                    <Button onClick={handleMappingModelLog}>Mapping Log/Model</Button>
                                    <DefineMapping show={showMappingModal} handleClose={handleCloseMappingModal} />
                                </div>
                            </Collapsible>
                        </div>
                    </div>
                </div>
                <div className="div-43">
                    <div className="div-44">
                        <div className="div-45">
                            <div className="div-46" />
                            <div className="div-47">Global Progress</div>
                        </div>
                        <div className="div-48">
                            <img
                                loading="lazy"
                                src="https://cdn.builder.io/api/v1/image/assets/TEMP/beb1a305b95baf947f21a3c888e57eb1377d900ae2789d0ff3e2a79dc6161017?"
                                className="img-10"
                            />
                            <img
                                loading="lazy"
                                src="https://cdn.builder.io/api/v1/image/assets/TEMP/8895bd9f8d97cf1ce797fbfd735df7d6f317969a72619e5b468bb33460611015?"
                                className="img-11"
                            />
                        </div>
                    </div>
                    <div className="div-49">
                        <div className="div-50">Findings</div>
                        <div className="div-51">Findings</div>
                        <div className="div-52">...</div>
                        <img
                            loading="lazy"
                            src="https://cdn.builder.io/api/v1/image/assets/TEMP/96e324bffd3186716b48ddd8317790c83b6fb981fc546699e5f0103568d6330e?"
                            className="img-12"
                        />
                        <div className="div-53">
                            <div className="div-54">
                                <div className="div-55">
                                    <img
                                        loading="lazy"
                                        src="https://cdn.builder.io/api/v1/image/assets/TEMP/fe66aee1e69c3f4941d3b2cc9048c1d24e77528bae4d81db01266c1799f1a303?"
                                        className="img-13"
                                    />
                                    <div className="div-56">2</div>
                                </div>
                                <div className="div-57">
                                    <img
                                        loading="lazy"
                                        src="https://cdn.builder.io/api/v1/image/assets/TEMP/42041b1f88c45ba5845bf847491db1b901a569832d4e3a17ff9b804a384e3ec7?"
                                        className="img-14"
                                    />
                                    <div className="div-58">4</div>
                                </div>
                                <div className="div-59">
                                    <img
                                        loading="lazy"
                                        src="https://cdn.builder.io/api/v1/image/assets/TEMP/b93145e73c5b9857de3b957da5dd79a17b758f6a86aa035deef6883b1880ad35?"
                                        className="img-15"
                                    />
                                    <div className="div-60">1/5</div>
                                </div>
                            </div>
                            <img
                                loading="lazy"
                                srcSet="..."
                                className="img-16"
                            />
                        </div>
                    </div>
                </div>
            </div>
            <SecurityControlList refreshTrigger={refreshTrigger} refreshControls={refreshControls} />
        </div>
    );
}

export default SideBar;
