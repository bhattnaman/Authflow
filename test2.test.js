function copyToClipboard(email) {
    const button = document.querySelector(`button[data-email='${email}']`); // Modify selector to use data-email attribute for targeting the correct button
    const originalTooltip = 'Copy to clipboard';
    const copiedTooltip = 'Copied!';
    
    button.setAttribute('data-tooltip', copiedTooltip); // Change tooltip to show "Copied!"
    
    const passkey = button.getAttribute('data-passkey'); // Use a data attribute on the button to store the passkey

    navigator.clipboard.writeText(passkey).then(function() {
        console.log(`Passkey ${passkey} copied to clipboard`);
        setTimeout(() => {
            button.setAttribute('data-tooltip', originalTooltip); // Revert tooltip after 2 seconds
        }, 2000);
    }, function(err) {
        console.error('Error in copying text: ', err);
        button.setAttribute('data-tooltip', originalTooltip); // Ensure tooltip is correct even after an error
    });
}


describe('copyToClipboard', () => {
    beforeAll(() => {
        // Mock navigator.clipboard.writeText to return a Promise
        Object.assign(navigator, {
            clipboard: {
                writeText: jest.fn().mockImplementation(() => Promise.resolve('Mocked response')),
            },
        });
    });    

    beforeEach(() => {
        // Reset mocks before each test
        jest.resetAllMocks();
        jest.useFakeTimers();

        // Set up our document body
        document.body.innerHTML = `
            <button data-email="test@example.com" data-passkey="123456" data-tooltip="Copy to clipboard"></button>
        `;
    });

    it('handles errors by logging and resetting the tooltip immediately', async () => {
        // Make clipboard.writeText reject
        navigator.clipboard.writeText.mockImplementationOnce(() => Promise.reject(new Error("Failed to copy")));

        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        const email = "test@example.com";
        const button = document.querySelector(`button[data-email='${email}']`);

        await copyToClipboard(email);

        expect(consoleErrorSpy).toHaveBeenCalledWith('Error in copying text: ', new Error("Failed to copy"));
        expect(button.getAttribute('data-tooltip')).toBe('Copy to clipboard');

        consoleErrorSpy.mockRestore();
    });
});
