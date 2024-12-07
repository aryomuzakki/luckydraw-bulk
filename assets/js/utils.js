/**
 * check if var is object
 * @param {any} obj 
 * @returns Boolean
 */
const isObject = (obj) => (obj ?? false)?.constructor?.name === "Object";

// get localStorage
const getLS = (key, { raw = false } = {}) => {
  const ls = localStorage.getItem(key);
  if (raw) return ls;
  if (ls !== null) {
    try {
      return JSON.parse(ls);
    } catch (err) {
      console.error(err.message);
    }
  }
  return null;
}

// set localStorage
const setLS = (key, value, { raw = false, mode = "soft" } = {}) => {
  let newVal = value;
  if (!raw) {
    if (isObject(value) || Array.isArray(value)) {
      newVal = JSON.stringify(value);
    }
    const oldVal = localStorage.getItem(key);
    if (oldVal !== null) {
      if (mode === "abort") {
        throw new Error("data for this key already exist");
      } else if (mode === "soft") {
        localStorage.setItem(`old_${key}`, oldVal);
      }
    }
  }
  if (["hard", "soft", "abort"].includes(mode)) {
    localStorage.setItem(key, newVal);
  } else {
    throw new Error("mode doesn't exist");
  }
}


// Fetch or initialize data from localStorage
function getLocalStorage(key, defaultValue) {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : defaultValue;
}

function setLocalStorage(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}