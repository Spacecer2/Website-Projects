// modules/search.js
import { scrollToElementAndHighlight } from './sidebar.js'; // Import the new function

const initSearch = () => {
    const searchInput = document.getElementById('search-input');
    const searchButton = document.getElementById('search-button');
    const suggestionsContainer = document.getElementById('autocomplete-suggestions');
    let searchableItems = []; // Stores { element: HTMLElement, text: string, suggestionText: string, targetId: string }

    const collectSearchableData = () => {
        searchableItems = []; // Clear previous items

        // Collect main titles for suggestions
        const mainTitles = document.querySelectorAll(
            '.portfolio-container h1.main-title, ' +
            '.experience-container h1.main-title, ' +
            '.skills-container h1.main-title, ' +
            '.projects-container h1.main-title'
        );
        mainTitles.forEach(titleElement => {
            const container = titleElement.closest('.portfolio-container, .experience-container, .skills-container, .projects-container');
            if (container && container.id) {
                const text = titleElement.textContent.replace('#', '').trim();
                searchableItems.push({
                    element: container, // Target the container for scrolling/highlighting
                    text: text.toLowerCase(), // For filtering
                    suggestionText: text, // For display in suggestions
                    targetId: `#${container.id}` // For scrolling
                });
            }
        });

        // Also collect other filterable content if we want it to be highlighted
        const otherFilterableElements = document.querySelectorAll(
            '.project-card, .experience-section, .about-me' // Excluding .skill-item since we are dealing with a new structure
        );
        otherFilterableElements.forEach(element => {
            const text = element.textContent.trim();
            if (text) {
                searchableItems.push({
                    element: element,
                    text: text.toLowerCase(),
                    suggestionText: null, // Not a suggestion, just for highlighting/filtering
                    targetId: null
                });
            }
        });

        // Ensure project cards are also collected for search if they're relevant
        // They are already collected by window.collectSearchableData() in modules/projects.js if it calls this.
        // For now, let's just make sure all main content elements are searchable.
    };
    
    // Ensure this is called when projects are loaded and when new content might appear
    window.collectSearchableData = collectSearchableData; 

    const removeHighlight = () => {
        // Remove highlight from all searchable elements
        searchableItems.forEach(item => {
            const markedElements = item.element.querySelectorAll('mark');
            markedElements.forEach(marked => {
                const parent = marked.parentNode;
                parent.replaceChild(document.createTextNode(marked.textContent), marked);
                parent.normalize();
            });
        });
    };

    const highlightText = (element, query) => {
        if (!query || !element) return;

        const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, null, false);
        let node;
        const regex = new RegExp(query, 'gi');
        const nodesToProcess = [];

        while (node = walker.nextNode()) {
            if (node.nodeValue && node.nodeValue.match(regex) && node.parentNode.nodeName !== 'MARK') { // Avoid highlighting inside already highlighted text
                nodesToProcess.push(node);
            }
        }
        
        nodesToProcess.forEach(node => {
            const fragment = document.createDocumentFragment();
            let lastIndex = 0;
            node.nodeValue.replace(regex, (match, offset) => {
                const before = node.nodeValue.slice(lastIndex, offset);
                if (before) {
                    fragment.appendChild(document.createTextNode(before));
                }
                const mark = document.createElement('mark');
                mark.textContent = match;
                fragment.appendChild(mark);
                lastIndex = offset + match.length;
            });
            const after = node.nodeValue.slice(lastIndex);
            if (after) {
                fragment.appendChild(document.createTextNode(after));
            }
            if(node.parentNode) {
                node.parentNode.replaceChild(fragment, node);
            }
        });
    };

    const filterElements = () => {
        const query = searchInput.value.toLowerCase();
        removeHighlight();
        
        searchableItems.forEach(item => {
            const element = item.element;
            const originalDisplay = element.dataset.originalDisplay || getComputedStyle(element).display;
            element.dataset.originalDisplay = originalDisplay; // Store original display

            if (item.text.includes(query)) {
                element.style.display = originalDisplay === 'none' ? 'block' : originalDisplay; // Show element
                if (query) {
                    highlightText(element, query);
                }
            } else {
                // If a section contains main titles, we don't want to hide the section itself unless necessary
                // This logic might need refinement based on exact desired display behavior
                // For now, if query is active and it doesn't match the item, hide it.
                if (query) {
                    element.style.display = 'none';
                } else {
                    element.style.display = originalDisplay; // Restore original display if query is empty
                }
            }
        });

        // Special handling for the main containers if they are supposed to be shown/hidden
        const mainContainers = document.querySelectorAll(
            '.portfolio-container, .experience-container, .skills-container, .projects-container'
        );
        mainContainers.forEach(container => {
            let hasVisibleChild = false;
            // Check if any of its direct searchable children are visible or match query
            searchableItems.filter(item => container.contains(item.element) && item.element.style.display !== 'none').forEach(() => {
                hasVisibleChild = true;
            });
            
            if (query && !hasVisibleChild) {
                container.style.display = 'none';
            } else {
                container.style.display = 'block'; // Or its original display
            }
        });
    };

    const showSuggestions = () => {
        const query = searchInput.value.toLowerCase();
        suggestionsContainer.innerHTML = '';
        if (!query) {
            suggestionsContainer.style.display = 'none';
            return;
        }

        const uniqueSuggestions = new Map(); // Use a Map to store unique suggestionTexts
        searchableItems.filter(item => item.suggestionText && item.text.includes(query))
                       .forEach(item => {
                           // Only add if suggestionText is unique
                           if (!uniqueSuggestions.has(item.suggestionText)) {
                               uniqueSuggestions.set(item.suggestionText, item);
                           }
                       });

        const filteredSuggestions = Array.from(uniqueSuggestions.values());


        if (filteredSuggestions.length > 0) {
            filteredSuggestions.forEach(item => {
                const suggestionItem = document.createElement('div');
                suggestionItem.classList.add('suggestion-item');
                const regex = new RegExp(query, 'gi');
                const highlightedText = item.suggestionText.replace(regex, (match) => `<mark>${match}</mark>`);
                suggestionItem.innerHTML = highlightedText;
                suggestionItem.dataset.targetId = item.targetId; // Store target ID

                suggestionItem.addEventListener('click', () => {
                    searchInput.value = ''; // Clear search input
                    suggestionsContainer.style.display = 'none'; // Hide suggestions
                    
                    const targetId = suggestionItem.dataset.targetId;
                    if (targetId) {
                        scrollToElementAndHighlight(targetId); // Scroll and highlight
                    }
                    filterElements(); // Re-filter to show all when search is empty (as searchInput.value is empty)
                });
                suggestionsContainer.appendChild(suggestionItem);
            });
            suggestionsContainer.style.display = 'block';
        } else {
            suggestionsContainer.style.display = 'none';
        }
    };
    
    searchButton.addEventListener('click', filterElements);
    searchInput.addEventListener('input', () => {
        filterElements();
        showSuggestions();
    });

    document.addEventListener('click', (e) => {
        if (!suggestionsContainer.contains(e.target) && e.target !== searchInput) {
            suggestionsContainer.style.display = 'none';
        }
    });
};

export { initSearch };