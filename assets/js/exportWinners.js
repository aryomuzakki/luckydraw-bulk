// Export winners to CSV/XLSX
function exportWinners({ mode = "all", batchId = null, format = "xlsx" }) {
    const winnerList = getLocalStorage(WINNER_LIST_KEY, []);
    let exportData = [];

    console.log({ mode, batchId, format });

    const setWinnersObj = ({ batch, batchID, winner }) => {
        const { text, id, prize, amount, percentage, totalAmount, ...other } = winner;
        return {
            "Batch ID": `Batch ${batchID}`,
            "Batch Timestamps": dayjs(batch?.timestamp).locale("id").format("ddd, D MMM YYYY, HH.mm [WIB]"),
            "Prize": prize,
            "Winners": text,
            "Winners ID": id,
            ...other,
        }
    }

    // Determine which data to export
    if (mode === "all") {
        exportData = winnerList.flatMap((batch, batchIdx) => batch.winners.map(winner => setWinnersObj({ batch, batchID: batchIdx + 1, winner })));
    } else if (mode === "selected" && Array.isArray(batchId)) {
        exportData = batchId.flatMap(id => {
            const batch = winnerList[id - 1]; // Batch IDs are 1-based
            if (!batch) return [];
            return batch.winners.map(winner => setWinnersObj({ batch, batchID: id, winner }));
        });
    } else if (mode === "single" && batchId) {
        const batch = winnerList[batchId - 1]; // Batch IDs are 1-based
        if (!batch) {
            alert("Invalid batch ID!");
            return;
        }
        exportData = batch.winners.map(winner => setWinnersObj({ batch, batchID: batchId, winner }));
    } else {
        alert("Invalid export mode or batch ID!");
        return;
    }

    // Convert to worksheet
    const ws = XLSX.utils.json_to_sheet(exportData);

    // Adjust column widths based on content length
    const columnWidths = [
        { wch: Math.max(...exportData.map(row => row["Batch ID"].length), "Batch ID".length) },
        { wch: Math.max(...exportData.map(row => row["Batch Timestamps"].length), "Batch Timestamps".length) },
        { wch: Math.max(...exportData.map(row => row["Prize"].length), "Prize".length) },
        { wch: Math.max(...exportData.map(row => row["Winners"].length), "Winners".length) },
        { wch: Math.max(...exportData.map(row => row["Winners ID"]?.toString().length), "Winners ID".length) },
    ];

    ws["!cols"] = columnWidths;

    // export
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Winners");

    // Export as XLSX or CSV
    const fileName = `winners-${dayjs().format('YYYYMMDD_HHmmss')}.${format}`;
    if (format === "xlsx") {
        XLSX.writeFile(wb, fileName);
    } else if (format === "csv") {
        XLSX.writeFile(wb, fileName, { bookType: "csv" });
    } else {
        alert("Unsupported file format!");
    }
}
