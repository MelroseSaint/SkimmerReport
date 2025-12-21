import { useState, useEffect } from 'react';
import { hasAcceptedDisclaimer, acceptDisclaimer } from '../utils/disclaimerUtils';
import './Disclaimer.css';

export default function Disclaimer() {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Check if user has already accepted the disclaimer
        if (!hasAcceptedDisclaimer()) {
            setIsVisible(true);
        }
    }, []);

    const handleAccept = () => {
        acceptDisclaimer();
        setIsVisible(false);
    };

    const handleDecline = () => {
        // Redirect away from the site if they decline
        window.location.href = 'about:blank';
    };

    if (!isVisible) {
        return null;
    }

    return (
        <div className="disclaimer-overlay">
            <div className="disclaimer-modal">
                <div className="disclaimer-content">
                    <h2>Important Disclaimer</h2>

                    <div className="disclaimer-text">
                        <p>
                            <strong>Skimmer Watcher</strong> is an independent, community-driven reporting platform. It is not a law enforcement agency, is not affiliated with, endorsed by, or operated by any police department, government entity, or financial institution, and does not act on behalf of any authority.
                        </p>

                        <p>
                            Information displayed on this platform is based on community submissions and internal review criteria only. Any classifications, labels, or statuses shown are not official determinations, are not investigative findings, and should not be interpreted as law enforcement confirmation or action.
                        </p>

                        <p>
                            <strong>Skimmer Watcher does not replace 911, emergency services, or official police reports.</strong> For crimes in progress, emergencies, or situations requiring immediate response, you must contact local law enforcement directly.
                        </p>

                        <div className="disclaimer-warning">
                            <p>
                                <strong>By continuing to use this site, you acknowledge and agree to these terms.</strong>
                            </p>
                        </div>
                    </div>

                    <div className="disclaimer-actions">
                        <button
                            className="disclaimer-btn decline"
                            onClick={handleDecline}
                        >
                            I Disagree - Leave Site
                        </button>
                        <button
                            className="disclaimer-btn accept"
                            onClick={handleAccept}
                        >
                            I Understand & Agree - Continue
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
