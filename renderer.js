let intervalId = null;
let currentVideoId = '';

const counterContainer = document.getElementById('counter');
const videoTitleElement = document.getElementById('videoTitle');
const trackBtn = document.getElementById('trackBtn');
const videoIdInput = document.getElementById('videoIdInput');
const statusText = document.getElementById('statusText');

/**
 * Builds and updates the sliding digit DOM elements with proper entry animations
 */
function updateRollingCounter(number) {
  const formattedStr = number.toLocaleString();
  const characters = formattedStr.split('');

  const currentCount = counterContainer.childElementCount;
  const targetCount = characters.length;

  // Rebuild or adjust DOM nodes if length changed
  if (currentCount !== targetCount) {
    counterContainer.innerHTML = '';

    characters.forEach((char) => {
      if (/\d/.test(char)) {
        const slot = document.createElement('div');
        slot.className = 'digit-slot';

        const strip = document.createElement('div');
        strip.className = 'digit-strip';

        for (let i = 0; i <= 9; i++) {
          const span = document.createElement('span');
          span.textContent = i;
          strip.appendChild(span);
        }

        // Initialize at digit 0 with no transition briefly
        strip.style.transition = 'none';
        strip.style.transform = 'translateY(0%)';

        slot.appendChild(strip);
        counterContainer.appendChild(slot);
      } else {
        const sep = document.createElement('div');
        sep.className = 'separator';
        sep.textContent = char;
        counterContainer.appendChild(sep);
      }
    });

    // Force browser reflow so it registers the starting '0%' position
    void counterContainer.offsetHeight;

    // Restore CSS transition for the sliding animation
    Array.from(counterContainer.querySelectorAll('.digit-strip')).forEach((strip) => {
      strip.style.transition = '';
    });
  }

  // Slide each strip to its target value
  let charIndex = 0;
  Array.from(counterContainer.children).forEach((node) => {
    const targetChar = characters[charIndex];

    if (node.classList.contains('digit-slot')) {
      const digitValue = parseInt(targetChar, 10);
      const strip = node.querySelector('.digit-strip');
      
      const delay = (characters.length - charIndex) * 30;
      strip.style.transitionDelay = `${delay}ms`;

      // Slide to target position
      strip.style.transform = `translateY(-${digitValue * 10}%)`;
    } else if (node.classList.contains('separator')) {
      node.textContent = targetChar;
    }

    charIndex++;
  });
}

async function fetchViewCount(videoId) {
  try {
    const res = await fetch('https://www.youtube.com/youtubei/v1/get_watch?prettyPrint=false', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        context: {
          client: { clientName: 'WEB', clientVersion: '2.20260813.05.00' }
        },
        playerRequest: { videoId: videoId }
      })
    });

    const json = await res.json();
    const playerResponse = json[0]?.playerResponse || json?.playerResponse;

    if (playerResponse && playerResponse.videoDetails) {
      const viewCount = parseInt(playerResponse.videoDetails.viewCount, 10);
      const title = playerResponse.videoDetails.title;

      // Trigger vertical sliding update
      updateRollingCounter(viewCount);

      if (title) videoTitleElement.innerText = title;
      statusText.innerText = `Last updated: ${new Date().toLocaleTimeString()}`;
    } else {
      statusText.innerText = 'Could not retrieve details for this video.';
    }
  } catch (err) {
    console.error('Error fetching data:', err);
    statusText.innerText = 'Error fetching data from YouTube.';
  }
}

function startTracking() {
  const inputVal = videoIdInput.value.trim();
  if (!inputVal) return;

  currentVideoId = inputVal;
  
  if (intervalId) clearInterval(intervalId);

  statusText.innerText = 'Fetching...';

  fetchViewCount(currentVideoId);
  intervalId = setInterval(() => {
    fetchViewCount(currentVideoId);
  }, 5000);
}

trackBtn.addEventListener('click', startTracking);
videoIdInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') startTracking();
});

startTracking();