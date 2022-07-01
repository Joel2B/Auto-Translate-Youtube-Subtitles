import { getLocalStorage, setLocalStorage } from 'utils/chrome/storage';
import { createSelect } from 'pop-up/modules/selectOption';
import { setupNumberInput } from 'pop-up/modules/input';
import { sendMessage } from 'utils/chrome/runtime';

async function loadAnalytics() {
    const analytics = await getLocalStorage('analytics');

    document.getElementById('translated-words').textContent = analytics['translated-words'];
}

async function app() {
    const selectOptions = document.querySelectorAll('.custom-select');
    const numberInputs = document.querySelectorAll('.number-input');
    const inputs = document.querySelectorAll('.tab-content input.cmn-toggle');
    const options = document.querySelectorAll('.tab-nav li');
    const tabs = document.querySelectorAll('.tab-content .tab-pane');

    document.querySelector('.tab-nav').addEventListener(
        'click',
        (e) => {
            if (e.target.nodeName === 'A') {
                for (const [index, option] of options.entries()) {
                    if (option.className === 'active') {
                        option.classList.remove('active');
                        tabs[index].classList.remove('active');
                        break;
                    }
                }

                e.target.parentNode.classList.add('active');

                for (const [index, option] of options.entries()) {
                    if (option.className === 'active') {
                        tabs[index].classList.add('active');
                        break;
                    }
                }
            }
        },
        false,
    );

    for (const select of selectOptions) {
        createSelect(select);
    }

    for (const input of numberInputs) {
        setupNumberInput(input);
    }

    for (const input of inputs) {
        const id = input.id;
        let value = await getLocalStorage(id);

        if (value === null) {
            value = true;
            setLocalStorage(id, value);
        }

        document.getElementById(id).checked = value;

        input.addEventListener(
            'change',
            () => {
                setLocalStorage(id, input.checked);
                sendMessage({
                    id: id,
                    value: input.checked,
                });
            },
            false,
        );
    }

    loadAnalytics();
}

app();
