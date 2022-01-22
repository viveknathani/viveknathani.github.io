function appendContributions() {

    const url = 'https://vnxcollector.herokuapp.com/viveknathani';
    fetch(url, { method: 'GET' })
    .then((response) => response.json())
    .then((data) => {

        const list = document.getElementById('realTimeList');
        for (let i = 0; i < data.length; ++i) {

            const repo = `${data[i].owner}/${data[i].repo}`;
            const li = document.createElement('li');
            li.innerHTML = `${repo} (<a href="${data[i].url}">#${data[i].pr}</a>)`;
            list.appendChild(li);
        }
    })
}

document.addEventListener('DOMContentLoaded', function() {
    appendContributions();
});