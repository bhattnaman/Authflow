function enableDraggableAccounts() {
    const accounts = document.querySelectorAll('#accountsContainer > div');
    accounts.forEach(acc => {
        acc.setAttribute('draggable', true);
        acc.classList.add('draggable');
    });

    const container = document.getElementById('accountsContainer');
    let draggedItem = null;

    container.addEventListener('dragstart', (e) => {
        draggedItem = e.target;
        setTimeout(() => (draggedItem.style.opacity = '0.5'), 0);
    });

    container.addEventListener('dragend', (e) => {
        setTimeout(() => (draggedItem.style.opacity = ' '), 0);
        draggedItem = null;
    });

    container.addEventListener('dragover', (e) => {
        e.preventDefault();
    });

    container.addEventListener('drop', (e) => {
        e.preventDefault();
        if (e.target.className === 'draggable') {
            container.insertBefore(draggedItem, e.target.nextSibling);
        }
    });
}

function disableDraggableAccounts() {
    const accounts = document.querySelectorAll('#accountsContainer > div');
    accounts.forEach(acc => {
        acc.removeAttribute('draggable');
        acc.classList.remove('draggable');
    });

    // leave the draggable attribute disabled

    const container = document.getElementById('accountsContainer');
    container.removeEventListener('dragstart', (e) => {
        draggedItem = e.target;
        setTimeout(() => (e.target.style.opacity = '0.5'), 0);
    });

    container.removeEventListener('dragend', (e) => {
        setTimeout(() => (e.target.style.opacity = ''), 0);
        draggedItem = null;
    });

    container.removeEventListener('dragover', (e) => {
        e.preventDefault();
    });

    container.removeEventListener('drop', (e) => {
        e.preventDefault();
        if (e.target.className === 'draggable') {
            container.insertBefore(draggedItem, e.target.nextSibling);
        }
    });

}

describe('Draggable Accounts Functionality', () => {
    // Setup a mock of the HTML structure
    beforeEach(() => {
        document.body.innerHTML = `
            <div id="accountsContainer">
                <div id="account1">Account 1</div>
                <div id="account2">Account 2</div>
            </div>
        `;
        enableDraggableAccounts(); // Enable the draggable functionality before each test
    });

    test('enables draggable on accounts', () => {
        const accounts = document.querySelectorAll('#accountsContainer > div');
        accounts.forEach(acc => {
            expect(acc.getAttribute('draggable')).toBe('true');
            expect(acc.classList.contains('draggable')).toBe(true);
        });
    });
});

describe('Disabling Draggable Accounts', () => {
    beforeEach(() => {
        document.body.innerHTML = `
            <div id="accountsContainer">
                <div id="account1" draggable="true" class="draggable">Account 1</div>
                <div id="account2" draggable="true" class="draggable">Account 2</div>
            </div>
        `;
        disableDraggableAccounts(); // Disable the draggable functionality before each test
    });

    test('removes draggable from accounts', () => {
        const accounts = document.querySelectorAll('#accountsContainer > div');
        accounts.forEach(acc => {
            expect(acc.getAttribute('draggable')).toBeNull();
            expect(acc.classList.contains('draggable')).toBe(false);
        });
    });
});
