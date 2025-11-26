// modules/projects.js

/**
 * Creates a project card element.
 * @param {object} project - The project data.
 * @returns {HTMLElement} The project card element.
 */
const createProjectCard = (project) => {
    const projectCard = document.createElement('div');
    projectCard.classList.add('project-card');
    const [owner, repoName] = project.title.split('/');

    const imageHtml = project.image
        ? `<img src="${project.image}" alt="${project.name}">`
        : '';

    projectCard.innerHTML = `
        ${imageHtml}
        <h3>${project.title}</h3>
        <p>${project.description}</p>
        <a href="javascript:void(0)"
           data-owner="${owner}"
           data-repo-name="${repoName}">View Details</a>
    `;

    projectCard.querySelector('a').addEventListener('click', window.openModal);
    return projectCard;
};

/**
 * Fetches projects from the backend.
 * @returns {Promise<Array<object>>} A promise that resolves to an array of project objects.
 */
async function fetchProjects() {
    console.log("Fetching projects...");
    try {
        const response = await fetch('/api/projects');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        const projects = data.projects; // Extract the projects array
        console.log("Projects fetched:", projects);
        return projects;
    } catch (error) {
        console.error("Error fetching projects:", error);
        throw error; // Re-throw to be caught by the caller
    }
}

/**
 * Renders the projects in the project grid.
 * @param {Array<object>} projects - The array of projects to render.
 * @param {HTMLElement} projectGrid - The project grid element.
 */
const renderProjects = (projects, projectGrid) => {
    return new Promise((resolve) => {
        projectGrid.innerHTML = '';
        projects.forEach((project) => {
            const projectCard = createProjectCard(project);
            projectGrid.appendChild(projectCard);
        });
        resolve();
    });
};

/**
 * Initializes the project modal functionality.
 */
const initProjectModal = () => {
    const modal = document.getElementById('project-modal');
    const closeButton = document.querySelector('.close-button');
    const modalProjectImage = document.getElementById('modal-project-image');
    const modalProjectTitle = document.getElementById('modal-project-title');
    const modalProjectDescription = document.getElementById('modal-project-description');
    const modalProjectReadme = document.getElementById('modal-project-readme');
    const modalLiveLink = document.getElementById('modal-live-link');
    const modalGithubLink = document.getElementById('modal-github-link');

    const closeModal = () => {
        modal.style.display = 'none';
        modalProjectReadme.innerHTML = ''; // Clear README content when closing
    };

    window.openModal = async (e) => {
        e.preventDefault();
        const owner = e.currentTarget.dataset.owner;
        const repoName = e.currentTarget.dataset.repoName;

        try {
            const response = await fetch(`/api/project/${owner}/${repoName}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const projectDetails = await response.json();

            modalProjectImage.src = projectDetails.image;
            modalProjectImage.alt = projectDetails.name;
            modalProjectTitle.textContent = projectDetails.title;
            modalProjectDescription.textContent = projectDetails.description;
            modalProjectReadme.innerHTML = marked.parse(projectDetails.readme || 'No README available.'); // Render Markdown

            if (projectDetails.live_link) {
                modalLiveLink.href = projectDetails.live_link;
                modalLiveLink.style.display = 'inline-block';
            } else {
                modalLiveLink.style.display = 'none';
            }
            modalGithubLink.href = projectDetails.github_url;

            modal.style.display = 'flex'; // Use flex to center content
        } catch (error) {
            console.error("Error fetching project details:", error);
            // Optionally display an error message in the modal or console
        }
    };

    closeButton.addEventListener('click', closeModal);
    window.addEventListener('click', (event) => {
        if (event.target === modal) {
            closeModal();
        }
    });
};

/**
 * Initializes the dynamic project loading from the backend.
 */
const initProjectLoader = () => {
    const projectGrid = document.querySelector('.project-grid');

    const loadProjects = async () => {
        try {
            const projects = await fetchProjects();
            await renderProjects(projects, projectGrid);
            // Assuming collectSearchableData is globally available or imported
            if (typeof window.collectSearchableData === 'function') {
                window.collectSearchableData();
            } else {
                console.warn("collectSearchableData function not found in global scope. Search functionality might be limited.");
            }
        } catch (error) {
            console.error('Error loading projects:', error);
            if (projectGrid) {
                projectGrid.innerHTML =
                    '<p class="error-message">Failed to load projects. Please try again later.</p>';
            }
        }
    };

    initProjectModal(); // Initialize the modal when the project loader is initialized
    loadProjects();
};

export { initProjectLoader };