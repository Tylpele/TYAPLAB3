type Float = number;

// --- Диапазоны и константы ---
const aStart = -0.8, aEnd = 2.07, aStep = 0.01;
const bStart = -1.5, bEnd = 144, bStep = 12;
const c = 0.07;
const dStart = -2, dEnd = 0.07, dStep = 0.01;
const e = Math.pow(3, 1.0 / 3);
const fStart = -0.3, fEnd = 1.7, fStep = 0.001;

// --- Глобальные переменные ---
let b: number = -1000;
let d: number = -1000;

// --- Создаём таблицы и форму ---
window.addEventListener("DOMContentLoaded", () => {
  document.body.innerHTML = `
    <h1>Расчёт функции</h1>

    <figure style="text-align: center; margin-bottom: 20px;">
      <img
        src="formula.png"
        alt="Формула расчёта функции"
        style="max-width: 100%;"
      />
      <figcaption>Формула расчёта функции</figcaption>
    </figure>

    <h2>Аргументы, диапазон и дискрет:</h2>
    <table id="startTable" border="1" cellpadding="6" cellspacing="0">
      <tr><th>Аргумент</th><th>Диапазон</th><th>Дискрет</th></tr>
      ${startTableRow("a", `[${aStart}; ${aEnd}]`, aStep.toString())}
      ${startTableRow("b", `[${bStart}; ${bEnd}]`, bStep.toString())}
      ${startTableRow("c", c.toFixed(2), "Константа")}
      ${startTableRow("d", `[${dStart}; ${dEnd}]`, dStep.toFixed(2))}
      ${startTableRow("e", e.toFixed(4), "Константа")}
      ${startTableRow("f", `[${fStart}; ${fEnd}]`, fStep.toFixed(3))}
    </table>

    <h2>Введите значения переменных:</h2>
    <form id="inputForm">
      <table border="1" cellpadding="6" cellspacing="0">
        <tr>
          <th>Переменная</th>
          <th>Значение</th>
          <th>Диапазон</th>
          <th>Шаг</th>
          <th>Ограничения</th>
        </tr>
        ${inputRow("a", aStart, aEnd, aStep, "Не должно быть 0")}
        ${inputRow("b", bStart, bEnd, bStep, "Не должно быть -d")}
        ${inputRow("d", dStart, dEnd, dStep, "Не должно быть 0.07 и -b")}
        ${inputRow("f", fStart, fEnd, fStep, "Не должно быть 0")}
      </table>
      <br/>
      <button type="submit">Рассчитать</button>
    </form>

    <div id="resultContainer"></div>
  `;

  // --- Подсветка полей ввода ---
  const fields = ["a", "b", "d", "f"];
  fields.forEach(name => {
    const input = document.getElementById(name) as HTMLInputElement;
    input.addEventListener("input", () => {
      fields.forEach(fieldName => {
        const field = document.getElementById(fieldName) as HTMLInputElement;
        validateAndHighlight(field, fieldName);
      });
    });
  });

  // --- Обработка формы ---
  const form = document.getElementById("inputForm") as HTMLFormElement;
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    handleFormSubmit();
  });
});

// --- Функции для таблиц ---
function startTableRow(argument: string, range: string, step: string) {
  return `<tr><td>${argument}</td><td>${range}</td><td>${step}</td></tr>`;
}

function inputRow(
  name: string,
  start: number,
  end: number,
  step: number,
  constraint: string
): string {
  return `
    <tr>
      <td>${name}</td>
      <td><input type="number" id="${name}" step="${step}" /></td>
      <td>[${start}; ${end}]</td>
      <td>${step}</td>
      <td>${constraint}</td>
    </tr>`;
}

// --- Подсветка ---
function validateAndHighlight(input: HTMLInputElement, name: string) {
  const value = parseFloat(input.value);

  const bField = document.getElementById("b") as HTMLInputElement;
  const dField = document.getElementById("d") as HTMLInputElement;

  const currentB = parseFloat(bField.value);
  const currentD = parseFloat(dField.value);

  let start = 0, end = 0, step = 0;
  switch (name) {
    case "a": start = aStart; end = aEnd; step = aStep; break;
    case "b": start = bStart; end = bEnd; step = bStep; break;
    case "d": start = dStart; end = dEnd; step = dStep; break;
    case "f": start = fStart; end = fEnd; step = fStep; break;
  }

  let valid = true;

  if (
    isNaN(value) ||
    value < start ||
    value > end ||
    !checkDiscret(value, start, end, step)
  ) {
    valid = false;
  }

  if (!checkForbiddenValues(value, name, currentB, currentD)) {
    valid = false;
  }

  if (
    (name === "b" && !isNaN(currentD) && value === -currentD) ||
    (name === "d" && !isNaN(currentB) && value === -currentB)
  ) {
    valid = false;
  }

  input.style.backgroundColor = valid ? "#bbf7d0" : "#fca5a5";
}

// --- Обработка формы ---
function handleFormSubmit() {
  const a = parseFloat((document.getElementById("a") as HTMLInputElement).value);
  b = parseFloat((document.getElementById("b") as HTMLInputElement).value);
  d = parseFloat((document.getElementById("d") as HTMLInputElement).value);
  const f = parseFloat((document.getElementById("f") as HTMLInputElement).value);

  if (!validateInput(a, "a", aStart, aEnd, aStep)) return;
  if (!validateInput(b, "b", bStart, bEnd, bStep)) return;
  if (!validateInput(d, "d", dStart, dEnd, dStep)) return;
  if (!validateInput(f, "f", fStart, fEnd, fStep)) return;

  const result = calculateFunction(a, b, c, d, e, f);
  showResultTable(a, b, c, d, e, f, result);
}

// --- Валидация ---
function validateInput(
  value: number,
  name: string,
  start: number,
  end: number,
  step: number
): boolean {
  if (isNaN(value)) { alert(`Введите число для ${name}`); return false; }
  if (value < start || value > end) {
    alert(`${name} вне диапазона [${start}, ${end}]`);
    return false;
  }
  if (!checkDiscret(value, start, end, step)) {
    alert(`${name} не соответствует шагу ${step}`);
    return false;
  }
  if (!checkForbiddenValues(value, name, b, d)) {
    alert(`Значение ${name} запрещено`);
    return false;
  }
  return true;
}

// --- Проверки ---
function checkDiscret(value: number, start: number, end: number, step: number): boolean {
  const epsilon = 1e-6;
  const fromBottom = Math.abs((value - start) % step);
  const fromTop = Math.abs((end - value) % step);
  return fromBottom < epsilon || Math.abs(fromBottom - step) < epsilon || fromTop < epsilon;
}

function checkForbiddenValues(
  value: number,
  name: string,
  currentB: number,
  currentD: number
): boolean {
  switch (name) {
    case "a":
    case "f": return value !== 0;
    case "d": return value !== 0.07 && value !== -currentB;
    case "b": return value !== -currentD;
    default: return true;
  }
}

// --- Вычисление функции ---
function calculateFunction(
  a: number,
  b: number,
  c: number,
  d: number,
  e: number,
  f: number
): number {
  return (a + c + d) / (e * f) +
         (c + b) / c -
         (d - a) / (a * c) +
         (d - b) / (d - c) -
         (a - c) / (b + d);
}

// --- Вывод результата ---
function showResultTable(
  a: number,
  b: number,
  c: number,
  d: number,
  e: number,
  f: number,
  result: number
) {
  const container = document.getElementById("resultContainer")!;
  container.innerHTML = `
<h2>Результаты вычислений:</h2>
<table border="1" cellpadding="6" cellspacing="0">
  <tr>
    <th>Аргумент</th>
    <th>Диапазон</th>
    <th>Значение</th>
    <th>Функция</th>
    <th>Погрешность</th>
  </tr>

  ${resultRow("a", `[${aStart}; ${aEnd}]`, a)}
  ${resultRow("b", `[${bStart}; ${bEnd}]`, b)}
  ${resultRow("c", "Константа", c)}
  ${resultRow("d", `[${dStart}; ${dEnd}]`, d)}
  ${resultRow("e", "Константа", e)}
  ${resultRow("f", `[${fStart}; ${fEnd}]`, f)}

  <tr>
    <td>Функция</td>
    <td></td>
    <td></td>
    <td>${result.toFixed(6)}</td>
    <td>"ПОГРЕШНОСТЬ"</td>
  </tr>
</table>
`;

}

function resultRow(name: string, range: string, value: number) {
  return `<tr><td>${name}</td><td>${range}</td><td>${value.toFixed(6)}</td><td></td></tr>`;
}
