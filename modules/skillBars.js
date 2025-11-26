// modules/skillBars.js

const initSkillBars = () => {
    const skillsSection = document.getElementById('skills');
    const skillContainer = document.getElementById('skill-items-wrapper'); // Target the new wrapper

    const renderSkillBars = (aggregatedLanguages) => {
        skillContainer.innerHTML = ''; // Clear existing skill items within the wrapper

        if (Object.keys(aggregatedLanguages).length === 0) {
            skillContainer.innerHTML = '<p>No language data available.</p>';
            return;
        }

        const totalBytes = Object.values(aggregatedLanguages).reduce((sum, bytes) => sum + bytes, 0);

        // Sort languages by bytes in descending order
        const sortedLanguages = Object.entries(aggregatedLanguages)
            .sort(([, bytesA], [, bytesB]) => bytesB - bytesA);

        sortedLanguages.forEach(([language, bytes]) => {
            const percentage = (bytes / totalBytes) * 100;

            // Create skill name span
            const skillNameSpan = document.createElement('span');
            skillNameSpan.classList.add('skill-name');
            skillNameSpan.textContent = language;
            skillContainer.appendChild(skillNameSpan);

            // Create skill bar container div
            const skillBarContainerDiv = document.createElement('div');
            skillBarContainerDiv.classList.add('skill-bar-container');
            
            // Create skill bar div
            const skillBarDiv = document.createElement('div');
            skillBarDiv.classList.add('skill-bar');
            skillBarDiv.style.setProperty('--skill-width', `${percentage.toFixed(2)}%`);
            skillBarContainerDiv.appendChild(skillBarDiv);

            skillContainer.appendChild(skillBarContainerDiv);
        });

        // Apply animation after rendering
        animateSkillBars();
    };

    const animateSkillBars = () => {
        const skillBars = skillContainer.querySelectorAll('.skill-bar');
        skillBars.forEach(bar => {
            // Reset animation by removing and re-adding the class
            bar.classList.remove('animate');
            // Force reflow
            void bar.offsetWidth; 
            bar.classList.add('animate');
        });
    };

    const fetchAndRenderSkills = async () => {
        try {
            const response = await fetch('/api/projects');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            renderSkillBars(data.aggregated_languages || {});
        } catch (error) {
            console.error('Error fetching skill data:', error);
            skillContainer.innerHTML = '<p>Failed to load skill data. Please try again later.</p>';
        }
    };

    if (skillsSection) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    fetchAndRenderSkills(); // Fetch and render when in view
                } else {
                    // Optional: Reset skill bars when they go out of view
                    skillContainer.querySelectorAll('.skill-bar').forEach(bar => {
                        bar.classList.remove('animate');
                    });
                }
            });
        }, { threshold: 0.5 }); // Trigger when 50% of the section is visible
        observer.observe(skillsSection);
    }
};

export { initSkillBars };