import { getValue, setValue } from 'pop-up/modules/data';

export async function setupNumberInput(numberInput) {
    const input = numberInput.querySelector('input[type="number"]');
    const id = input.id;
    const minus = numberInput.querySelector('.minus');
    const plus = numberInput.querySelector('.plus');

    let lastValue = input.value;
    let value = await getValue(id);

    if (value === null) {
        value = Number(input.value);
        setValue(id, value);
    }

    input.value = value;

    input.addEventListener(
        'click',
        () => {
            input.select();
        },
        false,
    );

    input.addEventListener(
        'blur',
        () => {
            if (input.value === '') {
                input.value = lastValue;
            }
        },
        false,
    );

    input.addEventListener(
        'keydown',
        (e) => {
            // Enter
            if (e.keyCode === 8) {
                return;
            }

            if (!e.repeat) {
                const value = Number(input.value);

                if (value >= input.min && value <= input.max) {
                    lastValue = value;
                }
            }
        },
        false,
    );

    input.addEventListener(
        'keyup',
        (e) => {
            // Enter
            if (e.keyCode === 8) {
                return;
            }

            if (input.min !== '' && input.max !== '') {
                const value = Number(input.value);

                if (value >= input.min && value <= input.max) {
                    setValue(id, value);
                } else {
                    input.value = lastValue;
                }
            }
        },
        false,
    );

    minus.addEventListener(
        'click',
        () => {
            if (input.min !== '') {
                let value = Number(input.value);

                if (value > input.min) {
                    input.value = --value;
                    setValue(id, value);
                }
            }
        },
        false,
    );

    plus.addEventListener(
        'click',
        () => {
            if (input.max !== '') {
                let value = Number(input.value);

                if (value < input.max) {
                    input.value = ++value;
                    setValue(id, value);
                }
            }
        },
        false,
    );
}
