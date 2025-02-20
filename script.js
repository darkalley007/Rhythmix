
console.log("js");
let currFolder;
let currentAudio = null;
let currentSongIndex = 0;
let songs = [];

async function getsongs(folder) {
  try {
    currFolder = folder;
    let a = await fetch(`https://rhythmix-5lzn.vercel.app/${folder}/`);
    if (!a.ok) throw new Error("Network response was not ok");

    let response = await a.text();
    console.log("Fetched response:", response);

    let div = document.createElement("div");
    div.innerHTML = response;
    let as = div.getElementsByTagName("a");
    let songsList = [];

    for (let index = 0; index < as.length; index++) {
      const element = as[index];
      if (element.href.endsWith(".mp3")) {
        songsList.push(decodeURIComponent(element.href.split(`/${folder}/`)[1]));
      }
    }

    let songUL = document.querySelector(".songlist ul");
    if (!songUL) {
      console.error("Song list container not found");
      return [];
    }

    songUL.innerHTML = "";

    for (const song of songsList) {
      songUL.innerHTML += `
        <li data-song="${song}">
          <img class="invert" src="plats.svg" alt="list">
          <div class="info">
            <div>${song.replaceAll("%20", " ")}</div>
            <div>Shubham</div>
          </div>
          <div class="playnow">
            <span>Play now</span>
            <img class="invert" src="itis.svg" alt="">
          </div>
        </li>`;
    }

    document.querySelectorAll(".songlist li").forEach((e, index) => {
      e.addEventListener("click", () => {
        currentSongIndex = index;
        let songName = e.dataset.song;
        console.log("Playing:", songName);
        playMusic(songName);
      });
    });

    console.log("Songs found:", songsList);
    return songsList;
  } catch (error) {
    console.error("Fetch error:", error);
    return [];
  }
}

const play = document.getElementById("play-btn");

const playMusic = (track) => {
  if (!track || typeof track !== "string") {
    console.error("Invalid track name:", track);
    return;
  }

  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
  }

  let songPath = `https://rhythmix-5lzn.vercel.app/${currFolder}/${encodeURIComponent(track)}`;
  currentAudio = new Audio(songPath);

  document.querySelector(".songinfo").innerHTML = track.replaceAll("%20", " ");
  document.querySelector(".songtime").innerHTML = "00:00 / 00:00";

  play.src = "pause.svg";

  currentAudio.ontimeupdate = () => {
    let currentTime = formatTime(currentAudio.currentTime);
    let duration = formatTime(currentAudio.duration);
    document.querySelector(".songtime").innerHTML = `${currentTime} / ${duration}`;
    document.querySelector(".circle").style.left = (currentAudio.currentTime / currentAudio.duration) * 100 + "%";
  };

  currentAudio.onerror = () => {
    console.error("Error loading audio file:", currentAudio.src);
  };

  currentAudio.onended = () => {
    playNextInAlbum();
  };

  currentAudio.play().catch(err => console.error("Audio play error:", err));
};

play.addEventListener("click", () => {
  if (!currentAudio) {
    console.error("No audio loaded");
    return;
  }

  if (currentAudio.paused) {
    currentAudio.play();
    play.src = "pause.svg";
  } else {
    currentAudio.pause();
    play.src = "playbutton.svg";
  }
});

const playNext = () => {
  currentSongIndex = (currentSongIndex + 1) % songs.length;
  playMusic(songs[currentSongIndex]);
};

const playPrevious = () => {
  currentSongIndex = (currentSongIndex - 1 + songs.length) % songs.length;
  playMusic(songs[currentSongIndex]);
};

async function main() {
  songs = await getsongs("songs/1st");
  if (!songs || songs.length === 0) {
    console.error("No songs found");
    return;
  }

  const next = document.getElementById("next");
  const prev = document.getElementById("prev");

  next.addEventListener("click", playNext);
  prev.addEventListener("click", playPrevious);
}

// ✅ Fixed Album Click Event
document.querySelectorAll(".card").forEach((card) => {
  card.addEventListener("click", async () => {
    let folder = `songs/${card.dataset.folder}`;
    console.log("Clicked album:", folder);

    let fetchedSongs = await getsongs(folder);
    
    if (fetchedSongs.length > 0) {
      songs = fetchedSongs;
      currentSongIndex = 0;
      playMusic(songs[0]);
    } else {
      console.error("No songs found in album:", folder);
    }
  });
});

// ✅ Fixed Seekbar Click & Drag
const seekbar = document.querySelector(".seekbar");
const circle = document.querySelector(".circle");

seekbar.addEventListener("click", (e) => {
  if (!currentAudio || isNaN(currentAudio.duration)) return;

  let seekbarRect = seekbar.getBoundingClientRect();
  let percent = ((e.clientX - seekbarRect.left) / seekbarRect.width) * 100;
  percent = Math.max(0, Math.min(100, percent));

  currentAudio.currentTime = (currentAudio.duration * percent) / 100;
  circle.style.left = percent + "%";
});

let isDragging = false;

circle.addEventListener("mousedown", () => {
  isDragging = true;
});

document.addEventListener("mouseup", () => {
  isDragging = false;
});

document.addEventListener("mousemove", (e) => {
  if (!isDragging || !currentAudio || isNaN(currentAudio.duration)) return;

  let seekbarRect = seekbar.getBoundingClientRect();
  let percent = ((e.clientX - seekbarRect.left) / seekbarRect.width) * 100;
  percent = Math.max(0, Math.min(100, percent));

  circle.style.left = percent + "%";
  currentAudio.currentTime = (currentAudio.duration * percent) / 100;
});

// ✅ Fixed Volume Rocker
const volumeSlider = document.querySelector(".range input");

if (volumeSlider) {
  volumeSlider.removeEventListener("input", changeVolume);
  volumeSlider.addEventListener("input", changeVolume);
}

const playNextInAlbum = () => {
  if (currentSongIndex < songs.length - 1) {
    currentSongIndex++;
    playMusic(songs[currentSongIndex]);
  }
};

function changeVolume(e) {
  if (currentAudio) {
    currentAudio.volume = parseInt(e.target.value) / 100;
  }
}

// ✅ Fixed Mute/Unmute Toggle
const volumeIcon = document.querySelector(".volume img");

if (volumeIcon) {
  volumeIcon.removeEventListener("click", toggleMute);
  volumeIcon.addEventListener("click", toggleMute);
}

function toggleMute(e) {
  if (!currentAudio) return;

  if (currentAudio.volume > 0) {
    e.target.src = "mute.svg";
    currentAudio.volume = 0;
    volumeSlider.value = 0;
  } else {
    e.target.src = "volume.svg";
    currentAudio.volume = 0.9;
    volumeSlider.value = 90;
  }
}

const formatTime = (seconds) => {
  if (isNaN(seconds) || seconds < 0) return "00:00";
  let min = Math.floor(seconds / 60);
  let sec = Math.floor(seconds % 60);
  return `${min.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
};

main();
