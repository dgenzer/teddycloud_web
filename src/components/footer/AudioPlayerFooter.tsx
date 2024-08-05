import React from "react";
import {
    PlayCircleOutlined,
    PauseCircleOutlined,
    StepBackwardOutlined,
    StepForwardOutlined,
    SoundOutlined,
    MutedOutlined,
    WarningOutlined,
    ShrinkOutlined,
    ArrowsAltOutlined,
    CloseOutlined,
} from "@ant-design/icons";
import { useAudioContext } from "../audio/AudioContext";
import { useEffect, useState } from "react";
import { Button, Popover, Progress, Slider, theme } from "antd";
import { useTranslation } from "react-i18next";

const { useToken } = theme;
const useThemeToken = () => useToken().token;
interface AudioPlayerFooterProps {
    isPlaying?: boolean;
    onPlayPause?: () => void;
    onLast?: () => void;
    onNext?: () => void;
    currentPlayPosition?: string;
    songImage?: string;
    onVisibilityChange: () => void;
}

const AudioPlayerFooter: React.FC<AudioPlayerFooterProps> = ({ onVisibilityChange }) => {
    const { t } = useTranslation();
    const { songImage, songArtist, songTitle, songTracks } = useAudioContext();
    const globalAudio = document.getElementById("globalAudioPlayer") as HTMLAudioElement;

    const [audioPlayerDisplay, setAudioPlayerDisplay] = useState<string>("none");
    const [showAudioPlayerMinimal, setShowAudioPlayerMinimal] = useState<boolean>(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentPlayPosition, setCurrentPlayPosition] = useState(0);
    const [currentPlayPositionFormat, setCurrentPlayPositionFormat] = useState("0:00");
    const [audioDurationFormat, setAudioDurationFormat] = useState("0:00");
    const [downloadProgress, setDownloadProgress] = useState<number>(0);
    const [cyclePosition, setCyclePosition] = useState<{
        left: number;
        top: number;
        visible: boolean;
    }>({ left: 0, top: 0, visible: false });
    const [isMouseDown, setIsMouseDown] = useState<boolean>(false);
    const [volume, setVolume] = useState<number | null>(100);
    const [lastVolume, setLastVolume] = useState<number | null>(100);
    const [closePlayerPopoverOpen, setClosePlayerPopoverOpen] = useState(false);

    const [isTouching, setIsTouching] = useState<boolean>(false);

    useEffect(() => {
        if (globalAudio) {
            if (volume === null) {
                globalAudio.volume = 0;
            } else {
                globalAudio.volume = volume / 100;
            }
        }
    }, [volume, globalAudio]);

    const handleVolumeSliderChange = (value: number | [number, number]) => {
        if (Array.isArray(value)) {
            return;
        }
        setVolume(value);
    };

    const handleMuteClick = () => {
        setLastVolume(volume);
        setVolume(0);
    };

    const handleUnMuteClick = () => {
        setVolume(lastVolume);
    };

    const handleAudioPlay = () => {
        setIsPlaying(true);
    };

    const handleAudioPause = () => {
        setIsPlaying(false);
    };

    const handleAudioEnded = () => {
        setIsPlaying(false);
    };

    const handlePlayButton = () => {
        globalAudio.play();
    };
    const handlePauseButton = () => {
        globalAudio.pause();
    };

    const handleClosePlayer = () => {
        closeClosePlayerPopOver();
        globalAudio.src = "";
        globalAudio.removeAttribute("src");
        globalAudio.load();
        setAudioPlayerDisplay("none");
        onVisibilityChange();
    };

    useEffect(() => {
        onVisibilityChange();
        if (globalAudio?.src && audioPlayerDisplay === "none") {
            setAudioPlayerDisplay("flex");
        }
    }, [audioPlayerDisplay, globalAudio?.src, onVisibilityChange]);

    const handleTimeUpdate = (event: React.SyntheticEvent<HTMLAudioElement, Event>) => {
        const audioElement = event.target as HTMLAudioElement;
        const minutes = Math.floor(audioElement.currentTime / 60);
        const seconds = Math.floor(audioElement.currentTime % 60);
        setCurrentPlayPosition((audioElement.currentTime / globalAudio.duration) * 100);
        setCurrentPlayPositionFormat(`${minutes}:${seconds < 10 ? "0" : ""}${seconds}`);
    };
    useEffect(() => {
        const globalAudio = document.getElementById("globalAudioPlayer") as HTMLAudioElement;
        globalAudio.addEventListener("loadedmetadata", () => {
            const minutes = Math.floor(globalAudio.duration / 60);
            const seconds = Math.floor(globalAudio.duration % 60);
            setAudioDurationFormat(`${minutes}:${seconds < 10 ? "0" : ""}${seconds}`);
        });
        globalAudio.addEventListener("progress", () => {
            if (globalAudio.buffered.length > 0) {
                const bufferedEnd = globalAudio.buffered.end(globalAudio.buffered.length - 1);
                const duration = globalAudio.duration;
                if (duration > 0) {
                    setDownloadProgress((bufferedEnd / duration) * 100);
                }
            }
        });
    }, []);

    const handleMouseOrTouchMove = (event: React.MouseEvent | React.TouchEvent) => {
        if ("touches" in event) {
            const touch = event.touches[0];
            const progressBarRect = event.currentTarget.getBoundingClientRect();
            const offsetX = touch.clientX - progressBarRect.left;
            const offsetY = progressBarRect.height / 2;
            setCyclePosition({ left: offsetX, top: offsetY, visible: true });
            globalAudio.currentTime = (offsetX / (showAudioPlayerMinimal ? 100 : 150)) * globalAudio.duration;
            // prevent default Click!
            setIsTouching(true);
        } else {
            const progressBarRect = event.currentTarget.getBoundingClientRect();
            const offsetX = event.clientX - progressBarRect.left;
            const offsetY = progressBarRect.height / 2;
            setCyclePosition({ left: offsetX, top: offsetY, visible: true });

            if (isMouseDown) {
                handleClick();
            }
        }
    };
    const handleMouseLeave = () => {
        setCyclePosition({ left: 0, top: 0, visible: false });
    };
    const handleClick = () => {
        if (isTouching) {
            setIsTouching(false);
            handleMouseLeave();
        } else {
            globalAudio.currentTime =
                (cyclePosition.left / (showAudioPlayerMinimal ? 100 : 150)) * globalAudio.duration;
        }
    };
    const handleMouseDown = (event: React.MouseEvent) => {
        setIsMouseDown(true);
    };
    const handleMouseUp = (event: React.MouseEvent) => {
        setIsMouseDown(false);
    };

    const togglePlayerMinimal = () => {
        setShowAudioPlayerMinimal(!showAudioPlayerMinimal);
        onVisibilityChange();
    };

    const closeClosePlayerPopOver = () => {
        setClosePlayerPopoverOpen(false);
    };

    const openClosePlayerPopOver = () => {
        setClosePlayerPopoverOpen(true);
    };

    const handlePrevTrackButton = () => {
        let i = 0;
        while (globalAudio.currentTime > songTracks[i] / 3.15) {
            i++;
            if (i > songTracks.length) {
                break;
            }
        }
        if (i > 1 && i <= songTracks.length) {
            globalAudio.currentTime = songTracks[i - 2] / 3.15;
        } else if (i <= 1) {
            globalAudio.currentTime = 0;
        }
    };

    const handleNextTrackButton = () => {
        let i = 0;
        while (globalAudio.currentTime > songTracks[i] / 3.15) {
            i++;
            if (i > songTracks.length) {
                break;
            }
        }
        if (i < songTracks.length) {
            globalAudio.currentTime = songTracks[i] / 3.15;
        }
    };

    // mediasession for lockscreen without re-rendering
    useEffect(() => {
        const handlePlayPause = (play: boolean) => {
            if (play) {
                globalAudio?.play();
                setIsPlaying(true);
            } else {
                globalAudio?.pause();
                setIsPlaying(false);
            }
        };

        if (navigator.mediaSession) {
            navigator.mediaSession.metadata = new MediaMetadata({
                title: songTitle || "",
                artist: songArtist || "",
                artwork: [{ src: songImage || "", sizes: "96x96,128x128,192x192,256x256,384x384,512x512" }],
            });

            navigator.mediaSession.setActionHandler("play", () => {
                handlePlayPause(true);
            });

            navigator.mediaSession.setActionHandler("pause", () => {
                handlePlayPause(false);
            });

            navigator.mediaSession.setActionHandler("previoustrack", handlePrevTrackButton);

            if (songTracks.length > 0) {
                navigator.mediaSession.setActionHandler("nexttrack", handleNextTrackButton);
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [songTitle, songArtist, songImage, songTracks, globalAudio]);

    // rearrange player for mobile
    const isMobile = window.innerWidth <= 768;
    const innerContainerStyle: React.CSSProperties = isMobile
        ? {
              ...styles.innerContainer,
              flexDirection: "column",
              alignItems: "center",
              width: "100%",
              gap: 8,
          }
        : styles.innerContainer;
    const control2Style: React.CSSProperties = isMobile
        ? {
              ...styles.controls2,
              width: "100%",
          }
        : styles.controls2;
    const progressBarStyle: React.CSSProperties = isMobile
        ? {
              ...styles.progressBar,
              width: 200,
              marginRight: 0,
          }
        : styles.progressBar;

    useEffect(() => {
        onVisibilityChange();
    }, [onVisibilityChange, isMobile]);

    const minMaximizerClose = (
        <>
            {showAudioPlayerMinimal ? (
                <ArrowsAltOutlined onClick={togglePlayerMinimal} />
            ) : (
                <ShrinkOutlined onClick={togglePlayerMinimal} />
            )}
            <Popover
                title={
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        <div>
                            <WarningOutlined /> {t("tonies.closeAudioPlayerPopover")}
                        </div>
                        <div style={{ display: "flex", flexDirection: "row", gap: 8 }}>
                            <Button onClick={closeClosePlayerPopOver}>{t("tonies.cancel")}</Button>
                            <Button onClick={handleClosePlayer}>{t("tonies.closeAudioPlayer")}</Button>
                        </div>
                    </div>
                }
                open={closePlayerPopoverOpen}
                trigger="click"
                onOpenChange={closeClosePlayerPopOver}
                className="closePlayerPopover"
                placement="top"
                style={{ right: 8 }}
            >
                <CloseOutlined style={{ margin: "0 0 0 10px" }} onClick={openClosePlayerPopOver} />
            </Popover>
        </>
    );

    const progressBar = (
        <>
            <Progress
                type="line"
                success={{
                    percent: currentPlayPosition,
                    strokeColor: "#1677ff",
                }}
                percent={downloadProgress}
                strokeColor="#272727"
                format={() => ""}
                status="active"
                showInfo={false}
            />
            {cyclePosition.visible && (
                <svg
                    style={{
                        position: "absolute",
                        left: cyclePosition.left,
                        top: cyclePosition.top,
                        transform: "translate(-50%, -50%)",
                    }}
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                >
                    <circle cx="8" cy="8" r="8" fill="rgba(0,0,0,0.5)" />
                </svg>
            )}
        </>
    );

    const minimalPlayer = showAudioPlayerMinimal ? (
        <>
            <span
                id="minimalAudioPlayer"
                style={{ ...innerContainerStyle, display: showAudioPlayerMinimal ? "flex" : "none", padding: 0 }}
            >
                <div style={styles.trackInfo}>
                    {isPlaying ? (
                        <PauseCircleOutlined style={{ fontSize: 24, marginRight: 8 }} onClick={handlePauseButton} />
                    ) : (
                        <PlayCircleOutlined style={{ fontSize: 24, marginRight: 8 }} onClick={handlePlayButton} />
                    )}
                    {songImage && <img src={songImage} alt="Song" style={styles.songImage} />}

                    {!audioDurationFormat.startsWith("Infinity") ? (
                        <div style={{ ...styles.playPositionContainer, marginRight: 0 }}>
                            <div style={{ display: "flex" }}>
                                <div style={{ textAlign: "center", marginBottom: 0 }}>
                                    {currentPlayPositionFormat} / {audioDurationFormat}
                                </div>
                                <span style={{ margin: 0, marginLeft: 16, textAlign: "right" }}>
                                    {minMaximizerClose}
                                </span>
                            </div>
                            <div
                                style={{ ...progressBarStyle, width: 100 }}
                                onMouseDown={handleMouseDown}
                                onMouseMove={handleMouseOrTouchMove}
                                onMouseUp={handleMouseUp}
                                onMouseLeave={handleMouseLeave}
                                onTouchStart={handleMouseOrTouchMove}
                                onTouchMove={handleMouseOrTouchMove}
                                onClick={handleClick}
                            >
                                {progressBar}
                            </div>
                        </div>
                    ) : (
                        <div style={{ ...styles.playPositionContainer, marginRight: 0 }}>
                            <div style={{ display: "flex" }}>
                                <div style={{ textAlign: "center", marginBottom: 0 }}> </div>
                                <span>{minMaximizerClose}</span>
                            </div>
                        </div>
                    )}
                </div>
            </span>
        </>
    ) : (
        ""
    );

    const normalPlayer = !showAudioPlayerMinimal ? (
        <>
            <span
                id="normalAudioPlayer"
                style={{
                    margin: 0,
                    marginLeft: 16,
                    textAlign: "right",
                    display: showAudioPlayerMinimal ? "none" : "flex",
                    position: "absolute",
                }}
            >
                {minMaximizerClose}
            </span>
            <span style={{ ...innerContainerStyle, display: showAudioPlayerMinimal ? "none" : "flex" }}>
                <div id="audioPlayer" style={styles.controls}>
                    <StepBackwardOutlined style={styles.controlButton} onClick={handlePrevTrackButton} />
                    {isPlaying ? (
                        <PauseCircleOutlined style={styles.controlButton} onClick={handlePauseButton} />
                    ) : (
                        <PlayCircleOutlined style={styles.controlButton} onClick={handlePlayButton} />
                    )}
                    <StepForwardOutlined
                        style={{
                            ...styles.controlButton,
                            cursor: songTracks.length === 0 ? "default" : "pointer",
                            opacity: songTracks.length === 0 ? 0.25 : 1.0,
                        }}
                        disabled={songTracks.length === 0}
                        onClick={handleNextTrackButton}
                    />
                </div>
                <div style={styles.trackInfo}>
                    {songImage && <img src={songImage} alt="Song" style={styles.songImage} />}
                    <div style={styles.songContainer}>
                        <div>{songTitle}</div>
                        <div>{songArtist}</div>
                    </div>
                </div>
                {!audioDurationFormat.startsWith("Infinity") ? (
                    <div style={styles.playPositionContainer}>
                        <div>
                            <div style={{ textAlign: "center" }}>
                                {currentPlayPositionFormat} / {audioDurationFormat}
                            </div>
                        </div>
                        <div
                            style={progressBarStyle}
                            onMouseDown={handleMouseDown}
                            onMouseMove={handleMouseOrTouchMove}
                            onMouseUp={handleMouseUp}
                            onMouseLeave={handleMouseLeave}
                            onTouchStart={handleMouseOrTouchMove}
                            onTouchMove={handleMouseOrTouchMove}
                            onClick={handleClick}
                        >
                            {progressBar}
                        </div>
                    </div>
                ) : (
                    ""
                )}
                <div style={control2Style}>
                    <div style={{ ...styles.controls, position: "relative" }}>
                        <MutedOutlined
                            style={{
                                ...styles.controlButton,
                                ...styles.volumeIcon,
                                display: (volume || 0) === 0 ? "block" : "none",
                            }}
                            onClick={handleUnMuteClick}
                        />
                        <SoundOutlined
                            style={{
                                ...styles.controlButton,
                                ...styles.volumeIcon,
                                display: (volume || 0) > 0 ? "block" : "none",
                            }}
                            onClick={handleMuteClick}
                        />
                        <div style={styles.volumeSlider}>
                            <Slider min={0} max={100} value={volume || 0} onChange={handleVolumeSliderChange} />
                        </div>
                    </div>
                </div>
            </span>
        </>
    ) : (
        ""
    );

    return (
        <>
            <div
                style={{
                    ...styles.container,
                    display: audioPlayerDisplay,
                    visibility: !globalAudio?.src ? "hidden" : "visible",
                    height: !globalAudio?.src ? "0" : "auto",
                    margin: !globalAudio?.src ? "-24px" : "0",
                    marginBottom: !globalAudio?.src ? "0" : "8px",
                    overflow: "hidden",
                }}
            >
                {minimalPlayer}
                {normalPlayer}
            </div>
            <audio
                id="globalAudioPlayer"
                controls={true}
                onPlay={handleAudioPlay}
                onPause={handleAudioPause}
                onEnded={handleAudioEnded}
                onTimeUpdate={handleTimeUpdate}
                style={{ display: "none" }}
            >
                Your browser does not support the audio element.
            </audio>
        </>
    );
};

const styles = {
    container: {
        flexDirection: "column" as "column",
        alignItems: "flex-end",
        objectPosition: "top",
        padding: 10,
        backgroundColor: "#333",
        borderRadius: 8,
        gap: 8,
    },
    innerContainer: {
        justifyContent: "space-between",
        alignItems: "center",
        padding: 10,
        backgroundColor: "#333",
        borderRadius: 8,
        gap: 8,
    },
    controls: {
        display: "flex",
        alignItems: "center",
    },
    controlButton: {
        fontSize: 24,
        margin: "0 10px",
        cursor: "pointer",
    },
    trackInfo: {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
    },
    songImage: {
        width: "auto",
        height: 40,
        borderRadius: "50%",
        marginRight: 10,
    },
    songContainer: {},
    songTitle: {
        display: "block",
    },
    songArtist: {
        display: "block",
    },
    progressBar: {
        display: "block",
        position: "relative" as "relative",
        width: 150,
        marginRight: 10,
    },
    playPosition: {
        fontSize: 14,
        width: "100%",
    },
    playPositionContainer: {
        marginLeft: 10,
        marginRight: 10,
    },
    controls2: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        height: 24,
    },
    volumeSlider: {
        width: 100,
        position: "releative" as "relative",
        marginRight: 16,
        top: "calc(100% + 10px)",
        zIndex: 1000,
        backgroundColor: `${() => useThemeToken().colorBgContainer}`,
        padding: 0,
    },
    volumeIcon: {
        fontSize: 24,
        cursor: "pointer",
        marginBottom: 0,
    },
};

export default AudioPlayerFooter;
