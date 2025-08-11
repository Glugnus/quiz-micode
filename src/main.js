// main.js
// -----------------------------
// 1) Imports & sélection du DOM
// -----------------------------
import { Questions } from "./question"; // <- Tableau de Q/R : [{question, answers[], correct}, ...]
import "./style.css"; // <- Styles globaux

// #app = conteneur principal, #start = bouton "Start"
const app = document.querySelector("#app");
const startButton = document.querySelector("#start");

// Démarre le quiz au clic sur "Start"
startButton.addEventListener("click", startQuiz);

// ---------------------------------------------------
// 2) Fonction principale qui orchestre le déroulé
//    (variables d'état + fonctions imbriquées)
// ---------------------------------------------------
function startQuiz(event) {
  // stopPropagation n'est pas nécessaire ici, mais ok
  event.stopPropagation();

  // État local du quiz (scope de startQuiz)
  let currentQuestion = 0; // index de la question en cours
  let score = 0; // score utilisateur

  // On affiche la première question
  displayQuestion(currentQuestion);

  // -----------------------------
  // Nettoie l'UI avant chaque vue
  // + affiche la barre de progrès
  // -----------------------------
  function clean() {
    // Supprime tous les enfants de #app
    while (app.firstElementChild) {
      app.firstElementChild.remove();
    }
    // Ajoute la progress bar (value = index courant)
    const progress = getProgressBar(Questions.length, currentQuestion);
    app.appendChild(progress);
  }

  // --------------------------------------------
  // Affiche une question (ou l'écran de fin)
  // --------------------------------------------
  function displayQuestion(index) {
    clean();
    const question = Questions[index];
    if (!question) {
      // Plus de question -> écran final
      displayFinishMessage();
      return;
    }

    // Titre de la question
    const title = getTitleElement(question.question);
    app.appendChild(title);

    // Liste des réponses (input radio + label)
    const answersDiv = createAnswers(question.answers);
    app.appendChild(answersDiv);

    // Bouton "Submit" pour valider la réponse
    const submitButton = getSubmitButton();
    submitButton.addEventListener("click", submit);
    app.appendChild(submitButton);
  }

  // --------------------------------------------
  // Écran final (score)
  // --------------------------------------------
  function displayFinishMessage() {
    const h1 = document.createElement("h1");
    h1.innerText = "Bravo ! tu as terminé le Quiz !";

    const p = document.createElement("p");
    p.innerText = `Tu as eu ${score} sur ${Questions.length} points`;

    app.appendChild(h1);
    app.appendChild(p);
  }

  // --------------------------------------------
  // Soumission d'une réponse
  // - vérifie la sélection
  // - calcule juste/faux
  // - feedback visuel + texte
  // - bouton "Next" avec compte à rebours
  // --------------------------------------------
  function submit() {
    const selectedAnswer = app.querySelector('input[name="answer"]:checked');

    // ✅ FIX : gérer le cas où aucune réponse n'est sélectionnée
    if (!selectedAnswer) {
      const warn = document.createElement("p");
      warn.innerText = "Sélectionne une réponse avant de valider 😉";
      app.appendChild(warn);
      return;
    }

    // Désactive tous les inputs pour empêcher un second clic
    disableAllAnswer();

    const value = selectedAnswer.value; // valeur choisie
    const question = Questions[currentQuestion]; // question courante
    const isCorrect = question.correct === value; // comparaison strict

    if (isCorrect) {
      score++;
    }

    // Feedback visuel (colorise la bonne et la réponse sélectionnée)
    showFeedback(isCorrect, question.correct, value);

    // Feedback textuel
    const feedback = getFeedbackMessage(isCorrect, question.correct);
    app.appendChild(feedback);

    // Ajoute le bouton "Next" + timer auto
    displayNextQuestionButton();
  }

  // --------------------------------------------
  // Bouton "Next" + Timer auto (4s)
  // --------------------------------------------
  function displayNextQuestionButton() {
    const TIMEOUT = 4000;
    let remainingTimeout = TIMEOUT;

    // ✅ FIX : retirer le bouton "Submit" présent dans #app
    const existingButton = app.querySelector("button");
    if (existingButton) existingButton.remove();

    // Crée bouton Next
    const nextButton = document.createElement("button");
    // ✅ FIX : parenthèse manquante dans le texte
    nextButton.innerText = `Next (${remainingTimeout / 1000}s)`;
    app.appendChild(nextButton);

    // Intervalle pour mettre à jour le compte à rebours
    const interval = setInterval(() => {
      remainingTimeout -= 1000;
      nextButton.innerText = `Next (${remainingTimeout / 1000}s)`;
    }, 1000);

    // Passage à la question suivante (callback partagé)
    const handleNextQuestion = () => {
      currentQuestion++;
      clearInterval(interval);
      clearTimeout(timeout);
      displayQuestion(currentQuestion);
    };

    // Timer auto (après 4s)
    const timeout = setTimeout(() => {
      handleNextQuestion();
    }, TIMEOUT);

    // Clic manuel sur "Next"
    nextButton.addEventListener("click", handleNextQuestion);
  }

  // --------------------------------------------
  // Feedback visuel (classes CSS)
  // - sur le label de la bonne réponse
  // - et le label sélectionné (correct/incorrect)
  // --------------------------------------------
  function showFeedback(isCorrect, correct, answer) {
    const correctAnswerId = formatId(correct);
    // ✅ Amélioration : scoper au conteneur "app"
    const correctElement = app.querySelector(`label[for="${correctAnswerId}"]`);

    const selectedAnswerId = formatId(answer);
    const selectedElement = app.querySelector(
      `label[for="${selectedAnswerId}"]`
    );

    if (correctElement) correctElement.classList.add("correct");
    if (selectedElement)
      selectedElement.classList.add(isCorrect ? "correct" : "incorrect");
  }

  // Message textualisé sous la question
  function getFeedbackMessage(isCorrect, correct) {
    const paragraphe = document.createElement("p");
    paragraphe.innerText = isCorrect
      ? "Bravo ! Tu as la bonne réponse"
      : `Désolé... mais la bonne réponse était ${correct}`;
    return paragraphe;
  }

  // --------------------------------------------
  // Génère la liste des réponses (labels + radios)
  // --------------------------------------------
  function createAnswers(answers) {
    const answersDiv = document.createElement("div");
    answersDiv.classList.add("answers");

    for (const answer of answers) {
      const label = getAnswerElement(answer);
      answersDiv.appendChild(label);
    }
    return answersDiv;
  }
}

// -----------------------------
// 3) Petites fonctions utilitaires
//    (pures, réutilisables)
// -----------------------------

// Titre h3
function getTitleElement(text) {
  const title = document.createElement("h3");
  title.innerText = text;
  return title;
}

// Normalise un texte pour créer un id CSS/HTML sûr
function formatId(text) {
  // Remplace espaces, guillemets doubles -> simples, puis minuscule
  return text.replaceAll(" ", "-").replaceAll('"', "'").toLowerCase();
}

// Construit un label + input[type=radio] (réponse candidate)
function getAnswerElement(text) {
  const label = document.createElement("label");
  label.innerText = text; // Le texte sera à gauche

  const input = document.createElement("input");
  const id = formatId(text);

  input.id = id;
  input.setAttribute("type", "radio");
  input.setAttribute("name", "answer");
  input.setAttribute("value", text);

  // “Associe” le label à l'input (clic sur label coche la radio)
  label.htmlFor = id;

  // Ajoute la radio à droite du label
  label.appendChild(input);

  return label;
}

// Bouton Submit
function getSubmitButton() {
  const submitButton = document.createElement("button");
  submitButton.innerText = "Submit";
  return submitButton;
}

// Barre de progression
function getProgressBar(max, value) {
  const progress = document.createElement("progress");
  progress.setAttribute("max", max);
  progress.setAttribute("value", value);
  return progress;
}

// Désactive toutes les radios (après submit)
function disableAllAnswer() {
  const radioInput = document.querySelectorAll('input[type="radio"]');
  for (const radio of radioInput) {
    // ✅ FIX : propriété correcte = "disabled"
    radio.disabled = true;
  }
}
