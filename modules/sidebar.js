// modules/sidebar.js

const toggleSidebar = (sidebar) => {
    if (sidebar.style.width === '250px') {
        sidebar.style.width = '0';
    } else {
        sidebar.style.width = '250px';
    }
};

const scrollToElementAndHighlight = (targetId) => {
    const targetElement = document.querySelector(targetId);
    if (targetElement) {
        const headerOffset = 80;
        const offsetPosition = targetElement.offsetTop - (window.innerHeight * 0.25);

        window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
        });

        // Highlight animation
        const currentlyHighlighted = document.querySelector('.highlight-neon');
        if (currentlyHighlighted) {
            currentlyHighlighted.classList.remove('highlight-neon');
        }

        targetElement.classList.add('highlight-neon');
        setTimeout(() => {
            targetElement.classList.remove('highlight-neon');
        }, 1500); // Duration of the animation
    }
};


const initSidebar = () => {
    const sidebar = document.getElementById('sidebar');
    const sidebarToggle = document.getElementById('sidebar-toggle');

    sidebarToggle.addEventListener('click', () => toggleSidebar(sidebar));

    const sidebarLinks = document.querySelectorAll('.sidebar a');
    sidebarLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('href');
            scrollToElementAndHighlight(targetId);
            toggleSidebar(sidebar);
        });
    });
};

export { initSidebar, scrollToElementAndHighlight };