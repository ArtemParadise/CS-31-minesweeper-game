const playlist = [
    {
        "title": "Hysteria",
        "artist": "Muse",
        "file": "assets/music/Muse_-_Hysteria.mp3",
        "artwork": "assets/images/Muse_-_Hysteria.jpg"
    },
    {
        "title": "Never Gonna Give You Up",
        "artist": "Rick Astley",
        "file": "assets/music/Rick Astley - Never Gonna Give You Up.mp3",
        "artwork": "assets/images/Rick Astley - Never Gonna Give You Up.png"
    },
    {
        "title": "Червона рута",
        "artist": "Sofia Rotaru",
        "file": "assets/music/Sofia Rotaru - Червона рута.mp3",
        "artwork": "assets/images/Sofia Rotaru - Червона рута.png"
    }
];

// Додати пісні в assets/music та artwork в assets/images
// Потім запустити music-add.py
// Та вставити вгорі взміст tracks.js над цими коментарями 

document.addEventListener('DOMContentLoaded', () => {
    let currentTrack = 0;
    const player = {
        audio: document.getElementById('audio-player'),
        playPauseBtn: document.querySelector('.play-pause'),
        prevBtn: document.querySelector('.prev-track'),
        nextBtn: document.querySelector('.next-track'),
        progressBar: document.querySelector('.progress-bar'),
        currentProgress: document.querySelector('.current-progress'),
        currentTime: document.querySelector('.current-time'),
        duration: document.querySelector('.duration'),
        volumeBar: document.querySelector('.volume-bar'),
        volumeProgress: document.querySelector('.volume-progress'),
        volumeBtn: document.querySelector('.volume-btn'),
        trackTitle: document.querySelector('.track-title'),
        trackArtist: document.querySelector('.track-artist'),
        albumArt: document.querySelector('.album-art img'),
        playerBg: document.querySelector('.player-bg') // фон
    };

    // Стартова гучність 20%
    player.audio.volume = 0.2;
    player.volumeProgress.style.height = `${player.audio.volume * 100}%`;
    player.volumeBtn.innerHTML = '<i class="fas fa-volume-up"></i>';

    function loadTrack(trackIndex) {
        player.audio.src = playlist[trackIndex].file;
        player.trackTitle.textContent = playlist[trackIndex].title;
        player.trackArtist.textContent = playlist[trackIndex].artist;
        if (player.albumArt) player.albumArt.src = playlist[trackIndex].artwork;
        if (player.playerBg) player.playerBg.style.backgroundImage = `url('${playlist[trackIndex].artwork}')`;
        player.audio.load();
        updateDuration();
    }

    function updateDuration() {
        player.audio.addEventListener('loadedmetadata', () => {
            const minutes = Math.floor(player.audio.duration / 60);
            const seconds = Math.floor(player.audio.duration % 60);
            player.duration.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        });
    }

    // Гучність
    let isAdjustingVolume = false;
    const volumeContainer = document.querySelector('.volume-container');
    volumeContainer.addEventListener('mousedown', (e) => { isAdjustingVolume = true; updateVolume(e); });
    document.addEventListener('mousemove', (e) => { if (isAdjustingVolume) updateVolume(e); });
    document.addEventListener('mouseup', () => { isAdjustingVolume = false; });

    function updateVolume(e) {
        const bounds = player.volumeBar.getBoundingClientRect();
        const y = Math.min(bounds.bottom, Math.max(bounds.top, e.clientY));
        const volume = Math.max(0, Math.min(1, 1 - ((y - bounds.top) / bounds.height)));
        player.audio.volume = volume;
        player.volumeProgress.style.height = `${volume * 100}%`;
        player.volumeBtn.innerHTML = volume === 0 ? '<i class="fas fa-volume-mute"></i>' : '<i class="fas fa-volume-up"></i>';
    }

    // Play/Pause
    player.playPauseBtn.addEventListener('click', () => {
        if (player.audio.paused) {
            player.audio.play();
            player.playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
            document.querySelector('.album-art').classList.add('rotating');
        } else {
            player.audio.pause();
            player.playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
            document.querySelector('.album-art').classList.remove('rotating');
        }
    });

    // Track progress
    player.audio.addEventListener('timeupdate', () => {
        const progress = (player.audio.currentTime / player.audio.duration) * 100;
        player.currentProgress.style.width = `${progress}%`;
        const minutes = Math.floor(player.audio.currentTime / 60);
        const seconds = Math.floor(player.audio.currentTime % 60);
        player.currentTime.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    });

    // Drag-to-seek для прогрес-бару
    let isSeeking = false;
    player.progressBar.addEventListener('mousedown', (e) => { isSeeking = true; updateProgress(e); });
    document.addEventListener('mousemove', (e) => { if (isSeeking) updateProgress(e); });
    document.addEventListener('mouseup', () => { if (isSeeking) isSeeking = false; });

    function updateProgress(e) {
        const bounds = player.progressBar.getBoundingClientRect();
        const yMargin = 10;
        const x = Math.min(bounds.right, Math.max(bounds.left, e.clientX));
        player.audio.currentTime = ((x - bounds.left) / bounds.width) * player.audio.duration;
        player.currentProgress.style.width = `${((x - bounds.left) / bounds.width) * 100}%`;
    }

    // Track navigation
    player.prevBtn?.addEventListener('click', () => { currentTrack = (currentTrack - 1 + playlist.length) % playlist.length; loadTrack(currentTrack); player.audio.play(); });
    player.nextBtn?.addEventListener('click', () => { currentTrack = (currentTrack + 1) % playlist.length; loadTrack(currentTrack); player.audio.play(); });

    // Initial load
    loadTrack(currentTrack);
});
