const notes = [
    "You are the first and last thing on my mind everyday.",
    "You are my home.",
    "Being with you is what I call happiness!",
    "Happy birthday chotuuu!!!",
    "I have missed you so much during this one month.",
    "I love us. When we hug, your head perfectly fits under my chin.",
    "Aye chotuuu, be my <s>valentine</s> everyday - Motu.",
    "19/3/22. Welcome home. There is something about '19' and us.",
    "Being with you calms me down. Just keep tickling me and saying, \"ese ese maaru tuje\""
];

const container = document.getElementById('notes');
const leftButton = document.getElementById('left-button');
const rightButton = document.getElementById('right-button');

let CURRENT_INDEX = 0;

function removeAllChildNodes(parent) {

    while (parent.firstChild) {
        parent.removeChild(parent.firstChild);
    }
}

function addNote(text) {

    const paragraph = document.createElement('p');
    paragraph.innerHTML = text;
    removeAllChildNodes(container);
    container.appendChild(paragraph);
}

function pressLeft() {

    if (CURRENT_INDEX <= 0) {
        return;
    }
    --CURRENT_INDEX;
    addNote(notes[CURRENT_INDEX]);
}

function pressRight() {

    if (CURRENT_INDEX >= notes.length - 1) {
        return;
    }
    ++CURRENT_INDEX;
    addNote(notes[CURRENT_INDEX]);
}

document.addEventListener('DOMContentLoaded', function() {
    leftButton.addEventListener('click', pressLeft);
    rightButton.addEventListener('click', pressRight);
});

addNote(notes[CURRENT_INDEX]);
