function startTimerAndProgressBar(timerElement, progressBarElement, duration) {
    let timeLeft = duration;
    progressBarElement.style.width = '100%';
    progressBarElement.style.backgroundColor = '#6200ea';
    const interval = setInterval(() => {
        timeLeft--;
        timerElement.textContent = timeLeft.toString();
        progressBarElement.style.width = `${(timeLeft / duration) * 100}%`;
        if (timeLeft <= 0) {
            clearInterval(interval);
        }
    }, 1000);
}

jest.useFakeTimers();

describe('startTimerAndProgressBar', () => {
    let timerElement;
    let progressBarElement;

    beforeEach(() => {
        // Set up mock elements
        document.body.innerHTML = `
            <div id="timerElement"></div>
            <div id="progressBarElement" style="width: 0%;"></div>
        `;

        timerElement = document.getElementById('timerElement');
        progressBarElement = document.getElementById('progressBarElement');
    });

    it('initializes progress bar correctly', () => {
        startTimerAndProgressBar(timerElement, progressBarElement, 5);

        expect(progressBarElement.style.width).toBe('100%');
        expect(progressBarElement.style.backgroundColor).toBe('rgb(98, 0, 234)'); // CSS colors are returned in RGB format
    });

    it('updates timer and progress bar width every second', () => {
        startTimerAndProgressBar(timerElement, progressBarElement, 5);

        jest.advanceTimersByTime(1000); // Advance time by 1 second

        expect(timerElement.textContent).toBe('4');
        expect(progressBarElement.style.width).toBe('80%');

        jest.advanceTimersByTime(2000); // Advance time by 2 more seconds

        expect(timerElement.textContent).toBe('2');
        expect(progressBarElement.style.width).toBe('40%');
    });

    it('clears interval after duration elapses', () => {
        startTimerAndProgressBar(timerElement, progressBarElement, 3);

        jest.advanceTimersByTime(3000); // Advance time by 3 seconds

        expect(timerElement.textContent).toBe('0');
        expect(progressBarElement.style.width).toBe('0%');

        // Verify no further updates occur
        jest.advanceTimersByTime(1000); // Advance time by 1 more second

        expect(timerElement.textContent).toBe('0');
        expect(progressBarElement.style.width).toBe('0%');
    });
});
