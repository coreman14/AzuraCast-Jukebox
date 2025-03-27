import { useState, useEffect, useCallback, useRef } from "react";
import "./App.css";
import debounce from "lodash/debounce";

function App() {
    const selectRef = useRef(null);
    const [azuracastServer, setAzuracastServer] = useState(localStorage.getItem("aurl"));
    const [servedFromAzuracast, setServedFromAzuracast] = useState(false);
    // localStorage.getItem("servedfromserver") == "true" || false);
    const [isAzuracastServerBeingChecked, setIsAzuracastServerBeingChecked] = useState(false);
    const [serverError, setServerError] = useState(false);
    const [serverErrorMessage, setServerErrorMessage] = useState("");
    const [stations, setStations] = useState([]);
    const [selectedStation, setSelectedStation] = useState(null);
    const [currentAudio, setCurrentAudio] = useState(null);
    const [volumeLevel, setVolumeLevel] = useState(parseFloat(localStorage.getItem("svolume")) || 1.0);
    const [currentSong, setCurrentSong] = useState(null);
    const [currentlyPlaying, setCurrentlyPlaying] = useState(false);
    const [forcePoll, setForcePoll] = useState(0);
    const [pollInterval, setPollInterval] = useState(null);
    //Disabling till the pulgin actually works
    // if (localStorage.getItem("servedfromserver") == null) {
    //     //If we havnt checked that this url is a local server or not
    //     fetch("/api/nowplaying")
    //         .then(() => {
    //             localStorage.setItem("servedfromserver", true);
    //             setServedFromAzuracast(true);
    //             setAzuracastServer("");
    //         })
    //         .catch(() => {
    //             localStorage.setItem("servedfromserver", false);
    //             setServedFromAzuracast(false);
    //         });
    // }

    const validateServer = useCallback(async () => {
        try {
            console.log("Getting new servers");
            setIsAzuracastServerBeingChecked(true);
            setServerError(false);
            setServerErrorMessage("");
            const response = await fetch(azuracastServer + "/api/nowplaying", {
                headers: { "accept": "application/json" },
            });
            let data = await response.json();
            data = data
                .map((x) => {
                    return { "now_playing": x.now_playing, ...x.station };
                })
                .sort((a, b) => a.id - b.id);
            setStations(data);
            setServerError(false);
            setServerErrorMessage("");
        } catch (error) {
            setServerError(true);
            if (error instanceof Error) {
                setServerErrorMessage("Connection refused");
            } else {
                setServerErrorMessage("Unknown error occurred");
            }
        }
        setIsAzuracastServerBeingChecked(false);
    }, [azuracastServer]);

    const debouncedValidate = useCallback(
        debounce(() => validateServer(), 500),
        [validateServer]
    );
    const fetchSongInfo = useCallback(
        async (s, c) => {
            try {
                if (s && c && !c.paused) {
                    const response = await fetch(azuracastServer + "/api/nowplaying/" + s["id"]);
                    const data = await response.json();
                    setCurrentSong(data);
                }
            } catch (error) {
                console.error("Error fetching song info:", error);
            }
        },
        [azuracastServer]
    );
    const startPollingSongInfo = useCallback(() => {
        fetchSongInfo(selectedStation, currentAudio); // Get initial song info
        const intervalId = setInterval(fetchSongInfo, 1000, selectedStation, currentAudio);
        setPollInterval(intervalId);
    }, [currentAudio, selectedStation, fetchSongInfo]);

    const stopPollingSongInfo = () => {
        clearInterval(pollInterval);
        setPollInterval(null);
    };
    //Make media buttons work in the same way as the play and pause button
    navigator.mediaSession.setActionHandler("play", () => {
        currentAudio.load();
        currentAudio.play();
        startPollingSongInfo();
        setCurrentlyPlaying(true);
    });
    navigator.mediaSession.setActionHandler("pause", () => {
        currentAudio.pause();
        stopPollingSongInfo();
        setCurrentSong(null);
        setCurrentlyPlaying(false);
    });
    useEffect(() => {
        return () => {
            navigator.mediaSession;
            if (pollInterval) {
                stopPollingSongInfo();
            }
        };
    }, []);

    useEffect(() => {
        debouncedValidate(azuracastServer);
    }, [azuracastServer, debouncedValidate, forcePoll]);

    useEffect(() => {
        // Initial validation
        debouncedValidate(azuracastServer);

        // Set up polling every 5 seconds
        const pollInterval = setInterval(() => {
            validateServer();
        }, 5000);

        // Cleanup on unmount
        return () => clearInterval(pollInterval);
    }, [azuracastServer, debouncedValidate]);

    useEffect(() => {
        if (currentAudio) currentAudio.volume = volumeLevel;
    }, [volumeLevel, currentAudio]);

    useEffect(() => {
        document.title = selectedStation ? `${selectedStation.name} - AzuraCast Radio` : "AzuraCast Radio Controller";
    }, [selectedStation]);

    return (
        <>
            <div className="app-container">
                <div
                    id="header"
                    className="header"
                    style={{
                        backgroundColor: isAzuracastServerBeingChecked
                            ? "#4a4a4a"
                            : serverError
                            ? "#ff6b6b"
                            : "darkgreen",
                    }}
                    title={
                        isAzuracastServerBeingChecked
                            ? "Checking connection"
                            : serverError
                            ? "No connection"
                            : "Connected"
                    }
                >
                    <span style={{ display: "none" }}>Icons obtained from https://icons8.com/</span>
                    <img
                        onClick={() => setForcePoll((a) => a + 1)}
                        style={{ float: "right" }}
                        src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAB4AAAAeCAYAAAA7MK6iAAAACXBIWXMAAAsTAAALEwEAmpwYAAABdklEQVR4nO2Wy0oDUQyGP9dutSrUQkV9m6KCVaogLhUvDH0Fn0LEy0a8oKKgvou3vRfUjRvrZSQQ4TC2nvFMWlz0h8Awyck/ySQngTb+IQpABJwBN8CLyiVwDiwC/daEW0ANiD0iNmsWHzAOPDtOt4EKMAB0qgzqux3n4+RMKZS0D/hQR4cauQ9F4EDPfAJzIcQdwAowE3A2UuJ3YDSEPAuqGvkj0N1q8hMl3/AZllWsUNCCe/0talHcq1im5rvYokYG+04/yrMVKk5n/MBEncvAKuVD6u8qqegC7uoQPwA9GQjdDMYJ2fMZHGcgloBuGwSUSxpfq1LSY4GRtL/wSJWT2CFV0VabUNWp2jTnNHzekLycpks2NWpJe0uRA558t02zMKYjTUbbcsD5WR2pMlr/jHkljvW+lSHvQ1F7P9YlopdAlJy013S9mQKGE6vPNLALvDkzWNamTMgDqymXPemGdeOOQJwt6Hp7kVhvT4Ela8I2sMAXUBKRy27a3h0AAAAASUVORK5CYII="
                        title="Refresh Stations"
                        id="refreshStationsButton"
                    />
                    <div className="innerHeader">
                        <h1>AzuraCast Jukebox</h1>
                        {/* style={{ display: servedFromAzuracast ? "none" : "" }} */}
                        <div className="headerInput">
                            <label htmlFor="severEndpoint">AzuraCast Server URL</label>
                            <input
                                type="text"
                                name="severEndpoint"
                                id="severEndpoint"
                                value={azuracastServer}
                                onChange={(e) => {
                                    setAzuracastServer(e.target.value);
                                    localStorage.setItem("aurl", e.target.value);
                                }}
                                onKeyDown={(e) => {
                                    if (e.key == "Enter") {
                                        setAzuracastServer(e.currentTarget.value);
                                        localStorage.setItem("aurl", e.currentTarget.value);
                                    }
                                }}
                                placeholder="Enter AzuraCast server URL"
                                style={{
                                    width: "100%",
                                    padding: "0.5rem",
                                    borderRadius: "4px",
                                    border: "1px solid #ccc",
                                }}
                            />
                        </div>
                    </div>
                    {serverError && (
                        <div style={{ color: "white", marginTop: "0.5rem" }}>Error: {serverErrorMessage}</div>
                    )}
                </div>
                <div id="MusicControl">
                    <div className="station-list">
                        {stations.length === 0 ? (
                            <div
                                style={{
                                    color: "#95a5a6",
                                    textAlign: "center",
                                    gridColumn: "span 3",
                                }}
                            >
                                No stations available
                            </div>
                        ) : (
                            stations.map((station) => (
                                <button
                                    key={station.id}
                                    className={`station-button ${selectedStation?.id === station.id ? "selected" : ""}`}
                                    onClick={() => {
                                        if (selectedStation == station) {
                                            return;
                                        }
                                        stopPollingSongInfo();
                                        const isPlaying = currentlyPlaying;
                                        if (currentAudio) {
                                            currentAudio.pause();
                                        }
                                        const a = new Audio(station.listen_url);
                                        setCurrentAudio(a);
                                        setSelectedStation(station);

                                        if (isPlaying) {
                                            //Every once in a while, we get a "AbortError: The play() request was interrupted by a call to pause()".
                                            //Seems to happen when we click the channels fast or sometimes just at random
                                            //No idea how to fix it, so we brute force a fix by reloading if something every happens
                                            a.play().catch((e) => {
                                                console.log(e);
                                                location.reload();
                                            });

                                            setCurrentSong(null);
                                            setTimeout(() => {
                                                if (currentAudio) selectRef.current.click();
                                            }, 100);
                                        } else {
                                            setCurrentSong(null);
                                            setCurrentlyPlaying(false);
                                        }
                                    }}
                                    onDoubleClick={() => {
                                        if (
                                            selectedStation == station &&
                                            currentAudio != null &&
                                            !currentAudio.paused
                                        ) {
                                            return;
                                        }
                                        selectRef.current.click();
                                    }}
                                >
                                    <div className="station-name">{station.name}</div>
                                    <div className="station-now-playing">
                                        {station.now_playing?.song?.title} - {station.now_playing?.song?.artist}
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                    <div className="controls">
                        <button
                            onClick={() => setCurrentAudio(new Audio(selectedStation?.listen_url))}
                            disabled={currentAudio != null || !selectedStation}
                        >
                            Connect
                        </button>
                        <button
                            onClick={() => {
                                currentAudio.pause();
                                stopPollingSongInfo();
                                setCurrentSong(null);
                                setCurrentAudio(null);
                                setCurrentlyPlaying(false);
                            }}
                            disabled={currentAudio == null}
                        >
                            Disconnect
                        </button>

                        {currentAudio && (
                            <>
                                <button
                                    className={currentAudio.paused ? "" : "disabled"}
                                    style={{ backgroundColor: currentAudio.paused ? "" : "grey" }}
                                    ref={selectRef}
                                    onClick={() => {
                                        currentAudio.load();
                                        currentAudio.play();
                                        startPollingSongInfo();
                                        setCurrentlyPlaying(true);
                                    }}
                                >
                                    Play
                                </button>
                                <button
                                    className={currentAudio.paused ? "disabled" : ""}
                                    style={{ backgroundColor: currentAudio.paused ? "grey" : "" }}
                                    onClick={() => {
                                        currentAudio.pause();
                                        stopPollingSongInfo();
                                        setCurrentSong(null);
                                        setCurrentlyPlaying(false);
                                    }}
                                >
                                    Stop
                                </button>
                            </>
                        )}
                    </div>
                    <div className="volume-control">
                        <progress
                            title="Click or scroll to change volume. Holding Shift while scrolling will increase change amout"
                            value={volumeLevel}
                            max={1.0}
                            onClick={(e) => {
                                const x = e.pageX - e.currentTarget.offsetLeft;
                                const clickedValue = (x * e.currentTarget.max) / e.currentTarget.offsetWidth;
                                localStorage.setItem("svolume", clickedValue);
                                setVolumeLevel(clickedValue);
                            }}
                            onWheel={(e) => {
                                const modi_value = e.shiftKey ? 0.05 : 0.01
                                if (e.deltaY > 0) {
                                    setVolumeLevel((a) => Math.max(a - modi_value, 0));
                                } else {
                                    console.log("Upsies");
                                    setVolumeLevel((a) => Math.min(a + modi_value, 1.0));
                                }
                            }}
                        ></progress>
                        <span>{Math.ceil(volumeLevel * 100)}%</span>
                    </div>
                    {currentAudio && (
                        <>
                            {currentSong && (
                                <div className="now-playing">
                                    Now Playing: {currentSong.now_playing.song.title} -{" "}
                                    {currentSong.now_playing.song.artist} - {currentSong.now_playing.song.album}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </>
    );
}

export default App;
