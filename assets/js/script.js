(function () {

  const confettiContainer = document.getElementById("confettiContainer");

  let DATA_pList, DATA_currentList, DATA_currentListFiltered = [];

  let HTMLDATA_pListTable, HTMLDATA_currentListTable, HTMLDATA_currentListFilteredTable = "";

  // utils

  const resyncEntries = () => {
    DATA_pList = localStorage.getItem(LS_PREFIX + "datalist") !== null || typeof localStorage.getItem(LS_PREFIX + "datalist") === "string" ? JSON.parse(localStorage.getItem(LS_PREFIX + "datalist")) : [];
    DATA_currentList = localStorage.getItem(LS_PREFIX + "currentDatalist") !== null || typeof localStorage.getItem(LS_PREFIX + "currentDatalist") === "string" ? JSON.parse(localStorage.getItem(LS_PREFIX + "currentDatalist")) : [];
    DATA_currentListFiltered = DATA_currentList.filter(cl => cl.amount > 0);

    const generateDataTable = (datalistEntries) => {

      const theDataHeaderRow = document.createElement("thead");
      theDataHeaderRow.innerHTML = `<tr><th class="text-center">No.</th><th>Name</th><th class="text-center">Personal Number</th><th class="text-center">Amount</th></tr>`;

      const theDataTable = document.createElement("tbody");
      datalistEntries.length > 0 ? datalistEntries.forEach((p, idx) => {
        const rowItem = document.createElement("tr");
        rowItem.innerHTML = `<td class="text-center">${++idx}.</td><td>${p?.text ?? p["1"] ?? ""}</td><td class="text-center">${p?.["Personal Number"] ?? ""}</td><td class="text-center">${p?.amount ?? p["3"] ?? ""}</td>`;
        theDataTable.appendChild(rowItem);
      }) : theDataTable.innerHTML = `<tr><td class="text-center fst-italic" colspan="4">Empty</td></tr>`;
      return theDataHeaderRow.outerHTML + theDataTable.outerHTML;
    }

    HTMLDATA_pListTable = generateDataTable(DATA_pList);
    HTMLDATA_currentListTable = generateDataTable(DATA_currentList);
    HTMLDATA_currentListFilteredTable = generateDataTable(DATA_currentListFiltered);
  }

  // 
  const SwalToast = (msg) => {
    if (typeof msg === "string") {
      Swal.fire({
        toast: true,
        title: msg,
        // position: "top-end",
        // showConfirmButton: false,
        // timer: 3000,
        // timerProgressBar: true,
        // didOpen: (toast) => {
        //   toast.onmouseenter = Swal.stopTimer;
        //   toast.onmouseleave = Swal.resumeTimer;
        // }
      });
    }
    return Swal.mixin({
      toast: true,
      // position: "top-end",
      // showConfirmButton: false,
      // timer: 3000,
      // timerProgressBar: true,
      // didOpen: (toast) => {
      //   toast.onmouseenter = Swal.stopTimer;
      //   toast.onmouseleave = Swal.resumeTimer;
      // }
    });
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


  // variables
  let start = false;
  const startBtn = document.getElementsByClassName("luckydraw-start-btn")[0];

  // luckywheel options
  let USE_PERCENTAGE = false;
  let USE_ONE_DATA_STYLE = false;
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
      SwalToast("No File uploaded Please upload file");
      return;
    }

    const file = fileInput.files[0];

    Swal.fire({
      title: "Loading Data",
      showConfirmButton: false,
      allowOutsideClick: false,
      allowEscapeKey: false,
      html: `
      <div>
        loading...
      </div>
      `
    })

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

          // Define header mappings with specific keywords
          const headerMapping = {
            text: {
              keys: ["TEXT", "NAMA", "NAME", "1"],
              suffixes: ["", "(Required)"] // Accept " (Required)" or no suffix
            },
            id: {
              keys: ["ID", "2"],
              suffixes: ["", "(Required)"] // Accept " (Required)" or no suffix
            },
            amount: {
              keys: ["JUMLAH", "AMOUNT", "COUNT", "3"],
              suffixes: ["(Optional)", "(Reserved)"] // Only accept " (Optional)" or " (Reserved}" suffix
            },
            percentage: {
              keys: ["PERSENTASE", "PERCENTAGE", "WEIGHT", "4"],
              suffixes: ["(Reserved)", "(Optional)"] // Only accept " (Optional)" or " (Reserved}" suffix
            },
          };

          // Function to match headers flexibly, based on keys and suffixes
          const matchHeader = (headerConfig, header) => {
            const { keys, suffixes } = headerConfig;
            return keys.some(keyword => {
              const suffixRegex = suffixes.length
                ? `(${suffixes.join('|').replace(/[()]/g, '\\$&')})`
                : ""; // Build regex for suffixes
              const regex = new RegExp(`^${keyword}${suffixRegex}?$`, 'i'); // Optional suffix
              return regex.test(header);
            });
          };

          const mapHeader = (headerConfig, dataRow) => {
            for (const key in dataRow) {
              if (matchHeader(headerConfig, key)) return dataRow[key];
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
              if (!Object.values(headerMapping).some(headerConfig => matchHeader(headerConfig, key))) {
                parsedRow[key] = value;
              }
              // if (!Object.values(headerMapping).flatMap(h => h.keys).some(header => matchHeader({ keys: [header], suffixes: [] }, key))) {
              //   parsedRow[key] = value;
              // }
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

        const fileData = dataL[0];

        const dataListJSON = JSON.stringify(fileData);
        localStorage.setItem(LS_PREFIX + "datalist", dataListJSON);
        localStorage.setItem(LS_PREFIX + "currentDatalist", dataListJSON);

        // save winnerlist to a backup
        const prevWinnerlist = localStorage.getItem(LS_PREFIX + "winnerlist");
        if (prevWinnerlist) {
          localStorage.setItem(LS_PREFIX + "winnerlist" + dayjs().locale("id").format("_DDMMYYYYHHmm"), prevWinnerlist);
          localStorage.removeItem(LS_PREFIX + "winnerlist");
        }

        initLuckyDraw(ev);
        ev.target.reset();
        Swal.close();
      } catch (error) {
        SwalToast("Error processing file! Please try again.");
        console.error("File processing error:", error);
      }
    };

    reader.onerror = function (event) {
      SwalToast("File could not be read! Try to upload again")
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
      allowOutsideClick: typeof localStorage.getItem(LS_PREFIX + "datalist") === "string",
      allowEscapeKey: typeof localStorage.getItem(LS_PREFIX + "datalist") === "string",
      html: `
        <form id="configForm">
          <div class="m-2 mb-2">
            <input type="file" class="form-control" name="datalist" id="datalist" accept=".xls, .xlsx, .csv">
            <p class="form-text">*Accept excel ( .xls | .xlsx ), or .csv file</p>
          </div>
          <div class="m-2 mb-4">
            <a class="form-text link-primary" href="./luckydraw-contohdata.xlsx?r=${Date.now()}" target="_blank">Download sample file here</a>
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
      SwalToast("Please upload file");
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

        // Define header mappings with specific keywords
        const headerMapping = {
          name: {
            keys: ["PRIZE", "NAMA", "NAME", "1"],
            suffixes: ["", "(Required)"] // Accept " (Required)" or no suffix
          },
          id: {
            keys: ["ID", "2"],
            suffixes: ["", "(Required)"] // Accept " (Required)" or no suffix
          },
          total: {
            keys: ["TOTAL", "JUMLAH", "JUMLAH PER SESI", "AMOUNT", "COUNT", "3"],
            suffixes: ["", "(Required)"]
          },
        };

        // Function to match headers flexibly, based on keys and suffixes
        const matchHeader = (headerConfig, header) => {
          const { keys, suffixes } = headerConfig;
          return keys.some(keyword => {
            const suffixRegex = suffixes.length
              ? `(${suffixes.join('|').replace(/[()]/g, '\\$&')})`
              : ""; // Build regex for suffixes
            const regex = new RegExp(`^${keyword}${suffixRegex}$`, 'i'); // Optional suffix
            return regex.test(header);
          });
        };

        const mapHeader = (headerConfig, dataRow) => {
          for (const key in dataRow) {
            if (matchHeader(headerConfig, key)) return dataRow[key];
          }
          return null;
        };

        // Parse rows dynamically
        const dataList = sheetDataList.map((row) => {
          // console.log(row);
          const parsedRow = {
            name: mapHeader(headerMapping.name, row),
            id: mapHeader(headerMapping.id, row),
            total: mapHeader(headerMapping.total, row) ?? 1,
          };

          // Add remaining columns dynamically
          for (const [key, value] of Object.entries(row)) {
            if (!Object.values(headerMapping).some(headerConfig => matchHeader(headerConfig, key))) {
              parsedRow[key] = value;
            }
            // if (!Object.values(headerMapping).flatMap(h => h.keys).some(header => matchHeader({ keys: [header], suffixes: [] }, key))) {
            //   parsedRow[key] = value;
            // }
          }

          return parsedRow;
        });

        dataL.push(dataList);
      });

      const fileData = dataL[0];

      const dataPrizeListJSON = JSON.stringify(fileData);
      localStorage.setItem(LS_PREFIX + "dataPrizelist", dataPrizeListJSON);

      initLuckyDraw(ev);
      ev.target.reset();
      Swal.close();
    };

    reader.onerror = function (event) {
      SwalToast("File could not be read! Try to upload again")
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
      allowOutsideClick: typeof localStorage.getItem(LS_PREFIX + "dataPrizelist") === "string",
      allowEscapeKey: typeof localStorage.getItem(LS_PREFIX + "dataPrizelist") === "string",
      html: `
        <form id="configPrizeForm">
          <div class="m-2 mb-2">
            <input type="file" class="form-control" name="prizelist" id="prizelist" accept=".xls, .xlsx, .csv">
            <p class="form-text">*Accept excel ( .xls | .xlsx ), or .csv file</p>
          </div>
          <div class="m-2 mb-4">
            <a class="form-text link-primary" href="./luckydraw-contohprizedata.xlsx?r=${Date.now()}" target="_blank">Download sample file here</a>
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
      text: "This will only delete result, not data list. Continue?",
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
        localStorage.removeItem(LS_PREFIX + "winnerlist");
        localStorage.removeItem(LS_PREFIX + "currentDatalist");
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
      text: "This will delete all data list and result. Continue?",
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

        Object.keys(localStorage).forEach((lsKey) => {
          if (lsKey.startsWith(LS_PREFIX + "winnerlist")) {
            localStorage.removeItem(lsKey);
          }
        })
        localStorage.removeItem(LS_PREFIX + "winnerlist");

        localStorage.removeItem(LS_PREFIX + "datalist");
        localStorage.removeItem(LS_PREFIX + "dataPrizelist");
        localStorage.removeItem(LS_PREFIX + "currentDatalist");
        // disable spin button
        startBtn.classList.add("disabled");
        console.log("all data removed");
        window.location.reload();
      }
    })
  })

  // see participant list
  const participantListBtn = document.querySelector("a[href='#participant-list']");

  participantListBtn.addEventListener("click", function (ev) {
    ev.preventDefault();

    // open left drawer
    Swal.fire({
      title: 'Data List',
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
                Current Data List
              </label>
            </div>
            <div class="form-check">
              <input class="form-check-input" type="radio" name="dataEntries" id="initialData">
              <label class="form-check-label" for="initialData">
                Initial Data List
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

    const wList = localStorage.getItem(LS_PREFIX + "winnerlist") !== null || typeof localStorage.getItem(LS_PREFIX + "winnerlist") === "string" ? JSON.parse(localStorage.getItem(LS_PREFIX + "winnerlist")) : [];


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
        theDataHeaderRow.innerHTML = `<tr><th class="text-center">Batch</th><th>Prize</th><th>Winners</th><th class="">Personal Number</th></tr>`;

        const tableBody = document.createElement("tbody");
        wList.length > 0 ? wList.forEach((w, idx) => {
          const rowItem = document.createElement("tr");
          rowItem.innerHTML = `<td class="text-center" rowspan="${w?.winners?.length}"><span class="sticky-col">${++idx}.</span></td><td>${w?.winners[0].prize}</td><td>1. ${w?.winners.map(item => `${item.text}`)[0] ?? w?.["1"] ?? ""}</td><td class="">${w?.winners[0]["Personal Number"] ?? ""}</td>`;
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
        <div class="d-flex gap-2 w-100 justify-content-around">
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

          // Define header mappings with specific keywords
          const headerMapping = {
            text: {
              keys: ["TEXT", "NAMA", "NAME", "1"],
              suffixes: ["", "(Required)"] // Accept " (Required)" or no suffix
            },
            id: {
              keys: ["ID", "2"],
              suffixes: ["", "(Required)"] // Accept " (Required)" or no suffix
            },
            amount: {
              keys: ["JUMLAH", "AMOUNT", "COUNT", "3"],
              suffixes: ["(Optional)", "(Reserved)"] // Only accept " (Optional)" or " (Reserved}" suffix
            },
            percentage: {
              keys: ["PERSENTASE", "PERCENTAGE", "WEIGHT", "4"],
              suffixes: ["(Optional)", "(Reserved)"] // Only accept " (Optional)" or " (Reserved}" suffix
            },
          };

          // Function to match headers flexibly, based on keys and suffixes
          const matchHeader = (headerConfig, header) => {
            const { keys, suffixes } = headerConfig;
            return keys.some(keyword => {
              const suffixRegex = suffixes.length
                ? `(${suffixes.join('|').replace(/[()]/g, '\\$&')})`
                : ""; // Build regex for suffixes
              const regex = new RegExp(`^${keyword}${suffixRegex}?$`, 'i'); // Optional suffix
              return regex.test(header);
            });
          };

          const mapHeader = (headerConfig, dataRow) => {
            for (const key in dataRow) {
              if (matchHeader(headerConfig, key)) return dataRow[key];
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
              if (!Object.values(headerMapping).some(headerConfig => matchHeader(headerConfig, key))) {
                parsedRow[key] = value;
              }
              // if (!Object.values(headerMapping).flatMap(h => h.keys).some(header => matchHeader({ keys: [header], suffixes: [] }, key))) {
              //   parsedRow[key] = value;
              // }
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

        const fileData = dataL[0];

        const dataListJSON = JSON.stringify(fileData);
        localStorage.setItem(LS_PREFIX + "datalist", dataListJSON);

        // save winnerlist to a backup
        const prevWinnerlist = localStorage.getItem(LS_PREFIX + "winnerlist");
        if (prevWinnerlist) {
          localStorage.setItem(LS_PREFIX + "winnerlist" + dayjs().locale("id").format("_DDMMYYYYHHmm"), prevWinnerlist);
          localStorage.removeItem(LS_PREFIX + "winnerlist");
        }

        startBtn.classList.remove("disabled");

        resolve(fileData);
      };

      xhr.open("GET", path);
      xhr.responseType = "arraybuffer";
      xhr.send();
    })
  }

  // at first website loading
  // load file from localStorage or load sample data in luckydraw-contohdata.xlsx
  function loadListNama(path = `./luckydraw-contohdata.xlsx?r=${Date.now()}`) {
    return new Promise(async function (resolve, reject) {

      startBtn.classList.add("disabled");

      // load from localStorage

      if (localStorage.getItem(LS_PREFIX + "datalist") !== null || typeof localStorage.getItem(LS_PREFIX + "datalist") === "string") {
        const currentDatalist = localStorage.getItem(LS_PREFIX + "currentDatalist");
        if (currentDatalist !== null || typeof currentDatalist === "string") {
          const data = JSON.parse(currentDatalist);
          startBtn.classList.remove("disabled");
          resolve(data);
        } else {
          const data = JSON.parse(localStorage.getItem(LS_PREFIX + "datalist"));

          if (data.length > 0) {
            startBtn.classList.remove("disabled");
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

    const options = getLS(LS_PREFIX + "options");

    console.log({ options })

    if (options) {
      USE_PERCENTAGE = options?.usePercentage || false;
      USE_ONE_DATA_STYLE = options?.useOneDataStyle || false;
      UPDATE_PERCENTAGE_FOLLOWING_AMOUNT = options?.updatePercentageFollowingAmount || false;
    }

    loadListNama(`./luckydraw-contohdata.xlsx?r=${Date.now()}`)
      .then(function (fileData) {
        // Use the file data
        localStorage.setItem(LS_PREFIX + "currentDatalist", JSON.stringify(fileData));

        if (fileData.length === 0 || fileData.every(p => p.amount === 0)) {
          startBtn.classList.add("disabled");
          // return;
        }

        // load prize list
        const prizeListStr = localStorage.getItem(LS_PREFIX + "dataPrizelist")
        if (prizeListStr !== null || typeof prizeListStr === "string") {
          const prizeList = JSON.parse(prizeListStr).flatMap(item => Array(item.total).fill(item.name));
          // reload prize list, remove winner list from container
          // show prize list
          const prizeContainer = document.getElementById("listContainer");
          const listHtml = prizeList.map((prize, idx) => {
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
          SwalToast("Please upload prize list");
          // Swal.fire({
          //   title: "Please upload prize list",
          //   text: "",
          //   icon: "error",
          //   position: "top",
          //   customClass: {
          //     confirmButton: "btn btn-primary",
          //   },
          //   buttonsStyling: false,
          //   didDestroy: () => {
          //     uploadPrizeBtn.click();
          //   }
          // })
          // return;
        }

        // const cancelstartBtn = document.getElementById("cancelstartBtn");

        // 
        resyncEntries();

        // main luckydraw on click

        startBtn.addEventListener("click", startRandoming);

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

  // Randomize and pick names
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
        const { name: prizeName, id: prizeID, ...prizeData } = prize; // Assign the prize
        winner.prize = prizeName; // Assign the prize
        winner.prizeID = prizeID; // Assign the prize
        // winner = { ...winner, ...prizeData }; // Assign the prize
        winner.amount--; // Decrease the amount of entries left for the winner
        pickedWinners.push({ ...winner, ...prizeData }); // Store the winner
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
    const targetTexts = winners.map(winner => winner.text + "_" + winner["Personal Number"])

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
      letters: "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_0123456789",
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

    const options = getLS(LS_PREFIX + "options");

    const duration = options?.randomingDuration ? parseFloat(options.randomingDuration) * 1000 : 6000;

    console.log(duration);

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