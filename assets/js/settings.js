// configuration for web

// title (done)

// theme
// * nd (done)
// * logo (done)
// * color theme
// * start button name

// data
// * num of fields showed
// * field 1 (mandatory)
// * field 2 (mandatory)
// * n fields

// panel
// * theme panel (done)
// * data panel
// * winner panel

(function () {

  function formatBytes(bytes, decimals = 2, k = 1024, sizes) {
    if (!+bytes) return '0 Bytes';

    decimals = decimals < 0 ? 2 : decimals;
    sizes ??= ['Bytes', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(decimals))} ${sizes[i]}`;
  }

  /**
   * Parse a formatted bytes size to a bytes number
   * 
   * @param {string} formattedSize - example: 1 MiB
   * @param {number} k - default 1024 for kibibytes, 1000 for kilobytes
   * @param {Array<string>} sizes - array of string from Bytes, KiB, MiB, ....
   * @returns {number} - bytes in number
   */
  function parseFormattedSize(formattedSize, k = 1024, sizes) {
    const sizeParts = formattedSize.split(' ');

    sizes ??= ['Bytes', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB'];

    const i = sizes.indexOf(sizeParts[1]);
    if (i === -1) return -1;

    const bytes = parseFloat(sizeParts[0]) * Math.pow(k, i);
    return bytes;
  }

  /**
   * Function to resize or crop image from file input object or blob object 
   * based on maximum width or height specified
   * 
   * @param {File | Blob} fileObj - a file object from file input or a blob object
   * @param {number} [maxSize=256] - maximum pixel for width or height
   * @param {Object} [opts] - options for resizing
   * @param {number} [opts.imgQuality=1] - resize quality
   * @param {string} [opts.mimeType="image/jpeg"] - mime type result
   * @param {boolean} [opts.cropImg=false] - crop and centered img or not
   * @param {("blob" | "dataURL" | "canvas")} [opts.returnType="blob"] - type of return
   * @return {(Promise<Blob> | HTMLCanvasElement | string)} return promise resulting in blob or a canvas element or a dataURL, based on returnType options
  */
  const resizeImage = async (fileObj, maxSize, opts) => {
    const imgQuality = opts?.imgQuality || 1;
    const mimeType = opts?.mimeType || fileObj?.type || "image/jpeg";
    const cropImg = opts?.cropImg || false;
    const returnType = opts?.returnType || "blob";

    const canvas = document.createElement('canvas');

    const bitmap = await createImageBitmap(fileObj);
    const { width, height } = bitmap;

    if (maxSize === null) {
      maxSize = width > height ? width : height;
    } else if (isNaN(parseInt(maxSize))) {
      maxSize = 256;
    }

    let destWidth = 0;
    let destHeight = 0;

    if (cropImg) {
      const ratio = Math.min(maxSize / width, maxSize / height);

      destWidth = width * ratio;
      destHeight = height * ratio;

      canvas.width = maxSize;
      canvas.height = maxSize;

    } else {
      destWidth = width >= height ? maxSize : maxSize * (width / height);
      destHeight = height >= width ? maxSize : maxSize * (height / width);

      canvas.width = destWidth;
      canvas.height = destHeight;
    }

    const x = cropImg ? (maxSize - (destWidth)) / 2 : 0;
    const y = cropImg ? (maxSize - (destHeight)) / 2 : 0;

    canvas.getContext("2d").drawImage(bitmap, 0, 0, width, height, x, y, destWidth, destHeight);

    switch (returnType) {
      case "canvas":
        return canvas;
      case "dataURL":
        return canvas.toDataURL(mimeType, imgQuality);
      case "blob":
      default:
        return new Promise(resolve => {
          canvas.toBlob(blob => { resolve(blob); }, mimeType, imgQuality);
        })
    }
  }

  /**
   * Resize image with maximum file size.
   * A recursive function wrapper for resizeImage() function
   * 
   * @param {number} maxFileSize - maximum file size in bytes
   * @param {File | Blob} fileObj - a file object from file input or a blob object
   * @param {number} [maxSize=1280] - maximum pixel size of width or height for image
   * @param {Object} [opts] - options for resizing
   * @returns {Promise<Blob>} - Promise of type Blob
   */
  const withMaxFileSize = async (maxFileSize, fileObj, maxSize, opts) => {
    opts.returnType = "blob";
    const result = await resizeImage(fileObj, maxSize, opts);
    if (result instanceof Blob) {
      if (result.size > maxFileSize) {
        let newMaxSize = maxSize;
        if (opts?.imgQuality && opts.imgQuality > 0.7) {
          opts.imgQuality = opts.imgQuality - 0.1;
        } else if (!opts?.imgQuality) {
          opts.imgQuality = 0.9;
        } else {
          newMaxSize = maxSize * 3 / 4;
        }
        return await withMaxFileSize(maxFileSize, fileObj, newMaxSize, opts);
      }
    }

    return result;
  }

  // settings panel script

  const settingsBtn = document.querySelector(`a[href="#settings"]`);
  const settingsPanel = document.getElementsByClassName("settings")[0];
  const settingsForm = document.getElementById("settingsForm");
  const saveSettingsBtn = document.getElementById("saveSettingsBtn");
  const cancelSettingsBtn = document.getElementById("cancelSettingsBtn");
  const defaultSettingsBtn = document.getElementById("defaultSettingsBtn");
  const closeSettingsBtn = document.getElementById("closeSettingsBtn");
  const textFontSizeInput = document.getElementById("textFontSize");

  const imageFile = { ["event-logo"]: null, background: null };
  const blobs = [];
  let useDefaultImg = false;

  const revokeBlobs = () => { blobs.length > 0 && blobs.forEach(blob => URL.revokeObjectURL(blob)); };

  const cleanImageFiles = () => { Object.keys(imageFile).forEach(key => imageFile[key] = null); };

  settingsBtn.addEventListener("click", (ev) => {
    ev.preventDefault();

    // hide navigation if opened
    const navToggler = document.getElementsByClassName("navbar-toggler")[0];
    if (navToggler.clientHeight > 0 && navToggler.ariaExpanded === "true") {
      navToggler.click();
    }

    if (settingsPanel.classList.contains("show")) {
      settingsPanel.classList.remove("show");
      settingsForm.setAttribute("inert", "inert");
    } else {
      datasetPanel.classList.remove("show");
      settingsPanel.classList.add("show");
      settingsForm.removeAttribute("inert");
    }
  })

  const logoInput = document.getElementById("logoImage");

  logoInput.addEventListener("change", async (ev) => {
    if (!(ev.target?.files && ev.target.files.length > 0)) {
      if (imageFile["event-logo"]) {
        const filesContainer = new DataTransfer();
        filesContainer.items.add(imageFile["event-logo"]);
        ev.target.files = filesContainer.files;
      }
      return;
    };

    const uploadedLogo = ev.target.files[0];

    if (!uploadedLogo.type.startsWith("image/")) {
      Swal.fire({
        title: "Please provide an Image File",
        icon: "error",
        position: "top-end",
        customClass: {
          confirmButton: "btn btn-primary",
        },
        buttonsStyling: false,
      })
      return false;
    }

    const mimeType = "image/png";

    const logoBlob = await resizeImage(uploadedLogo, 512, { mimeType });
    imageFile["event-logo"] = new File([logoBlob], uploadedLogo.name, { type: mimeType, lastModified: uploadedLogo.lastModified });

    const logoPreview = document.getElementById("logoImagePreview");

    logoPreview.src = URL.createObjectURL(imageFile["event-logo"]);

    blobs.push(logoPreview.src);
  });

  const backgroundInput = document.getElementById("backgroundImage");

  backgroundInput.addEventListener("change", async (ev) => {
    if (!(ev.target?.files && ev.target.files.length > 0)) {
      if (imageFile.background) {
        const filesContainer = new DataTransfer();
        filesContainer.items.add(imageFile.background);
        ev.target.files = filesContainer.files;
      }
      return;
    };

    const uploadedBackground = ev.target.files[0];

    if (!uploadedBackground.type.startsWith("image/")) {
      Swal.fire({
        title: "Please provide an Image File",
        icon: "error",
        position: "top-end",
        customClass: {
          confirmButton: "btn btn-primary",
        },
        buttonsStyling: false,
      })
      return false;
    }

    mimeType = "image/jpeg";

    const backgroundBlob = await withMaxFileSize(parseFormattedSize("1 MB", 1000, ["Bytes", "KB", "MB"]), uploadedBackground, 1280, { mimeType });
    imageFile.background = new File([backgroundBlob], uploadedBackground.name, { type: mimeType, lastModified: uploadedBackground.lastModified });

    const backgroundPreview = document.getElementById("backgroundImagePreview");

    backgroundPreview.src = URL.createObjectURL(imageFile.background);

    blobs.push(backgroundPreview.src);
  });

  // change font size on input change
  textFontSizeInput.addEventListener("change", (ev) => {
    console.log(ev.target)
    console.log(ev.target.value)
  })

  saveSettingsBtn.addEventListener("click", (ev) => {
    // prevent click other than mouse or touch
    if (ev.pointerType != "mouse" && ev.pointerType != "touch") {
      ev.preventDefault();
      return false;
    }
  })

  window.formSubmitEv = [];

  settingsForm.addEventListener("submit", async (ev) => {
    ev.preventDefault();
    formSubmitEv.push(ev);

    saveSettingsBtn.setAttribute("disabled", "disabled");
    saveSettingsBtn.childNodes[0].textContent = "Saving";
    saveSettingsBtn.childNodes[1].style.width = "24px";

    let eventTitle, logoImageSrc, backgroundImageSrc, randomingDuration, usePercentage;

    eventTitle = ev.target.eventTitle.value;
    randomingDuration = ev.target.randomingDuration.value + "s";
    textFontSize = ev.target.textFontSize.value + "px";
    usePercentage = ev.target.usePercentage.checked;

    const saveImg = async () => {

      // post to save image
      const url = "./api/save_image.php";
      const method = "POST";

      const settingsData = new FormData();

      Object.keys(imageFile).filter(k => imageFile[k] != null).forEach(key => {
        settingsData.append(key, imageFile[key], key);
      });

      try {
        const res = await fetch(url, { method, body: settingsData });
        const uploadResponse = await res.json();

        if (res.ok && uploadResponse.success) {
          applyNew();
          return true;
        } else {
          console.error(uploadResponse?.message);
          throw new Error("Upload Failed");
        }
      } catch (err) {
        console.error(err.message);
        Swal.fire({
          title: "Something error",
          icon: "error",
          position: "top-end",
          customClass: {
            confirmButton: "btn btn-primary",
          },
          buttonsStyling: false,
        });
        return false;
      }
    }

    const copyImg = async () => {

      const url = "./api/copy_default_img.php";
      const method = "POST";
      const headers = new Headers({
        "Content-Type": "application/json",
      })

      // file path relative to api file
      const copyData = {
        filesToCopy: [
          {
            targetPath: "../assets/img/event-logo.png",
            destinationPath: "../assets/img/custom-event-logo.png",
          },
          {
            targetPath: "../assets/img/background.jpg",
            destinationPath: "../assets/img/custom-background.jpg",
          },
        ]
      }

      try {
        const res = await fetch(url, { method, body: JSON.stringify(copyData), headers });
        const copyImgResponse = await res.json();

        if (res.ok && copyImgResponse.success) {

          // apply title
          eventTitle = "Lucky Draw Spin Wheel";
          applyNew();

          useDefaultImg = false;

          return true;
        } else {
          console.error(copyImgResponse?.message);
          throw new Error("Copy Default Image Failed");
        }
      } catch (err) {
        console.error(err.message);
        Swal.fire({
          title: "Something error",
          icon: "error",
          position: "top-end",
          customClass: {
            confirmButton: "btn btn-primary",
          },
          buttonsStyling: false,
        });
        return false;
      }
    }

    const applyNew = () => {
      // apply title
      document.getElementsByTagName("title")[0].textContent = eventTitle;
      // apply logo 
      logoImageSrc = `./assets/img/custom-event-logo.png?r=${new Date().getTime()}`;
      document.getElementsByClassName("event-logo")[0].children[0].src = logoImageSrc;
      // apply background
      backgroundImageSrc = `./assets/img/custom-background.jpg?r=${new Date().getTime()}`;
      document.getElementsByClassName("bg")[0].style.backgroundImage = `url(${backgroundImageSrc}), var(--bg-default-gradient)`;

      // set randoming duration
      // document.getElementsByClassName("lucky-draw-container")[0].style.setProperty("--transition-duration", randomingDuration);

      // set font size
      document.getElementById("listContainer").style.setProperty("--winner-item-font-size", textFontSize);

      // set options
      setLS("options", {
        textFontSize,
        usePercentage,
      });

      // redraw canvas
      // window.initLuckyWheel();
    }

    console.log(randomingDuration);

    if (useDefaultImg) {
      await copyImg();
    } else {
      if (Object.keys(imageFile).some(key => Boolean(imageFile[key]))) {
        await saveImg();
      } else {
        // applyNew alternative

        // apply non image input
        document.getElementsByTagName("title")[0].textContent = eventTitle;

        console.log(randomingDuration);
        // document.getElementsByClassName("lucky-draw-container")[0].style.setProperty("--transition-duration", randomingDuration);

        // set font size
        document.getElementById("listContainer").style.setProperty("--winner-item-font-size", textFontSize);

        // set options
        setLS("options", {
          textFontSize,
          usePercentage,
        });

        // redraw canvas
        // window.initLuckyWheel();
      }
    }

    settingsForm.reset();
    setSettingsValue({ eventTitle, logoImageSrc, backgroundImageSrc, randomingDuration, textFontSize });
    settingsPanel.classList.remove("show");
    // disable form
    settingsForm.setAttribute("inert", "inert");

    saveSettingsBtn.childNodes[1].style.width = 0;
    saveSettingsBtn.removeAttribute("disabled");
    saveSettingsBtn.childNodes[0].textContent = "Save";

  })

  // default options
  const defaultSettingsOpts = {
    title: "Lucky Draw - Spin Wheel",
    logo: "./assets/img/event-logo.png",
    background: "./assets/img/background.jpg",
    randomingDuration: 6,
    textFontSize: 14,
    usePercentage: false,
  }

  /**
   * reset form to default settings value
   */
  const defaultSettingsValue = () => {

    // title
    settingsForm.querySelector("#eventTitle").value = "Lucky Draw - Spin Wheel";
    // logoImage
    const defaultLogo = "./assets/img/event-logo.png";
    document.getElementById("logoImagePreview").src = "./assets/img/event-logo.png";
    // backgroundImage
    const defaultBackground = "./assets/img/background.jpg";
    document.getElementById("backgroundImagePreview").src = "./assets/img/background.jpg";
    // get randoming duration
    // randomingDuration
    // randomingDuration ??= getComputedStyle(document.getElementsByClassName("lucky-draw-container")[0]).getPropertyValue("--transition-duration");
    randomingDuration = "6";
    settingsForm.querySelector("#randomingDuration").value = 6;

    // remove added var (instead will use root var value)
    document.getElementById("listContainer").style.removeProperty("--winner-item-font-size");
    settingsForm.querySelector("#textFontSize").value = 14;

    // usePercentage
    document.getElementById("usePercentage").checked = false;

    // clean up blobs and image files
    revokeBlobs();
    cleanImageFiles();

    // fetch default for input value
    [
      ["event-logo", defaultLogo, "logoImage",],
      ["background", defaultBackground, "backgroundImage",],
    ].forEach(vals => {
      (async (key, srcImage, inputID) => {
        try {
          const ext = srcImage.split(".").pop();
          const imageType = ext === "jpg" ? "image/jpeg" : "image/png";
          const res = await fetch(srcImage);
          if (res.ok) {
            const blob = res.blob();
            const file = new File([blob], `default-${inputID.replace("Image", "")}.${ext}`, { type: imageType });
            const filesContainer = new DataTransfer();
            filesContainer.items.add(file);
            document.getElementById(inputID).files = filesContainer.files;

            useDefaultImg = true;
          }
        } catch (err) {
          console.error(err.message);
        }
      })(...vals);
    });
  }

  /**
   * set form to new value or initial settings value 
   */
  const setSettingsValue = ({
    eventTitle,
    logoImageSrc,
    backgroundImageSrc,
    randomingDuration,
    textFontSize,
    usePercentage,
  } = {}) => {
    // title
    eventTitle ??= document.getElementsByTagName("title")[0].textContent;
    settingsForm.querySelector("#eventTitle").value = eventTitle || document.getElementsByTagName("title")[0].textContent;
    // logoImage
    logoImageSrc ??= "./assets/img/custom-event-logo.png";
    document.getElementById("logoImagePreview").src = logoImageSrc;
    // backgroundImage
    backgroundImageSrc ??= "./assets/img/custom-background.jpg";
    document.getElementById("backgroundImagePreview").src = backgroundImageSrc;
    // get randoming duration
    // // randomingDuration
    // randomingDuration ??= getComputedStyle(document.getElementsByClassName("lucky-draw-container")[0]).getPropertyValue("--transition-duration");
    randomingDuration = "6";
    settingsForm.querySelector("#randomingDuration").value = randomingDuration.replace("s", "");

    // set text font size value
    textFontSize = "14";
    settingsForm.querySelector("#textFontSize").value = textFontSize?.replace("px", "");

    // load from localstorage or from params, or from default
    const options = getLS("options");
    // usePercentage
    document.getElementById("usePercentage").checked = options?.usePercentage || usePercentage || defaultSettingsOpts.usePercentage;

    // clean up blobs and image files
    revokeBlobs();
    cleanImageFiles();
  }

  closeSettingsBtn.addEventListener("click", (ev) => {
    ev.preventDefault();
    settingsPanel.classList.remove("show");
    // disable form
    settingsForm.setAttribute("inert", "inert");
  })

  cancelSettingsBtn.addEventListener("click", (ev) => {
    // prevent click other than mouse or touch
    if (ev.pointerType != "mouse" && ev.pointerType != "touch") {
      ev.preventDefault();
      return false;
    }
    ev.preventDefault();
    settingsPanel.classList.remove("show");
    // disable form
    settingsForm.setAttribute("inert", "inert");
    settingsForm.reset();
    setSettingsValue();
  })

  defaultSettingsBtn.addEventListener("click", (ev) => {
    // prevent click other than mouse or touch
    if (ev.pointerType != "mouse" && ev.pointerType != "touch") {
      ev.preventDefault();
      return false;
    }
    ev.preventDefault();
    settingsForm.reset();
    defaultSettingsValue();
  })

  // reset at first run
  setSettingsValue();

  // dataset panel
  const datasetBtn = document.querySelector(`a[href="#dataset"]`);
  const datasetPanel = document.getElementsByClassName("dataset")[0];
  const datasetForm = document.getElementById("datasetForm");
  const saveDatasetBtn = document.getElementById("saveDatasetBtn");
  const cancelDatasetBtn = document.getElementById("cancelDatasetBtn");
  const defaultDatasetBtn = document.getElementById("defaultDatasetBtn");
  const closeDatasetBtn = document.getElementById("closeDatasetBtn");

  datasetBtn?.addEventListener("click", (ev) => {
    ev.preventDefault();

    // hide navigation if opened
    const navToggler = document.getElementsByClassName("navbar-toggler")[0];
    if (navToggler.clientHeight > 0 && navToggler.ariaExpanded === "true") {
      navToggler.click();
    }


    if (datasetPanel.classList.contains("show")) {
      datasetPanel.classList.remove("show");
      datasetForm.setAttribute("inert", "inert");
    } else {
      // set input data to current
      setDatasetValue();
      settingsPanel.classList.remove("show");
      datasetPanel.classList.add("show");
      datasetForm.removeAttribute("inert");
    }
  })

  datasetForm.addEventListener("submit", async (ev) => {
    ev.preventDefault();
    console.log("form submit event: ", ev);
    formSubmitEv.push(ev);

    saveDatasetBtn.setAttribute("disabled", "disabled");
    saveDatasetBtn.childNodes[0].textContent = "Saving";
    saveDatasetBtn.childNodes[1].style.width = "24px";

    let datasetEntries

    datasetEntries = ev.target.textarea.value;

    let currentDatalist = localStorage.getItem("currentDatalist");

    if (currentDatalist !== null || typeof currentDatalist === "string") {
      currentDatalist = JSON.parse(currentDatalist);
    }



    datasetForm.reset();
    // setValue({ eventTitle, logoImageSrc, backgroundImageSrc });
    datasetPanel.classList.remove("show");
    // disable form
    datasetForm.setAttribute("inert", "inert");

    saveDatasetBtn.childNodes[1].style.width = 0;
    saveDatasetBtn.removeAttribute("disabled");
    saveDatasetBtn.childNodes[0].textContent = "Save";

  })

  const getDatasetTextEntries = (datasetEntries) => {
    return datasetEntries?.map(entry => {
      return entry.text;
    }) ?? [];
  }

  const setDatasetValue = (datasetEntries) => {
    let currentDatalist = localStorage.getItem("currentDatalist");

    if (currentDatalist !== null || typeof currentDatalist === "string") {
      currentDatalist = JSON.parse(currentDatalist);
    }
    currentDatalist = getDatasetTextEntries(currentDatalist);
    document.getElementById("entries").value = datasetEntries || currentDatalist.join("\n");
  }

  const defaultDatasetValue = () => {
    let currentDatalist = localStorage.getItem("currentDatalist");

    if (currentDatalist !== null || typeof currentDatalist === "string") {
      currentDatalist = JSON.parse(currentDatalist);
    }
    document.getElementById("entries").value = getDatasetTextEntries(currentDatalist).join("\n");
  }

  closeDatasetBtn.addEventListener("click", (ev) => {
    ev.preventDefault();
    datasetPanel.classList.remove("show");
    // disable form
    datasetForm.setAttribute("inert", "inert");
  })

  cancelDatasetBtn.addEventListener("click", (ev) => {
    // prevent click other than mouse or touch
    if (ev.pointerType != "mouse" && ev.pointerType != "touch") {
      ev.preventDefault();
      return false;
    }
    ev.preventDefault();
    datasetPanel.classList.remove("show");
    // disable form
    datasetForm.setAttribute("inert", "inert");
    datasetForm.reset();
    setDatasetValue();
  })

  defaultDatasetBtn.addEventListener("click", (ev) => {
    // prevent click other than mouse or touch
    if (ev.pointerType != "mouse" && ev.pointerType != "touch") {
      ev.preventDefault();
      return false;
    }
    ev.preventDefault();
    datasetForm.reset();
    defaultDatasetValue();
  })

  // reset on first run
  setDatasetValue();

})();

// apply fetched localStorage to input form

// apply fetched localStorage to system

// apply default to input form