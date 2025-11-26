// script.js
import { initSidebar } from './modules/sidebar.js';
import { initDatetime } from './modules/datetime.js';
import { initSearch } from './modules/search.js';
import { initProjectLoader } from './modules/projects.js';
import { initBackToTopButton } from './modules/backToTop.js';
import { initSkillBars } from './modules/skillBars.js';


document.addEventListener('DOMContentLoaded', () => {

    const scrollToFirstContainerAndHighlight = () => {
        const targetElement = document.getElementById('portfolio');
        if (targetElement) {
            const headerOffset = 80;
            const offsetPosition = targetElement.offsetTop - (window.innerHeight * 0.25);

            // Highlight animation
            targetElement.classList.add('highlight-neon');

            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            });
            setTimeout(() => {
                targetElement.classList.remove('highlight-neon');
            }, 1500); // Duration of the animation
        }
    };

    /**
     * Initializes the application.
     */
    const init = () => {
        initDatetime();
        initSearch();
        initBackToTopButton(); 
        initSkillBars(); 
        initProjectLoader();
        initSidebar();
        scrollToFirstContainerAndHighlight(); // Call this after all other initializations
    };

    // --- INITIALIZATION ---
    init();
});
