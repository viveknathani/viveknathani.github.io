const technicalBlogPosts = [
    {
        name: "building delp - an open source tool to help devs",
        path: "./delp",
        uploadedAt: "07/21"
    }
]

function sortBlogPosts(postData) {

    postData.sort(function comparator(firstElement, secondElement) {
        return firstElement.uploadedAt < secondElement.uploadedAt;
    });
}

function fillUpDocumentWithPosts(postType, postData) {

    var heading = document.createElement("h4");
    heading.innerText = postType;

    var list = document.createElement("ul");
    for (var i = 0; i < postData.length; i++) {

        var listElement = document.createElement("li");
        var listElementLink = document.createElement("a");
        listElementLink.innerText = postData[i].name;
        listElementLink.href = postData[i].path;
        listElement.appendChild(listElementLink);
        list.appendChild(listElement);
    }
    document.body.appendChild(heading);
    document.body.appendChild(list);
}

sortBlogPosts(technicalBlogPosts);
fillUpDocumentWithPosts("Technical", technicalBlogPosts);
