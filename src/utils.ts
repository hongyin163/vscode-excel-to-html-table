
export function looksLikeTable(data: Array<Array<string>>) {
    let isTable = true
    let prevLen = data[0].length

    // Ensure all rows have the same number of columns
    data.forEach((row: Array<String>) => {
        isTable = (row.length == prevLen) && isTable
        prevLen = row.length
    });

    return isTable
}

export function buildRows(rawData: String) {
    let data = rawData.trim()
    // Split rows on newline
    var rows: Array<Array<string>> = data.split((/\r\n?/g)).map(function (row) {
        // Split columns on tab
        return row.split("\t").map((item) => {
            return item.replace(/^"|"$/g, '');
        })
    });
    return rows;
}