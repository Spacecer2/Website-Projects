/**
 * @file This file contains the main JavaScript code for the portfolio website.
 * @author Fabian Hoess
 */

document.addEventListener('DOMContentLoaded', () => {
  /**
   * Initializes the application.
   */
  const init = () => {
    initDatetime();
    initSearch();
    initBackToTopButton();
    initSkillBars();
    initProjectModal();
    initProjectLoader();
  };

  /**
   * Initializes the datetime display.
   */
  const initDatetime = () => {
    const currentDatetimeSpan = document.getElementById('current-datetime');

    const updateDatetime = () => {
      const now = new Date();
      const options = {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      };
      currentDatetimeSpan.textContent = now.toLocaleDateString('de-DE', options);
    };

    updateDatetime();
    setInterval(updateDatetime, 1000);
  };

  /**
   * Initializes the search bar functionality.
   */
  const initSearch = () => {
    const searchInput = document.getElementById('search-input');
    const searchButton = document.getElementById('search-button');

    const filterElements = () => {
      const query = searchInput.value.toLowerCase();
      const allFilterableElements = document.querySelectorAll(
        '.project-card, .skill-item, .experience-section'
      );

      allFilterableElements.forEach((element) => {
        const text = element.textContent.toLowerCase();
        if (text.includes(query)) {
          element.style.display = element.classList.contains('skill-item')
            ? 'flex'
            : 'block';
        } else {
          element.style.display = 'none';
        }
      });
    };

    searchButton.addEventListener('click', filterElements);
    searchInput.addEventListener('keyup', filterElements);
  };

  /**
   * Initializes the back to top button functionality.
   */
  const initBackToTopButton = () => {
    const backToTopButton = document.getElementById('back-to-top');

    const scrollToTop = () => {
      window.scrollTo({
        top: 0,
        behavior: 'smooth',
      });
    };

    backToTopButton.addEventListener('click', scrollToTop);

    window.addEventListener('scroll', () => {
      backToTopButton.style.display = window.pageYOffset > 200 ? 'flex' : 'none';
    });

    if (window.pageYOffset === 0) {
      backToTopButton.style.display = 'none';
    }
  };

  /**
   * Initializes the interactive skill bars functionality.
   */
  const initSkillBars = () => {
    const skillBars = document.querySelectorAll('.skill-bar');

    const observerOptions = {
      root: null,
      rootMargin: '0px',
      threshold: 0.5,
    };

    const skillObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const skillBar = entry.target;
          const skillWidth = skillBar.style.width;
          skillBar.style.setProperty('--skill-width', skillWidth);
          skillBar.classList.add('animate');
          observer.unobserve(skillBar);
        }
      });
    }, observerOptions);

    skillBars.forEach((skillBar) => {
      skillObserver.observe(skillBar);
    });
  };

  /**
   * Initializes the project card modal functionality.
   */
  const initProjectModal = () => {
    const projectModal = document.getElementById('project-modal');
    const closeButton = projectModal.querySelector('.close-button');

    const openModal = async (event) => {
      event.preventDefault();
      const link = event.currentTarget;
      const { owner, repoName } = link.dataset;

      clearModalContent();
      projectModal.style.display = 'flex';

      try {
        const projectDetails = await fetchProjectDetails(owner, repoName);
        updateModalContent(projectDetails);
      } catch (error) {
        console.error('Error fetching project details:', error);
        showModalError();
      }
    };

    const closeModal = () => {
      projectModal.style.display = 'none';
    };

    closeButton.addEventListener('click', closeModal);

    window.addEventListener('click', (event) => {
      if (event.target === projectModal) {
        closeModal();
      }
    });

    window.openModal = openModal;
  };

  /**
   * Clears the modal content.
   */
  const clearModalContent = () => {
    document.getElementById('modal-project-title').textContent = 'Loading...';
    document.getElementById('modal-project-description').textContent = '';
    const modalImage = document.getElementById('modal-project-image');
    modalImage.src = '';
    modalImage.style.display = 'none';
    document.getElementById('modal-live-link').style.display = 'none';
    document.getElementById('modal-github-link').style.display = 'none';
    document.getElementById('modal-project-readme').innerHTML = '';
  };

  /**
   * Fetches the project details from the API.
   * @param {string} owner - The owner of the repository.
   * @param {string} repoName - The name of the repository.
   * @returns {Promise<object>} A promise that resolves to the project details.
   */
  const fetchProjectDetails = async (owner, repoName) => {
    const response = await fetch(`/api/project/${owner}/${repoName}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch project details: ${response.statusText}`);
    }
    return response.json();
  };

  /**
   * Updates the modal content with the project details.
   * @param {object} projectDetails - The project details.
   */
  const updateModalContent = (projectDetails) => {
    document.getElementById('modal-project-title').textContent =
      projectDetails.title;
    document.getElementById('modal-project-description').textContent =
      projectDetails.description;

    const modalImage = document.getElementById('modal-project-image');
    if (projectDetails.image) {
      modalImage.src = projectDetails.image;
      modalImage.style.display = 'block';
    } else {
      modalImage.style.display = 'none';
    }

    document.getElementById('modal-github-link').href = projectDetails.github_url;
    document.getElementById('modal-github-link').style.display = 'inline-block';

    if (projectDetails.live_link) {
      document.getElementById('modal-live-link').href =
        projectDetails.live_link;
      document.getElementById('modal-live-link').style.display =
        'inline-block';
    }

    if (projectDetails.readme) {
      document.getElementById(
        'modal-project-readme'
      ).innerHTML = `<h4>README.md</h4>${marked.parse(projectDetails.readme)}`;
    }
  };

  /**
   * Shows an error message in the modal.
   */
  const showModalError = () => {
    document.getElementById('modal-project-title').textContent =
      'Error loading project details.';
    document.getElementById('modal-project-description').textContent =
      'Please try again later.';
  };

  /**
   * Initializes the dynamic project loading from the backend.
   */
  const initProjectLoader = () => {
    const projectGrid = document.querySelector('.project-grid');

    const loadProjects = async () => {
      try {
        const projects = await fetchProjects();
        renderProjects(projects, projectGrid);
      } catch (error) {
        console.error('Error loading projects:', error);
        projectGrid.innerHTML =
          '<p>Failed to load projects. Please try again later.</p>';
      }
    };

    loadProjects();
  };

  /**
   * Fetches the projects from the API.
   * @returns {Promise<Array<object>>} A promise that resolves to an array of projects.
   */
  const fetchProjects = async () => {
    const apiUrl = '/api/projects';
    const response = await fetch(apiUrl);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  };

  /**
   * Renders the projects in the project grid.
   * @param {Array<object>} projects - The array of projects to render.
   * @param {HTMLElement} projectGrid - The project grid element.
   */
  const renderProjects = (projects, projectGrid) => {
    projectGrid.innerHTML = '';
    projects.forEach((project) => {
      const projectCard = createProjectCard(project);
      projectGrid.appendChild(projectCard);
    });
  };

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

  // --- INITIALIZATION ---
  init();
});
