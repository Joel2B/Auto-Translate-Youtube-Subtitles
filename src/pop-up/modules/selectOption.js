import { getValue, setValue } from 'pop-up/modules/data';

const visibleOptions = 3;
// height for each option
const optionHeight = 23.5;

// TODO: refactor this
export async function createSelect(selectOptions) {
    const id = selectOptions.id;
    let selectedOption = await getValue(id);

    if (!selectedOption) {
        const option = selectOptions.options[selectOptions.selectedIndex];

        selectedOption = option.text;

        if (option.value !== '') {
            selectedOption += '#' + selectOptions.value;
        }

        setValue(id, selectedOption);
    }

    const header = selectedOption.includes('#') ? selectedOption.split('#')[0] : selectedOption;

    let optionsHTML = '<div class="' + selectOptions.classList[0] + '">';
    optionsHTML += '<span class="custom-select-trigger">' + header + '</span>';
    optionsHTML += '<div class="custom-options"><div>';

    for (const option of selectOptions.options) {
        let dataValue = '';

        if (option.value !== '') {
            dataValue = `data-value="${option.value}"`;
        }

        optionsHTML += `<span class="custom-option" ${dataValue}>${option.textContent}</span>`;
    }

    optionsHTML += '</div></div></div>';

    selectOptions.style.display = 'none';
    selectOptions.removeAttribute('class');
    selectOptions.removeAttribute('id');

    const customSelect = document.createElement('div');
    customSelect.className = 'custom-select-wrapper';
    customSelect.id = id;

    selectOptions.insertAdjacentElement('afterend', customSelect);
    selectOptions.remove();
    customSelect.innerHTML = selectOptions.outerHTML + optionsHTML;

    const customOption = document.querySelectorAll(`#${id} .custom-option`);

    for (const option of customOption) {
        if (option.dataset.value !== '' && option.dataset.value === selectedOption) {
            option.classList.add('selected');
            document.querySelector(`#${id} .custom-select-trigger`).textContent = option.textContent;
            break;
        } else if (option.textContent === selectedOption) {
            option.classList.add('selected');
            break;
        }
    }

    const customOptions = document.querySelector(`#${id} .custom-options div`);

    if (customOption.length > visibleOptions) {
        customOptions.style.height = `${visibleOptions * optionHeight}px`;
    }

    customOptions.addEventListener(
        'mouseenter',
        () => {
            customOptions.setAttribute('tabindex', -1);
            customOptions.focus();
        },
        false,
    );

    customOptions.addEventListener(
        'mouseleave',
        () => {
            customOptions.removeAttribute('tabindex');
        },
        false,
    );

    customOptions.addEventListener(
        'keypress',
        (e) => {
            for (const option of customOption) {
                if (e.key.toLowerCase() === option.textContent[0].toLowerCase()) {
                    option.scrollIntoView();
                    break;
                }
            }
        },
        false,
    );

    document.querySelector(`#${id} .custom-options`).addEventListener(
        'click',
        function(e) {
            let value = e.target.textContent;

            if (e.target.dataset.value) {
                value += '#' + e.target.dataset.value;
            }

            setValue(id, value);

            for (const option of customOption) {
                if (/selected/.test(option.className)) {
                    option.classList.remove('selected');
                }
            }

            e.target.classList.add('selected');
            this.parentNode.classList.remove('opened');
            document.querySelector(`#${id} .custom-select-trigger`).textContent = e.target.textContent;
        },
        false,
    );

    document.querySelector(`#${id} .custom-select`).addEventListener(
        'click',
        (e) => {
            if (!e.target.parentNode.classList.toggle('opened')) {
                return;
            }

            for (const option of customOption) {
                if (/selected/.test(option.className)) {
                    option.scrollIntoView();
                }
            }
        },
        false,
    );
}
