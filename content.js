(function () {
  'use strict';

  console.log('IMDb to VidSrc Extension: Loading');

  // Debug function to inspect page elements
  function debugPageStructure() {
    console.log('=== Debugging IMDb Page Structure ===');

    // Common IMDb selectors for movie/show cards
    const selectors = [
      '.ipc-poster-card',
      '.ipc-slate-card',
      '.ipc-poster',
      '[data-testid="hero-title-block__title"]',
      '[class*="PosterCard"]',
      '[class*="TitleCard"]',
      '.title-card',
      // Fan Favorites section
      '.fan-picks__grid-item'
    ];

    selectors.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      console.log(`${selector}: ${elements.length} elements found`);
      if (elements.length > 0) {
        console.log('Sample element:', elements[0].outerHTML);
      }
    });
  }

  // Function to extract IMDb ID from URL or href
  function extractImdbId(url) {
    const match = url.match(/\/title\/(tt\d+)/);
    return match ? match[1] : null;
  }

  // Function to extract IMDb ID from video URL
  function extractImdbIdFromVideo(videoUrl) {
    // First try to find the ref parameter
    const refMatch = videoUrl.match(/ref_=([^_]+)_tr/);
    if (refMatch && refMatch[1].startsWith('tt')) {
      return refMatch[1];
    }

    // If not found in ref, try to get from the parent elements
    return null;
  }

  // Function to modify trailer buttons
  function modifyTrailerButtons() {
    // Main trailer button selector that we know works
    const trailerSelector = '.ipc-btn[aria-label="Trailer"]';

    document.querySelectorAll(trailerSelector).forEach(trailerButton => {
      try {
        // Skip if already modified
        if (trailerButton.hasAttribute('data-vidsrc-modified')) {
          return;
        }

        console.log('Found unmodified trailer button:', trailerButton);

        // Try to get IMDb ID from different sources
        let imdbId = null;

        // 1. Try to get from the href attribute
        const videoHref = trailerButton.getAttribute('href');
        if (videoHref) {
          // Try to get from ref parameter
          imdbId = extractImdbIdFromVideo(videoHref);
        }

        // 2. If not found, try to get from parent card
        if (!imdbId) {
          const card = trailerButton.closest('[data-testid="title-card"]') ||
            trailerButton.closest('.ipc-poster-card');
          if (card) {
            const titleLink = card.querySelector('a[href*="/title/"]');
            if (titleLink) {
              imdbId = extractImdbId(titleLink.href);
            }
          }
        }

        // 3. If still not found, try to get from the current page URL
        if (!imdbId && window.location.pathname.includes('/title/')) {
          imdbId = extractImdbId(window.location.pathname);
        }

        if (!imdbId) {
          console.log('No IMDb ID found for button');
          return;
        }

        console.log('Found IMDb ID:', imdbId);

        // Determine if it's a TV show
        const isMovie = !document.title.includes('TV Series');

        // Clone the button to remove existing event listeners
        const newButton = trailerButton.cloneNode(true);
        trailerButton.parentNode.replaceChild(newButton, trailerButton);

        // Modify the button
        newButton.setAttribute('data-vidsrc-modified', 'true');
        newButton.innerHTML = `
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" class="ipc-icon ipc-icon--play-arrow ipc-btn__icon ipc-btn__icon--pre" viewBox="0 0 24 24" fill="currentColor" role="presentation">
                        <path d="M8 6.82v10.36c0 .79.87 1.27 1.54.84l8.14-5.18a1 1 0 0 0 0-1.69L9.54 5.98A.998.998 0 0 0 8 6.82z"></path>
                    </svg>
                    <span class="ipc-btn__text">Watch Now</span>
                `;

        // Add new click behavior
        newButton.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          const vidsrcUrl = `https://vidsrc.net/embed/${isMovie ? 'movie' : 'tv'}/${imdbId}`;
          window.open(vidsrcUrl, '_blank');
          console.log(`Opening ${vidsrcUrl}`);
        });

        // Remove original href
        newButton.removeAttribute('href');

        console.log('Successfully modified button');
      } catch (error) {
        console.error('Error modifying button:', error);
      }
    });
  }

  // Run debug after a short delay
  setTimeout(debugPageStructure, 2000);

  // Initial run with delay to ensure page is loaded
  setTimeout(modifyTrailerButtons, 1000);

  // Watch for dynamically loaded content
  const observer = new MutationObserver((mutations) => {
    modifyTrailerButtons();
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

  // Debug helper
  console.log('IMDb to VidSrc Extension: Ready to modify trailer buttons');
})();
