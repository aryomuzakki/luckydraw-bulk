<?php

// save file from post request

// if request exist
// if method is post
// if body exist
// check upload data
// validate file type
// set file path
// set file name
// set file extension
// save and overwrite file

ob_start();

function logMsg($message, $key = null)
{
  if (is_string($message)) {
    echo "\n$message\n";
  } else {
    echo "\n";
    var_dump($message);
    echo "\n";
  }
}

function saveImage($fieldName)
{
  try {
    // Undefined | Multiple Files | $_FILES Corruption Attack
    // If this request falls under any of them, treat it invalid.
    if (
      !isset($_FILES[$fieldName]['error']) ||
      is_array($_FILES[$fieldName]['error'])
    ) {
      // logMsg($_FILES[$fieldName]['error']);
      // logMsg("invalid parameters");
      // throw new RuntimeException('Invalid parameters.');
      return false;
    }

    // logMsg($_FILES[$fieldName]['error']);

    // Check $_FILES[$fieldName]['error'] value.
    switch ($_FILES[$fieldName]['error']) {
      case UPLOAD_ERR_OK:
        break;
      case UPLOAD_ERR_NO_FILE:
        throw new RuntimeException('No file sent.');
      case UPLOAD_ERR_INI_SIZE:
      case UPLOAD_ERR_FORM_SIZE:
        throw new RuntimeException('Exceeded filesize limit.' . $_FILES[$fieldName]['size']);
      default:
        throw new RuntimeException('Unknown errors.');
    }

    // logMsg("no default error");

    // logMsg($_FILES[$fieldName]['size']);

    // You should also check filesize here. 
    if ($_FILES[$fieldName]['size'] > 1000000) {
      // logMsg("exceed file limit");
      throw new RuntimeException('Exceeded filesize limit.' . $_FILES[$fieldName]['size']);
    }

    // DO NOT TRUST $_FILES[$fieldName]['mime'] VALUE !!
    // Check MIME Type by yourself.
    $finfo = new finfo(FILEINFO_MIME_TYPE);
    // logMsg($finfo->file($_FILES[$fieldName]['tmp_name']));
    if (false === $ext = array_search(
      $finfo->file($_FILES[$fieldName]['tmp_name']),
      array(
        'jpg' => 'image/jpeg',
        'png' => 'image/png',
      ),
      true
    )) {
      // logMsg("invalid file type");
      throw new RuntimeException('Invalid file format.');
    }

    // logMsg($ext);

    $fullFileNamePath = '../assets/img/custom-' . $fieldName . "." . $ext;

    // You should name it uniquely.
    // DO NOT USE $_FILES[$fieldName]['name'] WITHOUT ANY VALIDATION !!
    // On this example, obtain safe unique name from its binary data.
    if (!move_uploaded_file($_FILES[$fieldName]['tmp_name'], $fullFileNamePath)) {
      throw new RuntimeException('Failed to move uploaded file.');
    }

    return true;
  } catch (RuntimeException $e) {
    // logMsg($e->getMessage());

    // return false;
    // return $e->getMessage();
    throw new RuntimeException($e->getMessage());
  }
}

// start processing
$data = [];
$data["log"] = [];

if ($_SERVER["REQUEST_METHOD"] === "POST") {
  // logMsg($_FILES);

  logMsg(__DIR__);

  if (count($_FILES) === 0) {
    // logMsg("no file");
  }
  try {
    saveImage("event-logo");
    saveImage("background");

    $data["success"] = true;
  } catch (Throwable $err) {
    $data["success"] = false;
    $data["message"] = $err->getMessage();
  }
} else {
  $data["success"] = false;
}

$data["logData"] = ob_get_clean();

header('Content-Type: application/json');
http_response_code(201);

echo json_encode($data);
exit();
