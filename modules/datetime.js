// modules/datetime.js

const initDatetime = () => {
    const currentDatetimeSpan = document.getElementById('current-datetime');

    const updateDatetime = () => {
        const now = new Date();
        const options = {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false,
        };
        currentDatetimeSpan.textContent = now.toLocaleDateString('en-US', options);
    };

    updateDatetime();
    setInterval(updateDatetime, 1000);
};

export { initDatetime };