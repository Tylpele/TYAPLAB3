type Float = number;

// --- Диапазоны и константы ---
const aStart = -0.8, aEnd = 2.07, aStep = 0.01;
const bStart = -1.5, bEnd = 144, bStep = 12;
const c = 0.07;
const dStart = -2, dEnd = 0.07, dStep = 0.01;
const e = Math.pow(3, 1.0 / 3);
const fStart = -0.3, fEnd = 1.7, fStep = 0.001;

// --- Создаём таблицы и форму ---
window.addEventListener("DOMContentLoaded", () => {
    const app = document.getElementById("app");
    if (!app) return;

    app.innerHTML = `
        <h1>Расчёт функции</h1>

        <figure>
            <img src="formula.png" alt="Формула расчёта функции">
            <figcaption>Формула расчёта функции</figcaption>
        </figure>

        <h2>Аргументы, диапазон и дискрет:</h2>
        <table id="startTable">
            <thead>
                <tr><th>Аргумент</th><th>Диапазон</th><th>Дискрет</th></tr>
            </thead>
            <tbody>
                ${startTableRow("a", `[${aStart}; ${aEnd}]`, aStep.toString())}
                ${startTableRow("b", `[${bStart}; ${bEnd}]`, bStep.toString())}
                ${startTableRow("c", c.toFixed(2), "Константа")}
                ${startTableRow("d", `[${dStart}; ${dEnd}]`, dStep.toFixed(2))}
                ${startTableRow("e", "3^(1/3) иррациональное представление - " + e.toString(), "Константа")}
                ${startTableRow("f", `[${fStart}; ${fEnd}]`, fStep.toFixed(3))}
            </tbody>
        </table>

        <h2>Введите значения переменных:</h2>
        <form id="inputForm">
            <table>
                <thead>
                    <tr>
                        <th>Переменная</th>
                        <th>Значение</th>
                        <th>Диапазон</th>
                        <th>Шаг</th>
                        <th>Ограничения</th>
                    </tr>
                </thead>
                <tbody>
                    ${inputRow("a", aStart, aEnd, aStep, "Не равно 0")}
                    ${inputRow("b", bStart, bEnd, bStep, "Не равно -d")}
                    ${inputRow("d", dStart, dEnd, dStep, "Не равно 0.07 и не равно -b")}
                    ${inputRow("f", fStart, fEnd, fStep, "Не равно 0")}
                </tbody>
            </table>

            <div class="file-load">
                <p>Или загрузите из .txt файла (формат: a b d f через пробел, один набор на строку):</p>
                <input type="file" id="load-from-file" accept=".txt">
            </div>

            <button type="submit">Рассчитать</button>
        </form>

        <div id="resultContainer"></div>
    `;

    // Инициализация обработчиков событий
    initializeEventHandlers();
});

// --- Табличные функции ---
function startTableRow(argument: string, range: string, step: string): string {
    return `<tr><td>${argument}</td><td>${range}</td><td>${step}</td></tr>`;
}

function inputRow(name: string, start: number, end: number, step: number, constraint: string): string {
    return `
        <tr>
            <td>${name}</td>
            <td><input type="number" id="${name}" step="${step}"></td>
            <td>[${start}; ${end}]</td>
            <td>${step}</td>
            <td>${constraint}</td>
        </tr>
    `;
}

// --- Инициализация обработчиков событий ---
function initializeEventHandlers(): void {
    const getCurrentValues = () => {
        const bField = document.getElementById("b") as HTMLInputElement | null;
        const dField = document.getElementById("d") as HTMLInputElement | null;
        return {
            currentB: bField ? parseFloat(bField.value) || 0 : 0,
            currentD: dField ? parseFloat(dField.value) || 0 : 0
        };
    };

    const fields = ["a", "b", "d", "f"];
    fields.forEach(name => {
        const input = document.getElementById(name) as HTMLInputElement | null;
        input?.addEventListener("input", () => {
            const { currentB, currentD } = getCurrentValues();
            fields.forEach(fieldName => {
                const field = document.getElementById(fieldName) as HTMLInputElement | null;
                if (field) {
                    validateAndHighlight(field, fieldName, currentB, currentD);
                }
            });
        });
    });

    const form = document.getElementById("inputForm") as HTMLFormElement | null;
    form?.addEventListener("submit", (e) => {
        e.preventDefault();
        handleFormSubmitSingle();
    });

    // Загрузка из файла
    document.getElementById("load-from-file")?.addEventListener("change", handleFileUpload);
}

// --- Обработка загрузки файла ---
function handleFileUpload(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
        const text = reader.result as string;
        const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);

        const resultContainer = document.getElementById("resultContainer")!;
        resultContainer.innerHTML = "<h2>Результаты вычислений:</h2>";

        lines.forEach((line, idx) => {
            const parts = line.split(/\s+/).map(Number);
            if (parts.length !== 4 || parts.some(isNaN)) {
                alert(`Некорректный формат в строке ${idx + 1}: ${line}`);
                return;
            }
            const [a, bVal, dVal, f] = parts;

            if (!validateInput(a, "a", aStart, aEnd, aStep, 0, 0)) return;
            if (!validateInput(bVal, "b", bStart, bEnd, bStep, 0, dVal)) return;
            if (!validateInput(dVal, "d", dStart, dEnd, dStep, bVal, 0)) return;
            if (!validateInput(f, "f", fStart, fEnd, fStep, 0, 0)) return;

            const res = calculateFunction(a, bVal, c, dVal, e, f);
            showResultTableSingle(a, bVal, c, dVal, e, f, res, idx + 1);
        });
    };
    reader.readAsText(file);
}

// --- Валидация и подсветка ---
function validateAndHighlight(
    input: HTMLInputElement,
    name: string,
    currentB: number,
    currentD: number
): void {
    const value = parseFloat(input.value);
    
    let start = 0, end = 0, step = 0;
    switch (name) {
        case "a": start = aStart; end = aEnd; step = aStep; break;
        case "b": start = bStart; end = bEnd; step = bStep; break;
        case "d": start = dStart; end = dEnd; step = dStep; break;
        case "f": start = fStart; end = fEnd; step = fStep; break;
    }

    let valid = !(isNaN(value) || value < start || value > end || !checkDiscret(value, start, end, step));
    valid = valid && checkForbiddenValues(value, name, currentB, currentD);
    
    // Используем CSS классы вместо инлайн-стилей
    input.classList.remove("valid", "invalid");
    input.classList.add(valid ? "valid" : "invalid");
}

function validateInput(
    value: number,
    name: string,
    start: number,
    end: number,
    step: number,
    relatedB: number,
    relatedD: number
): boolean {
    if (isNaN(value)) { alert(`Введите число для ${name}`); return false; }
    if (value < start || value > end) { alert(`${name} вне диапазона [${start}; ${end}]`); return false; }
    if (!checkDiscret(value, start, end, step)) { alert(`${name} не соответствует шагу ${step}`); return false; }
    if (!checkForbiddenValues(value, name, relatedB, relatedD)) { alert(`Значение ${name} запрещено`); return false; }
    return true;
}

function checkDiscret(value: number, start: number, end: number, step: number): boolean {
    const epsilon = 1e-6;
    const fromBottom = Math.abs((value - start) % step);
    const fromTop = Math.abs((end - value) % step);
    return fromBottom < epsilon || Math.abs(fromBottom - step) < epsilon || fromTop < epsilon;
}

function checkForbiddenValues(value: number, name: string, currentB: number, currentD: number): boolean {
    switch (name) {
        case "a":
        case "f": return value !== 0;
        case "d": return value !== 0.07 && value !== -currentB;
        case "b": return value !== -currentD;
        default: return true;
    }
}

// --- Вычисления ---
function calculateFunction(a: number, b: number, c: number, d: number, e: number, f: number): number {
    return (a + c + d) / (e * f) +
           (c + b) / c -
           (d - a) / (a * c) +
           (d - b) / (d - c) -
           (a - c) / (b + d);
}

// --- Отдельный расчёт при ручном вводе ---
function handleFormSubmitSingle(): void {
    const a = parseFloat((document.getElementById("a") as HTMLInputElement).value);
    const bVal = parseFloat((document.getElementById("b") as HTMLInputElement).value);
    const dVal = parseFloat((document.getElementById("d") as HTMLInputElement).value);
    const f = parseFloat((document.getElementById("f") as HTMLInputElement).value);

    if (!validateInput(a, "a", aStart, aEnd, aStep, 0, 0)) return;
    if (!validateInput(bVal, "b", bStart, bEnd, bStep, 0, dVal)) return;
    if (!validateInput(dVal, "d", dStart, dEnd, dStep, bVal, 0)) return;
    if (!validateInput(f, "f", fStart, fEnd, fStep, 0, 0)) return;

    const res = calculateFunction(a, bVal, c, dVal, e, f);
    showResultTableSingle(a, bVal, c, dVal, e, f, res, 1);
}

// --- Таблица для одного набора ---
function showResultTableSingle(
    a: number,
    bVal: number,
    c: number,
    dVal: number,
    e: number,
    f: number,
    result: number,
    setNumber: number
): void {
    const container = document.getElementById("resultContainer")!;
    container.innerHTML += `
        <div class="result-set">
            <h3>Набор ${setNumber}</h3>
            <table>
                <thead>
                    <tr>
                        <th>Аргумент</th>
                        <th>Диапазон</th>
                        <th>Значение</th>
                        <th>Функция</th>
                        <th>Погрешность</th>
                    </tr>
                </thead>
                <tbody>
                    ${resultRow("a", `[${aStart}; ${aEnd}]`, a)}
                    ${resultRow("b", `[${bStart}; ${bEnd}]`, bVal)}
                    ${resultRow("c", "Константа", c)}
                    ${resultRow("d", `[${dStart}; ${dEnd}]`, dVal)}
                    ${resultRow("e", "Константа", e)}
                    ${resultRow("f", `[${fStart}; ${fEnd}]`, f)}
                    <tr class="function-result">
                        <td>Функция</td>
                        <td></td>
                        <td></td>
                        <td>${result}</td>
                        <td>"ПОГРЕШНОСТЬ"</td>
                    </tr>
                </tbody>
            </table>
        </div>
    `;
}

function resultRow(name: string, range: string, value: number): string {
    return `
        <tr>
            <td>${name}</td>
            <td>${range}</td>
            <td>${value}</td>
            <td></td>
            <td></td>
        </tr>
    `;
}