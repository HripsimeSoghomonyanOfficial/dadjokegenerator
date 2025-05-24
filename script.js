const validationPatterns = {
  letters: /^[a-zA-Z\s]+$/,
  numbers: /^\d+$/,
  alphanumeric: /^[a-zA-Z0-9\s]+$/,
  any: /^.*$/,
};

const answerTableBody = document.querySelector("#answerTable tbody");
const jokeButtonsDiv = document.getElementById("jokeButtons");
const questionBox = document.getElementById("questionBox");
const currentQuestionP = document.getElementById("currentQuestion");
const userAnswerInput = document.getElementById("userAnswer");
const nextBtn = document.getElementById("nextBtn");
const jokeOutput = document.getElementById("jokeOutput");

const addCustomJokeBtn = document.getElementById("addCustomJokeBtn");
const customForm = document.getElementById("customJokeForm");
const customNameInput = document.getElementById("customJokeName");
const questionsContainer = document.getElementById("customQuestionsContainer");
const customTemplate = document.getElementById("customTemplate");
const submitCustomJokeBtn = document.getElementById("submitCustomJoke");

addCustomJokeBtn.addEventListener("click", () => {
  customForm.style.display = "block";
  addCustomJokeBtn.style.display = "none";
  customNameInput.value = "";
  customTemplate.value = "";
  questionsContainer.innerHTML = "";

  for (let i = 0; i < 10; i++) {
    const input = document.createElement("input");
    input.type = "text";
    input.placeholder = `Question ${i + 1}`;
    input.className = "custom-question-input";
    input.required = true;
    questionsContainer.appendChild(input);
    questionsContainer.appendChild(document.createElement("br"));
  }
});

submitCustomJokeBtn.addEventListener("click", () => {
  const name = customNameInput.value.trim();
  const template = customTemplate.value.trim();
  const inputs = [...document.querySelectorAll(".custom-question-input")];

  if (!name || !template || inputs.length !== 10 || inputs.some(inp => !inp.value.trim())) {
    alert("Please fill in all 10 questions, name, and template.");
    return;
  }

  const questions = inputs.map((inp) => ({
    text: inp.value.trim(),
    validation: "any" // можно позже сделать выбор типа
  }));

  // Уникальный ID
  const allKeys = Object.keys(jokesData.jokes);
  const numericKeys = allKeys.map(k => parseInt(k)).filter(k => !isNaN(k));
  const newKey = Math.max(...numericKeys, 0) + 1;

  jokesData.jokes[newKey] = {
    name,
    questions,
    template
  };

  createJokeButtons();
  alert("✅ Joke added!");
  customForm.style.display = "none";
});


let errorMessage = document.createElement("p");
errorMessage.style.color = "red";
errorMessage.style.marginTop = "4px";
errorMessage.style.fontSize = "0.9em";
userAnswerInput.insertAdjacentElement("afterend", errorMessage);

let jokesData = null;
let currentJokeKey = null;
let currentQuestions = [];
let currentValidations = [];
let currentTemplate = "";
let questionIndex = 0;
let currentAnswers = [];
let newJoke = [];
let isEditing = false;
let editIndex = -1;

function createJokeButtons() {
  jokeButtonsDiv.innerHTML = "";
  for (const key in jokesData.jokes) {
    const btn = document.createElement("button");
    btn.textContent = jokesData.jokes[key].name;
    btn.addEventListener("click", () => startJoke(key));
    jokeButtonsDiv.appendChild(btn);
  }
}

function startJoke(jokeKey) {
  currentJokeKey = jokeKey;
  const joke = jokesData.jokes[jokeKey];
  currentQuestions = joke.questions.map((q) => q.text);
  currentValidations = joke.questions.map((q) => q.validation || "any");
  currentTemplate = joke.template;
  questionIndex = 0;
  currentAnswers = [];
  isEditing = false;
  editIndex = -1;
  jokeOutput.style.display = "none";
  questionBox.style.display = "block";
  userAnswerInput.value = "";
  nextBtn.textContent = "Next";
  nextBtn.disabled = true;
  errorMessage.textContent = "";
  updateAnswerTable();
  askQuestion();
}

function askQuestion() {
  currentQuestionP.textContent = currentQuestions[questionIndex];
  userAnswerInput.value = currentAnswers[questionIndex] || "";
  nextBtn.disabled = true;
  nextBtn.textContent = "Next";
  errorMessage.textContent = "";
  isEditing = false;
  editIndex = -1;
  userAnswerInput.focus();
}

function showJoke() {
  questionBox.style.display = "none";
  let output = currentTemplate;
  currentAnswers.forEach((answer, idx) => {
    const regex = new RegExp(`\\{${idx}\\}`, "g");
    output = output.replace(regex, answer);
  });
  jokeOutput.textContent = output;
  jokeOutput.style.display = "block";
}

function updateAnswerTable() {
  answerTableBody.innerHTML = "";
  for (let i = 0; i < currentAnswers.length; i++) {
    const row = document.createElement("tr");
    row.style.textDecoration = "line-through";
    row.style.color = "#888";

    const indexCell = document.createElement("td");
    indexCell.textContent = i + 1;

    const questionCell = document.createElement("td");
    questionCell.textContent = currentQuestions[i];

    const answerCell = document.createElement("td");
    answerCell.textContent = currentAnswers[i];

    const editCell = document.createElement("td");
    const editBtn = document.createElement("button");
    editBtn.textContent = "Edit";
    editBtn.addEventListener("click", () => {
      isEditing = true;
      editIndex = i;
      questionIndex = i;
      currentQuestionP.textContent = currentQuestions[i];
      userAnswerInput.value = currentAnswers[i];
      nextBtn.textContent = "Save";
      nextBtn.disabled = false;
      errorMessage.textContent = "";
      userAnswerInput.focus();
    });
    editCell.appendChild(editBtn);

    row.appendChild(indexCell);
    row.appendChild(questionCell);
    row.appendChild(answerCell);
    row.appendChild(editCell);

    answerTableBody.appendChild(row);
  }
}

userAnswerInput.addEventListener("input", () => {
  const val = userAnswerInput.value.trim();
  if (!val) {
    nextBtn.disabled = true;
    errorMessage.textContent = "";
    return;
  }
  const validationType = currentValidations[questionIndex];
  const pattern = validationPatterns[validationType] || validationPatterns.any;
  if (!pattern.test(val)) {
    nextBtn.disabled = true;
    errorMessage.textContent = `Invalid input. Expected: ${validationType}.`;
  } else {
    nextBtn.disabled = false;
    errorMessage.textContent = "";
  }
});

nextBtn.addEventListener("click", () => {
  const val = userAnswerInput.value.trim();
  if (!val) {
    errorMessage.textContent = "Please enter an answer.";
    nextBtn.disabled = true;
    return;
  }
  const validationType = currentValidations[questionIndex];
  const pattern = validationPatterns[validationType] || validationPatterns.any;
  if (!pattern.test(val)) {
    errorMessage.textContent = `Please enter a valid answer. Expected: ${validationType}.`;
    nextBtn.disabled = true;
    return;
  }

  if (isEditing) {
    // Save edited answer
    currentAnswers[editIndex] = val;
    updateAnswerTable();
    isEditing = false;
    editIndex = -1;
    questionIndex = currentAnswers.length;
    userAnswerInput.value = "";
    nextBtn.textContent = "Next";
    nextBtn.disabled = true;
    errorMessage.textContent = "";
    if (questionIndex >= currentQuestions.length) {
      showJoke();
      questionBox.style.display = "none";
    } else {
      askQuestion();
    }
  } else {
    currentAnswers[questionIndex] = val;
    questionIndex++;
    errorMessage.textContent = "";
    if (questionIndex < currentQuestions.length) {
      userAnswerInput.value = "";
      nextBtn.disabled = true;
      updateAnswerTable();
      askQuestion();
    } else {
      updateAnswerTable();
      showJoke();
    }
  }
});

fetch("jokes.json")
  .then((response) => {
    if (!response.ok) throw new Error("Failed to load jokes.json");
    return response.json();
  })
  .then((data) => {
    jokesData = data;
    createJokeButtons();
  })
  .catch((error) => {
    console.error("Error loading jokes:", error);
    jokeButtonsDiv.textContent = "Failed to load jokes.";
  });
