(function () {

  const confettiContainer = document.getElementById("confettiContainer");

  let DATA_pList, DATA_currentList, DATA_currentListFiltered = [];

  let HTMLDATA_pListTable, HTMLDATA_currentListTable, HTMLDATA_currentListFilteredTable = "";

  // utils

  const resyncEntries = () => {
    DATA_pList = localStorage.getItem("datalist") !== null || typeof localStorage.getItem("datalist") === "string" ? JSON.parse(localStorage.getItem("datalist")) : [];
    DATA_currentList = localStorage.getItem("currentDatalist") !== null || typeof localStorage.getItem("currentDatalist") === "string" ? JSON.parse(localStorage.getItem("currentDatalist")) : [];
    DATA_currentListFiltered = DATA_currentList.filter(cl => cl.amount > 0);

    const generateDataTable = (datalistEntries) => {

      const theDataHeaderRow = document.createElement("thead");
      theDataHeaderRow.innerHTML = `<tr><th class="text-center">No.</th><th>Entry</th><th class="text-center">ID</th><th class="text-center">Amount</th></tr>`;

      const theDataTable = document.createElement("tbody");
      datalistEntries.length > 0 ? datalistEntries.forEach((p, idx) => {
        const rowItem = document.createElement("tr");
        rowItem.innerHTML = `<td class="text-center">${++idx}.</td><td>${p?.text ?? p["1"] ?? ""}</td><td class="text-center">${p?.id ?? p["2"] ?? ""}</td><td class="text-center">${p?.amount ?? p["3"] ?? ""}</td>`;
        theDataTable.appendChild(rowItem);
      }) : theDataTable.innerHTML = `<tr><td class="text-center fst-italic" colspan="4">Empty</td></tr>`;
      return theDataHeaderRow.outerHTML + theDataTable.outerHTML;
    }

    HTMLDATA_pListTable = generateDataTable(DATA_pList);
    HTMLDATA_currentListTable = generateDataTable(DATA_currentList);
    HTMLDATA_currentListFilteredTable = generateDataTable(DATA_currentListFiltered);
  }

  /** 
   * randomize with percentage
   * 
   * @returns {Object}
   */
  const weightedRandom = (array, weights) => {
    console.log(weights);
    const totalWeight = weights.reduce((a, b) => a + b, 0);
    console.log(totalWeight);
    let random = Math.random() * totalWeight;
    console.log(random);
    const index = array.findIndex((_, i) => (random -= weights[i]) <= 0);
    return {
      value: array[index],
      index,
    }
  };

  // for test random
  // let resObj = {};
  // for (i = 0; i < 1000; i++) {
  //   let result = weightedRandom(array, weights);
  //   resObj[result.value] = resObj?.[result.value] ? resObj[result.value] + 1 : 1;
  // }
  // let newObj = {};
  // (Object.entries(resObj).sort((a, b) => b[1] - a[1])).forEach(e => newObj[e[0]] = e[1]);
  // console.table(newObj)

  // variables
  let start = false;
  let hcPrizes = [];
  const spinBtn = document.getElementsByClassName("luckydraw-start-btn")[0];

  // luckywheel options
  let USE_PERCENTAGE = false;
  let UPDATE_PERCENTAGE_FOLLOWING_AMOUNT = false;

  // menu
  // change fullscreen mode
  const fullscreenBtn = document.querySelector("a[href='#fullscreen']");

  const changeFullScreenText = (ev) => {
    if (!document.fullscreenElement) {
      fullscreenBtn.innerText = "Fullscreen";
    } else {
      fullscreenBtn.innerText = "Exit Fullscreen";
    }
  }

  const toggleFullScreen = () => {
    if (!document.fullscreenElement && !document.mozFullScreenElement && !document.webkitFullscreenElement && !document.msFullscreenElement) {
      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen();
      } else if (document.documentElement.mozRequestFullScreen) {
        document.documentElement.mozRequestFullScreen();
      } else if (document.documentElement.webkitRequestFullscreen) {
        document.documentElement.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
      } else if (document.documentElement.msRequestFullscreen) {
        document.documentElement.msRequestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.mozCancelFullScreen) {
        document.mozCancelFullScreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
      }
    }
  }

  fullscreenBtn.addEventListener("click", function (ev) {
    ev.preventDefault();
    toggleFullScreen();
  })

  const overrideF11Key = (ev) => {
    if (([ev.keyCode, ev.which].includes(122) || ev.key == 'F11') && !(ev.altKey || ev.ctrlKey || ev.shiftKey || ev.metaKey)) {
      ev.preventDefault();
      toggleFullScreen();
      return false;
    }
  }

  window.addEventListener("keydown", overrideF11Key);

  if (document.fullscreenEnabled) {
    document.addEventListener('fullscreenchange', changeFullScreenText);
  } else if (document.mozFullScreenEnabled) {
    document.addEventListener('mozfullscreenchange', changeFullScreenText);
  } else if (document.webkitFullscreenEnabled) {
    document.addEventListener('webkitfullscreenchange', changeFullScreenText);
  } else if (document.msFullscreenEnabled) {
    document.addEventListener('MSFullscreenChange', changeFullScreenText);
  }

  // save data to local storage
  function saveData(ev) {
    ev.preventDefault();
    const fileInput = Swal.getPopup().querySelector("#datalist");

    if (fileInput.files.length === 0) {
      Swal.showValidationMessage("Please upload file");
      return;
    }

    const file = fileInput.files[0];

    const reader = new FileReader();

    reader.onload = function (event) {
      try {
        const data = new Uint8Array(event.target.result);

        const workbook = XLSX.read(data, {
          type: 'array'
        });

        let dataL = [];

        workbook.SheetNames.forEach(function (sheetName) {
          const sheetDataList = XLSX.utils.sheet_to_row_object_array(workbook.Sheets[sheetName]);

          // Define headerStr mappings
          const headerMapping = {
            text: ["TEXT", "Text", "text", "NAMA", "Nama", "nama", "NAME", "Name", "name", "1"],
            id: ["ID", "Id", "id", "2"],
            amount: ["JUMLAH", "Jumlah", "jumlah", "AMOUNT", "Amount", "amount", "COUNT", "Count", "count", "3"],
            percentage: ["PERSENTASE", "Persentase", "persentase", "PERCENTAGE", "Percentage", "percentage", "WEIGHT", "Weight", "weight", "4"],
          }

          const mapHeader = (dataHeaders, dataRow) => {
            for (const headerStr of dataHeaders) {
              if (dataRow.hasOwnProperty(headerStr)) return dataRow[headerStr];
            }
            return null;
          };

          // Parse rows dynamically
          const dataList = sheetDataList.map((row) => {
            const parsedRow = {
              text: mapHeader(headerMapping.text, row),
              id: mapHeader(headerMapping.id, row),
              amount: mapHeader(headerMapping.amount, row) ?? 1,
              percentage: mapHeader(headerMapping.percentage, row) ?? null,
            };

            // Add remaining columns dynamically
            for (const [key, value] of Object.entries(row)) {
              if (!Object.values(headerMapping).flat().includes(key)) {
                parsedRow[key] = value;
              }
            }

            return parsedRow;
          });

          // const dataList = sheetDataList.map((dl) => {
          //   // let text, id, amount;
          //   // Object.keys(dl).forEach(key => {
          //   //   if (["text", "nama", "name", "1"].includes(key.toLowerCase())) {
          //   //     text = dl[key];
          //   //   } else if (["id", "2"].includes(key.toLowerCase())) {
          //   //     id = dl[key];
          //   //   } else if (["amount", "3"].includes(key.toLowerCase())) {
          //   //     amount = dl[key];
          //   //   }
          //   // })

          //   // return {
          //   //   text: dl["TEXT"] ?? dl["Text"] ?? dl["text"] ?? dl["NAMA"] ?? dl["Nama"] ?? dl["nama"] ?? dl["NAME"] ?? dl["Name"] ?? dl["name"] ?? dl["1"],
          //   //   id: dl["ID"] ?? dl["Id"] ?? dl["id"] ?? dl["2"],
          //   //   amount: dl["JUMLAH"] ?? dl["Jumlah"] ?? dl["jumlah"] ?? dl["amount"] ?? dl["count"] ?? dl["3"] ?? 1,
          //   //   percentage: dl["PERSENTASE"] ?? dl["Persentase"] ?? dl["persentase"] ?? dl["percentage"] ?? dl["weight"] ?? dl["4"] ?? null,
          //   // }
          //   // // return { text, id, amount, }
          // });

          const totalAmount = dataList.reduce((accum, item) => (accum + item.amount), 0);

          dataList.forEach(fd => {
            fd.percentage = fd.percentage === null ? (fd.amount / totalAmount) : fd.percentage;
            fd.totalAmount = totalAmount;
          });

          dataL.push(dataList);
        });

        const fileData = dataL[0];

        const dataListJSON = JSON.stringify(fileData);
        localStorage.setItem("datalist", dataListJSON);
        localStorage.setItem("currentDatalist", dataListJSON);
        localStorage.removeItem("winnerlist");

        initLuckyDraw(ev);
        ev.target.reset();
        Swal.close();
      } catch (error) {
        Swal.showValidationMessage("Error processing file! Please try again.");
        console.error("File processing error:", error);
      }
    };

    reader.onerror = function (event) {
      Swal.showValidationMessage("File could not be read! Try to upload again")
      console.error("File could not be read! Code " + (event.target.error?.message || event.target.error));
    };

    reader.readAsArrayBuffer(file);
  }
  // end of save data to local storage

  // upload data button
  const uploadDataBtn = document.querySelector("a[href='#upload-data']");

  uploadDataBtn.addEventListener("click", function (ev) {
    ev.preventDefault();

    Swal.fire({
      title: "Upload Data",
      showConfirmButton: false,
      showCloseButton: true,
      allowOutsideClick: typeof localStorage.getItem("datalist") === "string",
      allowEscapeKey: typeof localStorage.getItem("datalist") === "string",
      html: `
        <form id="configForm">
          <div class="m-2 mb-2">
            <input type="file" class="form-control" name="datalist" id="datalist" accept=".xls, .xlsx, .csv">
            <p class="form-text">*Accept excel ( .xls | .xlsx ), or .csv file</p>
          </div>
          <div class="m-2 mb-4">
            <a class="form-text link-primary" href="./luckydraw-contohdata.xlsx" target="_blank">Download sample file here</a>
          </div>
          <div>
            <button type="submit" class="btn btn-primary">Save</button>
          </div>
        </form>
      `,
      didRender: () => {
        const configForm = Swal.getPopup().querySelector("#configForm");
        configForm.addEventListener("submit", saveData);
      },
      customClass: {
        closeButton: "custom-close",
      }
    })

  })

  // save prize data to local storage
  function savePrizeData(ev) {
    ev.preventDefault();
    const fileInput = Swal.getPopup().querySelector("#prizelist");

    if (fileInput.files.length === 0) {
      Swal.showValidationMessage("Please upload file");
      return;
    }

    const file = fileInput.files[0];

    const reader = new FileReader();

    reader.onload = function (event) {
      const data = new Uint8Array(event.target.result);

      const workbook = XLSX.read(data, {
        type: 'array'
      });

      let dataL = [];

      workbook.SheetNames.forEach(function (sheetName) {
        const sheetDataList = XLSX.utils.sheet_to_row_object_array(workbook.Sheets[sheetName]);

        // const dataList = sheetDataList.map((dl) => {

        //   return {
        //     name: dl["prize"] ?? dl["Prize"] ?? dl["PRIZE"] ?? dl["1"],
        //     id: dl["ID"] ?? dl["Id"] ?? dl["id"] ?? dl["2"],
        //     total: dl["TOTAL"] ?? dl["Total"] ?? dl["total"] ?? dl["JUMLAH"] ?? dl["Jumlah"] ?? dl["jumlah"] ?? dl["jumlah per sesi"] ?? dl["JUMLAH PER SESI"] ?? dl["amount"] ?? dl["count"] ?? dl["3"] ?? 1,
        //   }
        //   // return { text, id, amount, }
        // });

        // Define headerStr mappings
        const headerMapping = {
          name: ["PRIZE", "Prize", "prize", "1"],
          id: ["ID", "Id", "id", "2"],
          total: ["TOTAL", "Total", "total", "JUMLAH", "Jumlah", "jumlah", "JUMLAH PER SESI", "Jumlah Per Sesi", "jumlah per sesi", "AMOUNT", "Amount", "amount", "COUNT", "Count", "count", "3"],
        }

        const mapHeader = (dataHeaders, dataRow) => {
          for (const headerStr of dataHeaders) {
            if (dataRow.hasOwnProperty(headerStr)) return dataRow[headerStr];
          }
          return null;
        };

        // Parse rows dynamically
        const dataList = sheetDataList.map((row) => {
          const parsedRow = {
            name: mapHeader(headerMapping.name, row),
            id: mapHeader(headerMapping.id, row),
            total: mapHeader(headerMapping.total, row) ?? 1,
          };

          // Add remaining columns dynamically
          for (const [key, value] of Object.entries(row)) {
            if (!Object.values(headerMapping).flat().includes(key)) {
              parsedRow[key] = value;
            }
          }

          return parsedRow;
        });

        dataL.push(dataList);
      });

      const fileData = dataL[0];

      const dataPrizeListJSON = JSON.stringify(fileData);
      localStorage.setItem("dataPrizelist", dataPrizeListJSON);

      initLuckyDraw(ev);
      ev.target.reset();
      Swal.close();
    };

    reader.onerror = function (event) {
      Swal.showValidationMessage("File could not be read! Try to upload again")
      console.error("File could not be read! Code " + event.target.error.code);
    };

    reader.readAsArrayBuffer(file);
  }
  // end of save data to local storage

  // upload prize button
  const uploadPrizeBtn = document.querySelector("a[href='#upload-prize']");

  uploadPrizeBtn.addEventListener("click", function (ev) {
    ev.preventDefault();

    Swal.fire({
      title: "Upload Prize",
      showConfirmButton: false,
      showCloseButton: true,
      allowOutsideClick: typeof localStorage.getItem("dataPrizelist") === "string",
      allowEscapeKey: typeof localStorage.getItem("dataPrizelist") === "string",
      html: `
        <form id="configPrizeForm">
          <div class="m-2 mb-2">
            <input type="file" class="form-control" name="prizelist" id="prizelist" accept=".xls, .xlsx, .csv">
            <p class="form-text">*Accept excel ( .xls | .xlsx ), or .csv file</p>
          </div>
          <div class="m-2 mb-4">
            <a class="form-text link-primary" href="./luckydraw-contohprizedata.xlsx" target="_blank">Download sample file here</a>
          </div>
          <div>
            <button type="submit" class="btn btn-primary">Save</button>
          </div>
        </form>
      `,
      didRender: () => {
        const configPrizeForm = Swal.getPopup().querySelector("#configPrizeForm");
        configPrizeForm.addEventListener("submit", savePrizeData);
      },
      customClass: {
        closeButton: "custom-close",
      }
    })

  })

  // reset winner data
  const resetWinnerBtn = document.querySelector("a[href='#reset']");

  resetWinnerBtn.addEventListener("click", function (ev) {
    ev.preventDefault();
    Swal.fire({
      title: "Delete Result?",
      text: "This will only delete result, not entries. Continue?",
      icon: "warning",
      confirmButtonText: "Yes",
      cancelButtonText: "No",
      customClass: {
        confirmButton: "btn btn-danger",
        cancelButton: "btn btn-secondary me-3",
      },
      buttonsStyling: false,
      showCancelButton: true,
      focusConfirm: false,
      focusCancel: true,
      reverseButtons: true,
    }).then((result) => {
      if (result.isConfirmed) {
        localStorage.removeItem("winnerlist");
        localStorage.removeItem("currentDatalist");
        initLuckyDraw(ev);
      }
    })
  })

  // delete data
  const deleteListBtn = document.querySelector("a[href='#delete']");

  deleteListBtn.addEventListener("click", function (ev) {
    ev.preventDefault();
    Swal.fire({
      title: "Delete all list?",
      text: "This will delete all entries and result. Continue?",
      icon: "warning",
      confirmButtonText: "Yes",
      cancelButtonText: "No",
      customClass: {
        confirmButton: "btn btn-danger",
        cancelButton: "btn btn-secondary me-3",
      },
      buttonsStyling: false,
      showCancelButton: true,
      focusConfirm: false,
      focusCancel: true,
      reverseButtons: true,
    }).then((result) => {
      if (result.isConfirmed) {
        // remove data list
        localStorage.removeItem("winnerlist");
        localStorage.removeItem("datalist");
        localStorage.removeItem("dataPrizelist");
        localStorage.removeItem("currentDatalist");
        // // remove data in hc luckywheel prizes
        // hcPrizes = [];
        // disable spin button
        spinBtn.classList.add("disabled");
        console.log("all data removed");
      }
    })
  })

  // see participant list
  const participantListBtn = document.querySelector("a[href='#participant-list']");

  participantListBtn.addEventListener("click", function (ev) {
    ev.preventDefault();

    // open left drawer
    Swal.fire({
      title: 'Entries',
      position: 'top-start',
      showClass: {
        popup: `
          animate__animated
          animate__fadeInLeft
          animate__faster
        `
      },
      hideClass: {
        popup: `
          animate__animated
          animate__fadeOutLeft
          animate__faster
        `
      },
      showConfirmButton: DATA_pList.length === 0,
      confirmButtonText: "Upload data",
      reverseButtons: true,
      customClass: {
        confirmButton: "btn btn-primary",
        cancelButton: "btn btn-secondary me-3",
        popup: "swal2-list",
        title: "swal2-list-title",
        closeButton: "custom-close",
      },
      buttonsStyling: false,
      showCancelButton: true,
      cancelButtonText: "Close",
      showCloseButton: true,
      didRender: (pop) => {

        const tableEl = pop.querySelector(".swal2-html-container .table");

        tableEl.innerHTML = HTMLDATA_currentListTable;

        document.getElementById("initialData").addEventListener("change", function (ev) {
          if (this.checked) tableEl.innerHTML = HTMLDATA_pListTable;
        });

        const toggleEmpty = document.getElementById("toggleEmpty");
        const currentListToggle = document.getElementById("currentData");

        toggleEmpty.addEventListener("change", function (ev) {
          if (currentListToggle.checked) {
            if (this.checked) tableEl.innerHTML = HTMLDATA_currentListTable;
            else tableEl.innerHTML = HTMLDATA_currentListFilteredTable;
          }
        });

        currentListToggle.addEventListener("change", function (ev) {
          if (this.checked) {
            if (toggleEmpty.checked) tableEl.innerHTML = HTMLDATA_currentListTable;
            else tableEl.innerHTML = HTMLDATA_currentListFilteredTable;
          }
        });

      },
      html: `
        <div class="entries-wrapper">
          <div class="switches">
            <div class="form-check">
              <input class="form-check-input" type="radio" name="dataEntries" id="currentData" checked>
              <label class="form-check-label" for="currentData">
                Current Data Entries
              </label>
            </div>
            <div class="form-check">
              <input class="form-check-input" type="radio" name="dataEntries" id="initialData">
              <label class="form-check-label" for="initialData">
                Initial Data Entries
              </label>
            </div>
            <hr />
            <div class="form-check form-switch">
              <input class="form-check-input" type="checkbox" role="switch" id="toggleEmpty" checked>
              <label class="form-check-label" for="toggleEmpty">Show Empty Amount</label>
            </div>
          </div>
          <div class="table-wrapper">
            <table class="table text-start">
            </table>
          </div>
        </div>
      `,
    }).then((result) => {
      if (result.isConfirmed) {
        uploadDataBtn.click();
      }
    });
  });

  // see winner list
  const winnerListBtn = document.querySelector("a[href='#winner-list']");

  winnerListBtn.addEventListener("click", function (ev) {
    ev.preventDefault();

    const wList = localStorage.getItem("winnerlist") !== null || typeof localStorage.getItem("winnerlist") === "string" ? JSON.parse(localStorage.getItem("winnerlist")) : [];


    // open left drawer
    Swal.fire({
      title: 'Result',
      position: 'top-start',
      showClass: {
        popup: `
          animate__animated
          animate__fadeInLeft
          animate__faster
        `
      },
      hideClass: {
        popup: `
          animate__animated
          animate__fadeOutLeft
          animate__faster
        `
      },
      customClass: {
        cancelButton: "btn btn-secondary",
        popup: "swal2-list",
        title: "swal2-list-title",
        closeButton: "custom-close",
      },
      buttonsStyling: false,
      showConfirmButton: false,
      showCancelButton: true,
      cancelButtonText: "Close",
      showCloseButton: true,
      didRender: (pop) => {

        const tableEl = pop.querySelector(".swal2-html-container .table");


        const theDataHeaderRow = document.createElement("thead");
        theDataHeaderRow.innerHTML = `<tr><th class="text-center">Batch</th><th>Prize</th><th>Winners</th><th class="">Winners ID</th></tr>`;

        const tableBody = document.createElement("tbody");
        wList.length > 0 ? wList.forEach((w, idx) => {
          const rowItem = document.createElement("tr");
          rowItem.innerHTML = `<td class="text-center" rowspan="${w?.winners?.length}"><span class="sticky-col">${++idx}.</span></td><td>${w?.winners[0].prize}</td><td>1. ${w?.winners.map(item => `${item.text}`)[0] ?? w?.["1"] ?? ""}</td><td class="">${w?.winners[0].id ?? w?.["2"] ?? ""}</td>`;
          tableBody.appendChild(rowItem);

          let num = 1;
          w?.winners.forEach((item, index) => {
            if (index === 0) {
              return;
            }
            const winnerRow = document.createElement("tr");
            winnerRow.innerHTML = `<td>${item.prize}</td><td class="">${++num}. ${item.text}</td><td class="">${item.id}</td>`;
            tableBody.appendChild(winnerRow);
          });

        }) : tableBody.innerHTML = `<tr><td class="text-center fst-italic" colspan="3">Empty</td></tr>`;

        tableEl.innerHTML = theDataHeaderRow.outerHTML + tableBody.outerHTML;


        // download result button
        const downloadResultBtn = document.getElementById("downloadResult");

        downloadResultBtn.addEventListener("click", (ev) => {
          ev.preventDefault();

          exportWinners({ format: "xlsx" });

        })
        // download csv result button
        const downloadCSVResultBtn = document.getElementById("downloadCSVResult");

        downloadCSVResultBtn.addEventListener("click", (ev) => {
          ev.preventDefault();

          exportWinners({ format: "csv" });

        })

      },
      html: `
        <div class="table-wrapper">
          <table class="table table-bordered table-striped table-hover text-start">
          </table>
          </div>
          `,
      footer: `
        <div class="d-flex gap-2 w-100">
          <button id="downloadResult" class="btn btn-primary">Download All Result as Excel</button>
          <button id="downloadCSVResult" class="btn btn-primary">Download All Result as CSV</button>
        </div>
      `
    });
  });


  // load sample data function
  const loadSampleData = (path) => {
    return new Promise((resolve, reject) => {

      let xhr = new XMLHttpRequest();
      xhr.onload = function () {

        // convert data to binary string
        let arraybuffer = xhr.response;
        let dataUint8Arr = new Uint8Array(arraybuffer);
        let arr = new Array();
        for (let i = 0; i != dataUint8Arr.length; ++i) {
          arr[i] = String.fromCharCode(dataUint8Arr[i])
        };
        let bstr = arr.join("");

        const workbook = XLSX.read(bstr, {
          type: "binary"
        });

        let dataL = [];

        workbook.SheetNames.forEach(function (sheetName) {
          const sheetDataList = XLSX.utils.sheet_to_row_object_array(workbook.Sheets[sheetName]);

          // Define headerStr mappings
          const headerMapping = {
            text: ["TEXT", "Text", "text", "NAMA", "Nama", "nama", "NAME", "Name", "name", "1"],
            id: ["ID", "Id", "id", "2"],
            amount: ["JUMLAH", "Jumlah", "jumlah", "AMOUNT", "Amount", "amount", "COUNT", "Count", "count", "3"],
            percentage: ["PERSENTASE", "Persentase", "persentase", "PERCENTAGE", "Percentage", "percentage", "WEIGHT", "Weight", "weight", "4"],
          }

          const mapHeader = (dataHeaders, dataRow) => {
            for (const headerStr of dataHeaders) {
              if (dataRow.hasOwnProperty(headerStr)) return dataRow[headerStr];
            }
            return null;
          };

          // Parse rows dynamically
          const dataList = sheetDataList.map((row) => {
            const parsedRow = {
              text: mapHeader(headerMapping.text, row),
              id: mapHeader(headerMapping.id, row),
              amount: mapHeader(headerMapping.amount, row) ?? 1,
              percentage: mapHeader(headerMapping.percentage, row) ?? null,
            };

            // Add remaining columns dynamically
            for (const [key, value] of Object.entries(row)) {
              if (!Object.values(headerMapping).flat().includes(key)) {
                parsedRow[key] = value;
              }
            }

            return parsedRow;
          });

          const totalAmount = dataList.reduce((accum, item) => (accum + item.amount), 0);

          dataList.forEach(fd => {
            fd.percentage = fd.percentage === null ? (fd.amount / totalAmount) : fd.percentage;
            fd.totalAmount = totalAmount;
          });

          dataL.push(dataList);
        });

        // workbook.SheetNames.forEach(function (sheetName) {
        //   const sheetDataList = XLSX.utils.sheet_to_row_object_array(workbook.Sheets[sheetName]);
        //   const dataList = sheetDataList.map((dl) => {
        //     // let text, id, amount;
        //     // Object.keys(dl).forEach(key => {
        //     //   if (["text", "nama", "name", "1"].includes(key.toLowerCase())) {
        //     //     text = dl[key];
        //     //   } else if (["id", "2"].includes(key.toLowerCase())) {
        //     //     id = dl[key];
        //     //   } else if (["amount", "3"].includes(key.toLowerCase())) {
        //     //     amount = dl[key];
        //     //   }
        //     // })

        //     return {
        //       text: dl["TEXT"] ?? dl["Text"] ?? dl["text"] ?? dl["NAMA"] ?? dl["Nama"] ?? dl["nama"] ?? dl["NAME"] ?? dl["Name"] ?? dl["name"] ?? dl["1"],
        //       id: dl["ID"] ?? dl["Id"] ?? dl["id"] ?? dl["2"],
        //       amount: dl["JUMLAH"] ?? dl["Jumlah"] ?? dl["jumlah"] ?? dl["amount"] ?? dl["count"] ?? dl["3"] ?? 1,
        //       percentage: dl["PERSENTASE"] ?? dl["Persentase"] ?? dl["persentase"] ?? dl["percentage"] ?? dl["weight"] ?? dl["4"] ?? null,
        //     }
        //     // return { text, id, amount, }
        //   })

        //   const totalAmount = dataList.reduce((accum, item) => (accum + item.amount), 0);

        //   dataList.forEach(fd => {
        //     fd.percentage = fd.percentage === null ? (fd.amount / totalAmount) : fd.percentage;
        //     fd.totalAmount = totalAmount;
        //   });

        //   dataL.push(dataList);
        // });

        const fileData = dataL[0];

        const dataListJSON = JSON.stringify(fileData);
        localStorage.setItem("datalist", dataListJSON);
        localStorage.removeItem("winnerlist");

        spinBtn.classList.remove("disabled");

        resolve(fileData);
      };

      xhr.open("GET", path);
      xhr.responseType = "arraybuffer";
      xhr.send();
    })
  }

  // at first website loading
  // load file from localStorage or load sample data in luckydraw-contohdata.xlsx
  function loadListNama(path = "./luckydraw-contohdata.xlsx") {
    return new Promise(async function (resolve, reject) {

      spinBtn.classList.add("disabled");

      // load from localStorage

      if (localStorage.getItem("datalist") !== null || typeof localStorage.getItem("datalist") === "string") {
        const currentDatalist = localStorage.getItem("currentDatalist");
        if (currentDatalist !== null || typeof currentDatalist === "string") {
          const data = JSON.parse(currentDatalist);
          spinBtn.classList.remove("disabled");
          resolve(data);
        } else {
          const data = JSON.parse(localStorage.getItem("datalist"));

          if (data.length > 0) {
            spinBtn.classList.remove("disabled");
            resolve(data);
          } else {
            resolve(await loadSampleData(path));
          }

        }
      } else {
        // reject("Mohon Upload Data Peserta");

        // load sample data
        resolve(await loadSampleData(path));

      }
    });
  }

  // initiate Lucky Draw
  function initLuckyDraw(ev) {

    // set confetti
    initConfetti({ container: confettiContainer })

    const closeConfettiBtns = document.getElementsByClassName("close-confetti-btn");
    [...closeConfettiBtns].forEach(closeConfettiBtn => {
      closeConfettiBtn.addEventListener("click", () => removeConfetti({ container: confettiContainer }));
    })

    // load settings

    const options = getLS("options");

    console.log({ options })

    if (options) {
      USE_PERCENTAGE = options?.usePercentage || false;
      UPDATE_PERCENTAGE_FOLLOWING_AMOUNT = options?.updatePercentageFollowingAmount || false;
    }

    loadListNama()
      .then(function (fileData) {
        // Use the file data
        localStorage.setItem("currentDatalist", JSON.stringify(fileData));

        if (fileData.length === 0 || fileData.every(p => p.amount === 0)) {
          spinBtn.classList.add("disabled");
          // return;
        }

        // load prize list
        const prizeListStr = localStorage.getItem("dataPrizelist")
        if (prizeListStr !== null || typeof prizeListStr === "string") {
          const prizeList = JSON.parse(prizeListStr).flatMap(item => Array(item.total).fill(item.name));
          // reload prize list, remove winner list from container
          // show prize list
          const prizeContainer = document.getElementById("listContainer");
          const listHtml = prizeList.map((prize, idx) => {
            // const listItem = [...document.getElementsByClassName('winner-prize')];
            return `
              <li class="winner-item">
                <div class="d-flex gap-1">
                  <p class="winner-prize-num m-0">${(++idx).toString().padStart(2, "0")}.</p>
                  <p class="winner-prize m-0">${prize} :</p>
                </div>
                <p class="winner-name rustle-target m-0"></p>
              </li>
            `
          });
          prizeContainer.innerHTML = listHtml.join("");
        } else {
          Swal.fire({
            title: "Please upload prize list",
            text: "",
            icon: "error",
            position: "top",
            customClass: {
              confirmButton: "btn btn-primary",
            },
            buttonsStyling: false,
            didDestroy: () => {
              uploadPrizeBtn.click();
            }
          })
          return;
        }

        // const cancelSpinBtn = document.getElementById("cancelSpinBtn");

        // 
        resyncEntries();

        // main luckydraw on click

        spinBtn.addEventListener("click", startRandoming);

        /*
        hcLuckyDraw.init({
          id: "luckydraw",
          // theme: {
          //   evenBgColor,
          //   oddBgColor,
          //   outlineColor,
          //   btnColor,
          //   evenTextColor,
          //   oddTextColor,
          //   lineColor,
          //   lineWidth,
          // },
          // theme: {
          //   ...options.theme,
          // },
          config: function (callback) {
            callback &&
              callback(hcPrizes, cancelSpinBtn);
          },
          mode: null,
          getPrize: function (callback) {
            // trigger spinning
            console.log("trigger spinning", new Date());
            if (start) {
              console.error("already trigerred spinning");
              return;
            } else {
              start = true;
            }

            // hide navigation if opened
            const navToggler = document.getElementsByClassName("navbar-toggler")[0];
            if (navToggler.clientHeight > 0 && navToggler.ariaExpanded === "true") {
              navToggler.click();
            }
            // hide settings or dataset panel if opened
            document.getElementsByClassName("settings show")[0]?.classList.remove("show");
            document.getElementsByClassName("dataset show")[0]?.classList.remove("show");
            // and disabled form
            document.getElementById("settingsForm").setAttribute("inert", "inert");

            // hide all button except fullscreen
            [...document.getElementsByTagName("a")].filter(el => el.href.split("/").pop() != "#fullscreen").forEach(el => el.classList.add("disabled"));
            [...document.getElementsByTagName("button")].forEach(el => el.setAttribute("disabled", "disabled"));

            let rand = randomIndex(prizes);
            let chances = rand;
            callback && callback([rand, chances]);
          },
          gotBack: function (winnerData, winnerDataId) {
            // after transition end

            // redisabled spin button if enabled
            document.getElementsByClassName("luckydraw-start-btn")[0].classList.add("disabled");

            // show popup
            if (winnerData === null) {
              Swal.fire({
                title: 'Finished! Thanks For Playing',
                text: "You can restart by deleting result or upload new data",
                icon: 'info',
                allowOutsideClick: false,
                allowEscapeKey: false,
                allowEnterKey: false,
                customClass: {
                  confirmButton: "btn btn-light",
                },
                buttonsStyling: false,
                didDestroy: () => {
                  [...document.getElementsByTagName("a")].forEach(el => el.classList.remove("disabled"));
                  [...document.getElementsByTagName("button")].forEach(el => el.removeAttribute("disabled"));
                }
              })
            } else if (winnerData.text === 'Good luck next time') {
              Swal.fire({
                title: 'You missed it! Good luck next time',
                icon: 'error',
                allowOutsideClick: false,
                allowEscapeKey: false,
                allowEnterKey: false,
                customClass: {
                  confirmButton: "btn btn-light",
                },
                buttonsStyling: false,
                didDestroy: () => {
                  [...document.getElementsByTagName("a")].forEach(el => el.classList.remove("disabled"));
                  [...document.getElementsByTagName("button")].forEach(el => el.removeAttribute("disabled"));
                }
              })
            } else {
              // show confetti
              window.playConfetti();

              Swal.fire({
                title: 'Congratulation!',
                // position: "top",
                html: `<p class="fw-bold text-uppercase" style="color: #022575; font-size:3rem">${winnerData.text}</p><p class="fs-4 fw-bold" style="color: #022575">${winnerData.id ?? ""}</p>`,
                // icon: 'success',
                didDestroy: async () => {

                  let timeout;

                  const afterCloseWinner = () => {
                    [...document.getElementsByTagName("a")].forEach(el => el.classList.remove("disabled"));
                    [...document.getElementsByTagName("button")].forEach(el => el.removeAttribute("disabled"));

                    if (prizes.length === 0 || prizes.every(p => p.amount === 0)) {
                      spinBtn.classList.add("disabled");
                    }

                    window.removeConfetti();
                  }

                  if (prizes[winnerDataId].amount === 0) {
                    const winnerTextEl = document.getElementsByClassName("curve")[winnerDataId];
                    winnerTextEl.classList.add("empty");

                    // listen to transitionend
                    winnerTextEl.addEventListener("transitionend", (ev) => {

                      clearTimeout(timeout);

                      timeout = setTimeout(() => {
                        afterCloseWinner();
                      }, 500);

                    });
                  } else {
                    afterCloseWinner();
                  }

                },
                allowOutsideClick: false,
                allowEscapeKey: false,
                allowEnterKey: false,
                showClass: {
                  popup: "popup-show-scaled",
                },
                customClass: {
                  popup: "scale-up glassmorphism",
                  confirmButton: "btn btn-light text-reset",
                },
                backdrop: false,
                buttonsStyling: false,
              })

              // update current data
              prizes[winnerDataId].amount = prizes[winnerDataId].amount - 1;
              if (UPDATE_PERCENTAGE_FOLLOWING_AMOUNT) {
                prizes[winnerDataId].percentage = prizes[winnerDataId].amount / prizes[winnerDataId].totalAmount;
              }
              localStorage.setItem("currentDatalist", JSON.stringify(prizes));

              // initLuckyDraw();

              // if (prizes[winnerDataId].amount === 0) {
              //   // prizes.splice(winnerDataId, 1);
              //   // if (prizes.length > 0) {
              //   initLuckyDraw();
              //   // }
              // } else {
              //   localStorage.setItem("currentDatalist", JSON.stringify(prizes));
              // }

              // set winner list
              const currentWinnerList = localStorage.getItem("winnerlist") !== null || typeof localStorage.getItem("winnerlist") === "string" ? JSON.parse(localStorage.getItem("winnerlist")) : [];
              currentWinnerList.push(prizes[winnerDataId]);

              const winnerList = JSON.stringify(currentWinnerList);
              localStorage.setItem("winnerlist", winnerList);

            }

            // spinning has stopped
            start = false;
          },
        });
        */
      })
      .catch(function (err) {
        // The call failed, look at `err` for details
        console.error("error", err.message);
        if (err === "Mohon Upload Data Peserta") {
          uploadDataBtn.click();
          return;
        }

        Swal.fire({
          title: "Some error happened",
          text: "Sorry! Please reupload data",
          icon: "error",
          position: "top-end",
          customClass: {
            confirmButton: "btn btn-primary",
          },
          buttonsStyling: false,
          didDestroy: () => {
            uploadDataBtn.click();
          }
        })
      });
  }

  // on load document
  document.addEventListener(
    "DOMContentLoaded",
    initLuckyDraw,
    false
  );

  window.initLuckyDraw === undefined && (window.initLuckyDraw = initLuckyDraw);

  function randomIndex(prizes) {
    if (USE_PERCENTAGE) {
      let counter = 0;
      for (let i = 0; i < prizes.length; i++) {
        if (prizes[i].amount === 0) {
          counter++;
        }
      }
      if (counter === prizes.length) {
        return null
      }

      const weights = prizes.map(prize => prize.percentage);

      console.log(weights);

      const randPrizes = weightedRandom(prizes, weights);
      console.log(randPrizes);
      if (randPrizes.value.amount != 0) {
        return randPrizes.index;
      } else {
        return randomIndex(prizes)
      }
    } else {

      let counter = 0;
      for (let i = 0; i < prizes.length; i++) {
        if (prizes[i].amount === 0) {
          counter++;
        }
      }
      if (counter == prizes.length) {
        return null
      }
      let rand = (Math.random() * (prizes.length)) >>> 0;
      if (prizes[rand].amount != 0) {
        return rand;
      } else {
        return randomIndex(prizes)
      }
    }
  }


  // main code

  // Initialize prizes
  // const prizesListSample = [
  //   'Tumbler', 'Smartphone', 'Headphones', 'Smartwatch', 'Tablet',
  //   'Bluetooth Speaker', 'Gift Card', 'Gaming Console', 'Camera', 'Drone',
  //   'Backpack', 'Fitness Tracker', 'Power Bank', 'E-Reader', 'Streaming Device',
  //   'VR Headset', 'Coffee Maker', 'Air Purifier', 'Robot Vacuum', 'Smart Light Bulbs',
  //   'Desk Organizer', 'Portable Monitor', 'Projector', 'Noise-canceling Headphones', 'Electric Scooter',
  //   'Wireless Keyboard', 'Smart Thermostat', 'Mechanical Keyboard', 'Home Security Camera', 'Wi-Fi Router',
  //   'Cookware Set', 'Portable Charger', 'Hair Dryer', 'Digital Photo Frame', 'Smart Plug',
  //   'Smart Doorbell', 'Microwave Oven', 'Espresso Machine', 'Blender', 'Electric Kettle',
  //   'Digital Drawing Pad', 'Board Games Set', 'Portable SSD', 'External HDD', 'Action Camera',
  //   'Bean Bag', 'Streaming Subscription', 'Gourmet Basket', 'Book Collection', 'Luxury Pen Set'
  // ];

  const prizeListData = [
    {
      name: "Tumbler",
      total: 20,
    },
    {
      name: "Mug",
      total: 10,
    },
    {
      name: "Payung",
      total: 10,
    },
    {
      name: "T-Shirt",
      total: 5,
    },
    {
      name: "Topi",
      total: 5,
    },
  ]

  const prizesListSample = prizeListData.flatMap(item => Array(item.total).fill(item.name));

  // Shuffle array using Fisher-Yates algorithm
  function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }

  // Randomize and pick 50 names
  // function pickWinners() {
  //   const dataList = getLocalStorage(CURRENT_DATA_LIST_KEY,);
  //   if (dataList.length < 50 || dataList.every(item => item.amount < 1)) {
  //     alert('Not enough data to pick 50 winners!');
  //     return;
  //   }

  //   // Shuffle and pick 50 winners
  //   const dataToShuffle = dataList.filter(item => item.amount > 0);
  //   shuffleArray(dataToShuffle);
  //   const pickedWinners = dataToShuffle.splice(0, 50);

  //   pickedWinners.forEach((item, idx) => {
  //     item.prize = prizesListSample[idx]
  //     item.amount--;
  //   })

  //   // Update current data list in local storage
  //   setLocalStorage(CURRENT_DATA_LIST_KEY, dataList);

  //   // Save winners to winner list with timestamp
  //   const winnerList = getLocalStorage(WINNER_LIST_KEY, []);
  //   const newWinnerBatch = {
  //     timestamp: new Date().toISOString(),
  //     winners: pickedWinners,
  //   };
  //   winnerList.push(newWinnerBatch);
  //   setLocalStorage(WINNER_LIST_KEY, winnerList);

  //   return pickedWinners;
  // }

  // Optimized and dynamic pickWinners function
  function pickWinners() {
    const dataList = getLocalStorage(CURRENT_DATA_LIST_KEY, []); // Retrieve the current data list
    const prizeList = getLocalStorage(PRIZE_LIST_KEY, []); // Retrieve the prize list
    const winnersNeeded = prizeList.reduce((sum, prize) => sum + prize.total, 0); // Calculate total prizes

    // Validation: Check if enough data is available for drawing
    if (dataList.length < winnersNeeded || dataList.every(item => item.amount < 1)) {
      alert('Not enough data to pick winners!');
      return;
    }

    // Filter eligible participants (with amount > 0) and shuffle
    const eligibleData = dataList.filter(item => item.amount > 0);
    shuffleArray(eligibleData); // Fisher-Yates Shuffle for performance

    // Select winners and assign prizes
    const pickedWinners = [];
    let prizeIndex = 0;

    for (const prize of prizeList) {
      for (let i = 0; i < prize.total; i++) {
        if (eligibleData.length === 0) break; // Stop if no eligible participants remain
        const winner = eligibleData.shift(); // Pick the next winner
        winner.prize = prize.name; // Assign the prize
        winner.amount--; // Decrease the amount of entries left for the winner
        pickedWinners.push({ ...winner }); // Store the winner
      }
    }

    // Update the original data list
    const updatedDataList = dataList.map(item => {
      const updatedWinner = pickedWinners.find(w => w.id === item.id);
      return updatedWinner ? { ...item, amount: updatedWinner.amount, prize: updatedWinner.prize } : item;
    });

    setLocalStorage(CURRENT_DATA_LIST_KEY, updatedDataList); // Save updated data back to localStorage

    // Save winners to winner list with timestamp
    const winnerList = getLocalStorage(WINNER_LIST_KEY, []);
    const newWinnerBatch = {
      timestamp: new Date().toISOString(),
      winners: pickedWinners,
    };
    winnerList.push(newWinnerBatch);
    setLocalStorage(WINNER_LIST_KEY, winnerList); // Update winner list in localStorage

    // 

    return pickedWinners;
  }

  // Display winners alongside prizes
  // function displayWinners(winners) {
  //   const prizeContainer = document.getElementById(PRIZE_CONTAINER_ID);
  //   prizeContainer.innerHTML = '';

  //   winners.forEach((winner, index) => {
  //     const prize = prizesListSample[index];
  //     const listItem = document.createElement('div');
  //     listItem.innerHTML = `<strong>${prize}:</strong> ${winner.text} (ID: ${winner.id})`;
  //     prizeContainer.appendChild(listItem);
  //   });
  // }

  // Show animating random names during shuffle
  function showRandomizingEffect({ winners, duration = 3000 }) {
    // const prizeContainer = document.getElementById(PRIZE_CONTAINER_ID);
    // prizeContainer.innerHTML = '';



    // Example of 50 different target texts
    // const targetTexts = Array.from({ length: 50 }, (_, i) => `Target Text ${i + 1}`);
    const targetTexts = winners.map(winner => winner.text)

    // Dynamically generate 50 div elements
    // const container = document.getElementById("container");
    // targetTexts.forEach(() => {
    //   const div = document.createElement("div");
    //   div.className = "rustle-target";
    //   container.appendChild(div);
    // });

    // Start rustling effect on button click
    // document.getElementById("startButton").addEventListener("click", () => {
    startMultiRustleEffect({
      targetClass: "rustle-target",
      targetTexts,
      speed: 50,
      increment: 8,
      letters: "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ",
      duration,
    });
    // });

  }

  const startRandoming = () => {
    removeConfetti();

    // reset audio to beginning
    const drumRollAudio = document.getElementById("drumRoll");
    drumRollAudio.currentTime = 0;

    const fanfareApplauseAudio = document.getElementById("fanfareApplause");
    fanfareApplauseAudio.currentTime = 0;
    
    console.log("starting")

    console.log("triggered randoming", new Date());
    if (start) {
      console.error("already trigerred randoming");
      return;
    } else {
      start = true;
    }

    // hide navigation if opened
    const navToggler = document.getElementsByClassName("navbar-toggler")[0];
    if (navToggler.clientHeight > 0 && navToggler.ariaExpanded === "true") {
      navToggler.click();
    }
    // hide settings or dataset panel if opened
    document.getElementsByClassName("settings show")[0]?.classList.remove("show");
    document.getElementsByClassName("dataset show")[0]?.classList.remove("show");
    // and disabled form
    document.getElementById("settingsForm").setAttribute("inert", "inert");

    // hide all button except fullscreen
    [...document.getElementsByTagName("a")].filter(el => el.href.split("/").pop() != "#fullscreen").forEach(el => el.classList.add("disabled"));
    [...document.getElementsByTagName("button")].forEach(el => el.setAttribute("disabled", "disabled"));

    // let rand = randomIndex(prizes);
    // let chances = rand;
    // console.log({ rand });
    // console.log({ chances });

    const options = getLS("options");

    const duration = options?.randomingDuration || 6000;

    const winners = pickWinners();
    if (winners) {
      showRandomizingEffect({ winners, duration });
      drumRollAudio.play();
      // displayWinners(winners);
    }
    // wait for randomizing effect 
    setTimeout(() => {
      window.playConfetti({ container: confettiContainer });
      [...document.getElementsByTagName("a")].forEach(el => el.classList.remove("disabled"));
      [...document.getElementsByTagName("button")].forEach(el => el.removeAttribute("disabled"));
      // setTimeout(() => {
      //   window.removeConfetti();
      // }, 3000);
      // spinning has stopped
      start = false;

      drumRollAudio.pause();
      drumRollAudio.currentTime = 0;
      fanfareApplauseAudio.play();
      
    }, duration); // Adjust time as needed

    // set/resync Entries

    resyncEntries();

  }


  /**
   * Creates a rustling effect on multiple elements, each displaying a different text.
   * 
   * @param {string} targetClass - The class of elements to apply the rustling effect.
   * @param {Array<string>} targetTexts - An array of texts to display in respective elements.
   * @param {number} speed - The speed of the effect in milliseconds per frame.
   * @param {number} increment - Frames per step to fix a letter.
   * @param {string} letters - The letters to cycle through.
   * @param {number} duration - The total duration of the animation in milliseconds.
   */
  function startMultiRustleEffect({
    targetClass,
    targetTexts,
    speed = 50,
    increment = 8,
    letters = "abcdefghijklmnopqrstuvwxyz#%&^+=-",
    duration = 3000,
  }) {
    const elements = document.querySelectorAll(`.${targetClass}`);

    if (elements.length !== targetTexts.length) {
      console.error("Number of elements and targetTexts must match!");
      return;
    }

    const totalFrames = Math.ceil(duration / speed);

    elements.forEach((element, index) => {
      const targetText = targetTexts[index];
      const textLength = targetText.length;
      const fixedIncrement = Math.floor(totalFrames / textLength);

      let frameCount = 0;
      let fixedPart = "";
      let block = "";

      function nextFrame() {
        // Generate random part
        for (let i = 0; i < textLength - fixedPart.length; i++) {
          const randomLetter = letters.charAt(Math.floor(Math.random() * letters.length));
          block += randomLetter;
        }

        // Fix letters at the appropriate frame
        if (frameCount % fixedIncrement === 0 && fixedPart.length < textLength) {
          fixedPart += targetText.charAt(fixedPart.length);
        }

        // Update element with the combined text
        element.innerText = fixedPart + block;

        // Reset the block for the next frame
        block = "";
        frameCount++;
      }

      function animateRustle() {
        const interval = setInterval(() => {
          if (frameCount >= totalFrames) {
            clearInterval(interval);
            // Finalize the text
            element.innerText = targetText;
          } else {
            nextFrame();
          }
        }, speed);
      }

      animateRustle();
    });
  }



})();