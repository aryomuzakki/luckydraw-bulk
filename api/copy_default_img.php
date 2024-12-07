<?php
ob_start();

// start processing
$data = [];

if ($_SERVER["REQUEST_METHOD"] === "POST") {
  $body = file_get_contents("php://input");
  $copyData = json_decode($body);

  $flag = [];

  if (is_null($copyData)) {
    $data["success"] = false;
  } else {
    foreach ($copyData->filesToCopy as $key => $value) {
      if (file_exists($value->targetPath)) {
        $flag[$key] = true;
      } else {
        $flag[$key] = false;
        break;
      }
    }

    if (in_array(false, $flag, true)) {
      $data["success"] = false;
      $data["message"] = "File Not Exists";
    } else {
      foreach ($copyData->filesToCopy as $key => $value) {
        if (copy($value->targetPath, $value->destinationPath)) {
          $data["success"] = true;
        } else {
          $data["success"] = false;
          $data["message"] = "Failed to Copy File";
          break;
        }
      }
    }
  }
}

$data["logData"] = ob_get_clean();

header('Content-Type: application/json');
http_response_code(201);
echo json_encode($data);
exit();
