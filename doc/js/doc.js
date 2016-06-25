
function loadVersionListRoot() {
    $.get("./.version.json", function (data) {

        var versionHistory = data;
        var versionDiv = $("#versions");
        versionDiv.eq(0).html("");

        versionHistory.forEach(function (version) {

            var versionBlock =
                '<div class="big_part">' +
                    '<h2><a href="./' + version.version + '/index.html">V ' + version.version + '</a></h2>' +
                    '<ul>';

            version.changes.forEach(function (change) {
                versionBlock += '<li>' + change + '</li>';
            });

            versionBlock += '</ul>' +
                    '<i> by ' + version.author + ', ' + version.date + '</i>' +
                    '</div>';

            versionDiv.append(versionBlock);
        });


    });
}

function loadVersions() {

    $.get("../.version.json", function (data) {

        var versionHistory = data;
        var versionList = $("#versionList");

        versionHistory.forEach(function (version, i) {

            var versionLi = '<li><a href="../' + version.version + '/index.html">';
            if (version.version == cV)
                versionLi += "<b>";

            versionLi += "v" + version.version;

            if (i == 0)
                versionLi += '<span class="glyphicon glyphicon-arrow-left"></span>';

            if (version.version == cV)
                versionLi += "</b>";

            versionLi += "</a></li>";

            versionList.append(versionLi);
        });
    });
}