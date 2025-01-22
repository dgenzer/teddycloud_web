import { useEffect, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { TonieCardProps } from "../../types/tonieTypes";

import { defaultAPIConfig } from "../../config/defaultApiConfig";
import { TeddyCloudApi } from "../../api";

import { Button, Card, Divider, Input, Flex, theme, Descriptions, Tabs } from "antd";
import { CloudSyncOutlined, CheckCircleOutlined, DownloadOutlined, StopOutlined, PlayCircleOutlined, RetweetOutlined, RollbackOutlined, CloseOutlined, FolderOpenOutlined, WifiOutlined, SaveFilled, EditOutlined } from "@ant-design/icons";

import BreadcrumbWrapper, { ColumnOnMobile, HiddenDesktop, HiddenMobile, StyledContent, StyledLayout, StyledSider } from "../../components/StyledComponents";
import { ToniesSubNav } from "../../components/tonies/ToniesSubNav";
import LoadingSpinner from "../../components/utils/LoadingSpinner";
import { useTeddyCloud } from "../../TeddyCloudContext";
import { NotificationTypeEnum } from "../../types/teddyCloudNotificationTypes";
import { useAudioContext } from "../../components/audio/AudioContext";
import LanguageFlagSVG from "../../utils/languageUtil";
import { SelectFileFileBrowser } from "../../components/utils/SelectFileFileBrowser";
import { RadioStreamSearch } from "../../components/utils/RadioStreamSearch";
import { TonieArticleSearch } from "../../components/tonies/TonieArticleSearch";


const api = new TeddyCloudApi(defaultAPIConfig());

const { useToken } = theme;

export const TonieDetailPage = () => {
    const { t } = useTranslation();
    const { addNotification, addLoadingNotification, closeLoadingNotification } = useTeddyCloud();
    const { token } = useToken();
    const location = useLocation();
    const { id } = useParams<{ id: string }>();
    if (!id) return null;
    const { playAudio } = useAudioContext();


    const searchParams = new URLSearchParams(location.search);
    const overlay = searchParams.get("overlay") || "";

    const [loading, setLoading] = useState(true);

    const [tonie, setTonie] = useState<TonieCardProps | null>(null);
    const [isNoCloud, setIsNoCloud] = useState(false);
    const [isLive, setIsLive] = useState(false);
    const [downloadTriggerUrl, setDownloadTriggerUrl] = useState("");

    useEffect(() => {
        const fetchUpdatedTonieCard = async () => {
            setLoading(true);
            try {
                const updatedTonieCard = await api.apiGetTagInfo(id, overlay);
                setTonie(updatedTonieCard);
                setIsLive(updatedTonieCard.live);
                setIsNoCloud(updatedTonieCard.nocloud);
                setDownloadTriggerUrl(updatedTonieCard.downloadTriggerUrl);

                setActiveSource(updatedTonieCard.source);
                setSelectedSource(updatedTonieCard.source);

                setActiveModel(updatedTonieCard.tonieInfo.model);
                setSelectedModel(updatedTonieCard.tonieInfo.model);
            } catch (error) {
                addNotification(
                    NotificationTypeEnum.Error,
                    t("tonies.messages.errorFetchingUpdatedCard"),
                    t("tonies.messages.errorFetchingUpdatedCardDetails", {
                        model: modelTitle,
                        ruid: id,
                    }).replace(' "" ', "") + error,
                    t("tonies.title")
                );
            } finally {
                setLoading(false);
            }
        };
        fetchUpdatedTonieCard();
    }, [id, overlay, addNotification, t])


    const handlePlayPauseClick = async (url: string, startTime?: number) => {
        if (tonie) {
            setActiveSource(tonie.source);

            playAudio(
                url,
                tonie.sourceInfo ? tonie.sourceInfo : tonie.tonieInfo,
                tonie,
                startTime
            );
        }
    };

    const handleLiveClick = async () => {
        if (!tonie) return;
        try {
            await api.apiPostTeddyCloudContentJson(id, "live=" + !isLive, overlay);
            setIsLive(!isLive);
            setTonie(tonie);
            if (!isLive) {
                addNotification(
                    NotificationTypeEnum.Success,
                    t("tonies.messages.liveEnabled"),
                    t("tonies.messages.liveEnabledDetails", { model: modelTitle, ruid: id }).replace(
                        ' "" ',
                        " "
                    ),
                    t("tonies.title")
                );
            } else {
                addNotification(
                    NotificationTypeEnum.Success,
                    t("tonies.messages.liveDisabled"),
                    t("tonies.messages.liveDisabledDetails", { model: modelTitle, ruid: id }).replace(
                        ' "" ',
                        " "
                    ),
                    t("tonies.title")
                );
            }
        } catch (error) {
            addNotification(
                NotificationTypeEnum.Error,
                t("tonies.messages.couldNotChangeLiveFlag"),
                t("tonies.messages.couldNotChangeLiveFlagDetails", {
                    model: modelTitle,
                    ruid: id,
                }).replace(' "" ', "") + error,
                t("tonies.title")
            );
        }
    };

    const handleNoCloudClick = async () => {
        if (!tonie) return;
        try {
            await api.apiPostTeddyCloudContentJson(id, "nocloud=" + !isNoCloud, overlay);

            setIsNoCloud(!isNoCloud);
            setTonie(tonie);
            if (!isNoCloud) {
                addNotification(
                    NotificationTypeEnum.Success,
                    t("tonies.messages.cloudAccessBlocked"),
                    t("tonies.messages.cloudAccessBlockedDetails", {
                        model: modelTitle,
                        ruid: id,
                    }).replace(' "" ', " "),
                    t("tonies.title")
                );
            } else {
                addNotification(
                    NotificationTypeEnum.Success,
                    t("tonies.messages.cloudAccessEnabled"),
                    t("tonies.messages.cloudAccessEnabledDetails", {
                        model: modelTitle,
                        ruid: id,
                    }).replace(' "" ', " "),
                    t("tonies.title")
                );
            }
        } catch (error) {
            addNotification(
                NotificationTypeEnum.Error,
                t("tonies.messages.couldNotChangeCloudFlag"),
                t("tonies.messages.couldNotChangeCloudFlagDetails", {
                    model: modelTitle,
                    ruid: id,
                }).replace(' "" ', "") + error,
                t("tonies.title")
            );
        }
    };

    const handleBackgroundDownload = async () => {
        if (!tonie) return;
        const path = tonie.downloadTriggerUrl;
        setDownloadTriggerUrl("");
        const key = "loading" + id;

        try {
            addLoadingNotification(
                key,
                t("tonies.messages.downloading"),
                t("tonies.messages.downloadingDetails", {
                    model: modelTitle,
                    ruid: id,
                }).replace(' "" ', " ")
            );

            const response = await api.apiGetTeddyCloudApiRaw(path);
            // blob used that message is shown after download finished
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const blob = await response.blob();
            closeLoadingNotification(key);

            addNotification(
                NotificationTypeEnum.Success,
                t("tonies.messages.downloadedFile"),
                t("tonies.messages.downloadedFileDetails", { model: modelTitle, ruid: id }).replace(
                    ' "" ',
                    " "
                ),
                t("tonies.title")
            );
        } catch (error) {
            closeLoadingNotification(key);
            addNotification(
                NotificationTypeEnum.Error,
                t("tonies.messages.errorDuringDownload"),
                t("tonies.messages.errorDuringDownloadDetails", {
                    model: modelTitle,
                    ruid: id,
                }).replace(' "" ', "") + error,
                t("tonies.title")
            );
            // this could be a kind of problem if auth is necessary for accessing the API
            setDownloadTriggerUrl(import.meta.env.VITE_APP_TEDDYCLOUD_API_URL + path);
        }
    };


    const [informationFromSource, setInformationFromSource] = useState<boolean>(false);
    const [sourcePic, setSourcePic] = useState<string>("");
    const [sourceTracks, setSourceTracks] = useState<string[]>([]);


    useEffect(() => {
        if (

            tonie && "sourceInfo" in tonie &&
            ((tonie.sourceInfo.picture !== tonie.tonieInfo.picture &&
                modelTitle !== sourceTitle) ||
                (tonie.sourceInfo.picture === tonie.tonieInfo.picture &&
                    modelTitle !== sourceTitle) ||
                tonie.sourceInfo.series !== tonie.tonieInfo.series ||
                tonie.sourceInfo.episode !== tonie.tonieInfo.episode ||
                tonie.sourceInfo.tracks.join(".") !== tonie.tonieInfo.tracks.join("."))
        ) {
            setInformationFromSource(true);
            setSourcePic(tonie.sourceInfo.picture);
            setSourceTracks(tonie.sourceInfo.tracks);
            console.log({ informationFromSource, sourcePic, sourceTracks });
        }
        // eslint-disable-next-line react-hooks/exhaustive-
    }, [tonie, open]);


    const modelTitle =
        `${tonie?.tonieInfo?.series}` +
        (tonie?.tonieInfo?.episode ? ` - ${tonie?.tonieInfo?.episode}` : "");

    const sourceTitle =
        tonie && "sourceInfo" in tonie
            ? `${tonie?.sourceInfo?.series}` +
            (tonie?.sourceInfo?.episode ? ` - ${tonie?.sourceInfo?.episode}` : "")
            : "";


    const trackSecondsMatchSourceTracks = (tonie: TonieCardProps, tracksLength: number) => {
        const trackSeconds = tonie?.trackSeconds;
        return trackSeconds?.length === tracksLength;
    };

    const getTrackStartTime = (tonie: TonieCardProps, index: number) => {
        const trackSeconds = tonie?.trackSeconds
        return (trackSeconds && trackSeconds[index]) || 0;
    };


    //  FILE
    const [keyInfoModal, setKeyInfoModal] = useState(0);
    const [keyRadioStreamSearch, setKeyRadioStreamSearch] = useState(0);
    const [keyTonieArticleSearch, setKeyTonieArticleSearch] = useState(0);
    const [keySelectFileFileBrowser, setKeySelectFileFileBrowser] = useState(0);

    const [activeSource, setActiveSource] = useState(tonie?.source); // the stored source
    const [tempActiveSource, setTempActiveSource] = useState(tonie?.source); // the previously selected, but not saved source
    const [selectedSource, setSelectedSource] = useState(activeSource || ""); // the current selected source
    const [tempSelectedSource, setTempSelectedSource] = useState(selectedSource); // the current selected but not confirmed source
    const [inputValidationSource, setInputValidationSource] = useState<{
        validateStatus: ValidateStatus;
        help: string;
    }>({
        validateStatus: "",
        help: "",
    });

    type ValidateStatus = "" | "success" | "warning" | "error" | "validating" | undefined;


    const handleFileSelectChange = (files: any[], path: string, special: string) => {
        console.log("File changed", files, activeSource);
        if (files && files.length === 1) {
            const prefix = special === "library" ? "lib:/" : "content:/";
            const filePath = prefix + path + "/" + files[0].name;
            setTempSelectedSource(filePath);
        } else {
            setTempSelectedSource(activeSource || "");
        }

        setSelectedSource(tempSelectedSource);
    };

    const handleSourceInputChange = (e: any) => {
        setSelectedSource(e.target.value);
        setTempSelectedSource(e.target.value);
    };

    const searchRadioResultChanged = (newValue: string) => {
        setSelectedSource(newValue);
        setTempActiveSource(newValue);
    };

    const handleSourceSave = async () => {
        if (!(selectedSource && selectedSource.length > 0)) return
        try {
            await api.apiPostTeddyCloudContentJson(
                id,
                "source=" + encodeURIComponent(selectedSource),
                overlay
            );
            setActiveSource(selectedSource);
            setTempActiveSource(tempSelectedSource);
            addNotification(
                NotificationTypeEnum.Success,
                t("tonies.messages.setTonieToSourceSuccessful"),
                t("tonies.messages.setTonieToSourceSuccessfulDetails", {
                    ruid: id,
                    selectedSource: selectedSource ? selectedSource : t("tonies.messages.setToEmptyValue"),
                }),
                t("tonies.title")
            );
            setInputValidationSource({ validateStatus: "", help: "" });
        } catch (error) {
            addNotification(
                NotificationTypeEnum.Error,
                t("tonies.messages.setTonieToSourceFailed"),
                t("tonies.messages.setTonieToSourceFailedDetails", {
                    ruid: id,
                }) + error,
                t("tonies.title")
            );
            setInputValidationSource({
                validateStatus: "error",
                help: t("tonies.messages.setTonieToSourceFailed") + error,
            });
            throw error;
        }

        if (!isNoCloud) {
            handleNoCloudClick();
        }
        if (selectedSource.startsWith("http") && !isLive) {
            handleLiveClick();
        } else if (!selectedSource.startsWith("http") && isLive) {
            handleLiveClick();
        }
    };



    // -- FILE

    // MODEL
    const [activeModel, setActiveModel] = useState(tonie?.tonieInfo.model);
    const [selectedModel, setSelectedModel] = useState("");
    const [inputValidationModel, setInputValidationModel] = useState<{
        validateStatus: ValidateStatus;
        help: string;
    }>({
        validateStatus: "",
        help: "",
    });

    const handleModelInputChange = (e: any) => {
        setSelectedModel(e.target.value);
    };

    const searchModelResultChanged = (newValue: string) => {
        setSelectedModel(newValue);
    };

    const handleModelSave = async () => {
        try {
            await api.apiPostTeddyCloudContentJson(
                id,
                "tonie_model=" + encodeURIComponent(selectedModel),
                overlay
            );
            setActiveModel(selectedModel);

            addNotification(
                NotificationTypeEnum.Success,
                t("tonies.messages.setTonieToModelSuccessful", {
                    selectedModel: selectedModel ? selectedModel : t("tonies.messages.setToEmptyValue"),
                }),
                t("tonies.messages.setTonieToModelSuccessfulDetails", {
                    ruid: id,
                    selectedModel: selectedModel ? selectedModel : t("tonies.messages.setToEmptyValue"),
                }),
                t("tonies.title")
            );
            setInputValidationModel({ validateStatus: "", help: "" });
        } catch (error) {
            addNotification(
                NotificationTypeEnum.Error,
                t("tonies.messages.setTonieToModelFailed"),
                t("tonies.messages.setTonieToModelFailedDetails", {
                    ruid: id,
                }) + error,
                t("tonies.title")
            );
            setInputValidationModel({
                validateStatus: "error",
                help: t("tonies.messages.setTonieToModelFailed") + error,
            });
            throw error;
        }
    };

    // -- MODEL

    const [editMode, setEditMode] = useState(false);
    const handleEditModeClick = () => {
        setEditMode(!editMode);
    }



    return (
        <>
            <StyledSider>
                <ToniesSubNav />
            </StyledSider>
            <StyledLayout>
                <BreadcrumbWrapper
                    items={[{ title: t("home.navigationTitle") }, { title: t("tonies.navigationTitle") }, { title: tonie?.tonieInfo.series || "" }, { title: tonie?.tonieInfo.episode || "" }]}
                />
                <StyledContent>
                    <div>
                        <h1 style={{ margin: 0 }}>{tonie?.tonieInfo.episode}</h1>
                        <h3 style={{ margin: 0, color: "gray" }}>{tonie?.tonieInfo.series}</h3>
                        <Divider />
                        <ColumnOnMobile>
                            <div>
                                <img
                                    alt={`${tonie?.tonieInfo.series} - ${tonie?.tonieInfo.episode}`}
                                    src={
                                        tonie?.tonieInfo.picture ? tonie?.tonieInfo.picture : "/img_unknown.png"
                                    }
                                    style={{ maxWidth: "100%" }}
                                />
                            </div>
                            {tonie && ((sourceTracks && sourceTracks.length > 0) || (tonie.tonieInfo?.tracks && tonie.tonieInfo?.tracks.length > 0)) && (
                                <HiddenMobile>
                                    <Divider type="vertical" style={{ height: "100%" }} />
                                </HiddenMobile>
                            )}
                            <HiddenDesktop>
                                <Divider />
                            </HiddenDesktop>
                            <div style={{ minWidth: "30%" }}>
                                {informationFromSource ? (
                                    tonie && sourceTracks && sourceTracks.length > 0 ? (
                                        <>
                                            <strong>{t("tonies.infoModal.tracklist")}</strong>
                                            <ol>
                                                {sourceTracks.map((track, index) => (
                                                    <li key={index}>
                                                        {"audioUrl" in tonie &&
                                                            trackSecondsMatchSourceTracks(
                                                                tonie,
                                                                tonie.sourceInfo.tracks?.length
                                                            ) ? (
                                                            <>
                                                                <PlayCircleOutlined
                                                                    key="playpause"
                                                                    onClick={() =>
                                                                        handlePlayPauseClick(
                                                                            import.meta.env.VITE_APP_TEDDYCLOUD_API_URL +
                                                                            tonie.audioUrl,
                                                                            getTrackStartTime(tonie, index)
                                                                        )
                                                                    }
                                                                />{" "}
                                                            </>
                                                        ) : (
                                                            ""
                                                        )}{" "}
                                                        {track}
                                                    </li>
                                                ))}
                                            </ol>
                                        </>
                                    ) : (
                                        <></>
                                    )
                                ) : tonie?.tonieInfo?.tracks && tonie?.tonieInfo?.tracks.length > 0 ? (
                                    <div
                                        style={{ minWidth: "50%" }}>
                                        <strong>{t("tonies.infoModal.tracklist")}</strong>
                                        <ol>
                                            {tonie?.tonieInfo?.tracks.map((track, index) => (
                                                <li key={index}>
                                                    {"audioUrl" in tonie &&
                                                        trackSecondsMatchSourceTracks(
                                                            tonie,
                                                            tonie?.tonieInfo.tracks?.length
                                                        ) ? (
                                                        <>
                                                            <PlayCircleOutlined
                                                                key="playpause"
                                                                onClick={() =>
                                                                    handlePlayPauseClick(
                                                                        import.meta.env.VITE_APP_TEDDYCLOUD_API_URL +
                                                                        tonie?.audioUrl,
                                                                        getTrackStartTime(tonie, index)
                                                                    )
                                                                }
                                                            />{" "}
                                                        </>
                                                    ) : (
                                                        ""
                                                    )}{" "}
                                                    {track}
                                                </li>
                                            ))}
                                        </ol>
                                    </div>
                                ) : (
                                    ""
                                )}
                            </div>
                        </ColumnOnMobile>
                        <Divider />
                        <Flex gap="small" wrap>
                            {editMode ?
                                <Button key="editMode" onClick={handleEditModeClick} type="primary" icon={<EditOutlined />}></Button>
                                :
                                <Button key="editMode" onClick={handleEditModeClick} type="primary" ghost icon={<EditOutlined />}></Button>
                            }

                            <Button
                                key="nocloud"
                                style={{ color: isNoCloud ? "red" : token.colorTextDescription }}
                                onClick={handleNoCloudClick}
                                icon={<CloudSyncOutlined />}
                            >{isNoCloud ? t("tonies.messages.cloudAccessBlocked") : t("tonies.messages.cloudAccessEnabled")}
                            </Button>

                            <Button
                                key="live"
                                style={{ color: isLive ? "red" : token.colorTextDescription }}
                                onClick={handleLiveClick}
                                icon={<RetweetOutlined />}
                            >{isLive ? t("tonies.messages.liveEnabled") : t("tonies.messages.liveDisabled")}
                            </Button>

                            {downloadTriggerUrl && downloadTriggerUrl.length > 0 ? (
                                <Button key="download" onClick={handleBackgroundDownload} icon={<DownloadOutlined />} />
                            ) : (<Button
                                key="playpause"
                                onClick={() =>
                                    handlePlayPauseClick(
                                        tonie?.valid
                                            ? import.meta.env.VITE_APP_TEDDYCLOUD_API_URL + (tonie?.audioUrl || "")
                                            : activeSource || ""
                                    )
                                }
                                icon={<PlayCircleOutlined />}
                            >{t("fileBrowser.help.actionItems.playAudioFile.title")}
                            </Button>)
                            }
                        </Flex>

                        {editMode && (<>
                            <Divider />

                            <Card title={t("tonies.selectFileModal.selectFile")} actions={[
                                <Button
                                    type="primary"
                                    onClick={handleSourceSave}
                                    disabled={activeSource === selectedSource}
                                >
                                    <SaveFilled key="saveClick" /> {t("tonies.editModal.save")}
                                </Button>
                            ]}>
                                <Input
                                    key="source"
                                    value={selectedSource}
                                    width="auto"
                                    onChange={handleSourceInputChange}
                                    addonBefore={[
                                        <CloseOutlined
                                            key="close-source"
                                            onClick={() => {
                                                setSelectedSource("");
                                                setInputValidationSource({ validateStatus: "", help: "" });
                                            }}
                                        />,
                                        <Divider key="divider-source" type="vertical" style={{ height: 16 }} />,
                                        <RollbackOutlined
                                            key="rollback-source"
                                            onClick={() => {
                                                setSelectedSource(activeSource || "");
                                                setTempSelectedSource(activeSource || "");
                                                setInputValidationSource({ validateStatus: "", help: "" });
                                            }}
                                            style={{
                                                color: activeSource === selectedSource ? token.colorTextDisabled : token.colorText,
                                                cursor: activeSource === selectedSource ? "default" : "pointer",
                                            }}
                                        />,
                                    ]}
                                />

                                <Divider />

                                {activeSource && <Tabs
                                    defaultActiveKey={activeSource.startsWith("lib://") ? "file" : "radio"}
                                    centered
                                    items={[
                                        {
                                            key: "file",
                                            label: "",
                                            icon: <FolderOpenOutlined />,
                                            children: [
                                                <SelectFileFileBrowser
                                                    key={keySelectFileFileBrowser}
                                                    special="library"
                                                    maxSelectedRows={1}
                                                    trackUrl={false}
                                                    filetypeFilter={[".taf", ".tap"]}
                                                    onFileSelectChange={handleFileSelectChange}
                                                />
                                            ]
                                        },
                                        {
                                            key: "radio",
                                            label: "",
                                            icon: <WifiOutlined />,
                                            children: [
                                                <RadioStreamSearch
                                                    placeholder={t("tonies.editModal.placeholderSearchForARadioStream")}
                                                    onChange={searchRadioResultChanged}
                                                    key={keyRadioStreamSearch}
                                                />
                                            ]
                                        }
                                    ]}
                                />}
                            </Card>

                            <Divider />

                            <Card title={t("tonies.editModal.title")} actions={[
                                <Button
                                    type="primary"
                                    onClick={handleModelSave}
                                    disabled={activeModel === selectedModel}
                                >
                                    <SaveFilled key="saveClick" /> {t("tonies.editModal.save")}
                                </Button>
                            ]}>
                                <Input
                                    key="model"
                                    value={selectedModel}
                                    width="auto"
                                    onChange={handleModelInputChange}
                                    addonBefore={[
                                        <CloseOutlined
                                            key="close-model"
                                            onClick={() => {
                                                setSelectedModel("");
                                                setInputValidationModel({ validateStatus: "", help: "" });
                                            }}
                                        />,
                                        <Divider key="divider-model" type="vertical" style={{ height: 16 }} />,
                                        <RollbackOutlined
                                            key="rollback-model"
                                            onClick={() => {
                                                setSelectedModel(activeModel || "");
                                                setInputValidationModel({ validateStatus: "", help: "" });
                                            }}
                                            style={{
                                                color: activeModel === selectedModel ? token.colorTextDisabled : token.colorText,
                                                cursor: activeModel === selectedModel ? "default" : "pointer",
                                            }}
                                        />,
                                    ]}
                                />
                                <TonieArticleSearch
                                    placeholder={t("tonies.editModal.placeholderSearchForAModel")}
                                    onChange={searchModelResultChanged}
                                    key={keyTonieArticleSearch}
                                />

                            </Card>
                        </>
                        )}

                        <Divider />
                        <Descriptions bordered>
                            <Descriptions.Item label="language">
                                <LanguageFlagSVG countryCode={tonie?.tonieInfo.language || "unknown"} height={20} />
                            </Descriptions.Item>
                            <Descriptions.Item label="model">{tonie?.tonieInfo.model}</Descriptions.Item>
                            <Descriptions.Item label="uid">{tonie?.uid}</Descriptions.Item>
                            <Descriptions.Item label="valid">
                                {tonie?.valid ? (<CheckCircleOutlined style={{ color: token.colorSuccess }} />) : (<StopOutlined style={{ color: token.colorError }} />)}
                            </Descriptions.Item>
                            <Descriptions.Item label="exists">
                                {tonie?.exists ? (<CheckCircleOutlined style={{ color: token.colorSuccess }} />) : (<StopOutlined style={{ color: token.colorError }} />)}
                            </Descriptions.Item>
                            <Descriptions.Item label="hasCloudAuth">
                                {tonie?.hasCloudAuth ? (<CheckCircleOutlined style={{ color: token.colorSuccess }} />) : (<StopOutlined style={{ color: token.colorError }} />)}
                            </Descriptions.Item>
                            <Descriptions.Item label="hide">
                                {tonie?.hide ? (<CheckCircleOutlined style={{ color: token.colorSuccess }} />) : (<StopOutlined style={{ color: token.colorError }} />)}
                            </Descriptions.Item>
                            <Descriptions.Item label="claimed">
                                {tonie?.claimed ? (<CheckCircleOutlined style={{ color: token.colorSuccess }} />) : (<StopOutlined style={{ color: token.colorError }} />)}
                            </Descriptions.Item>
                        </Descriptions>
                    </div>
                    {loading ? (
                        <LoadingSpinner />
                    ) : (
                        ""
                    )}
                </StyledContent>
            </StyledLayout >
        </>
    );
};
