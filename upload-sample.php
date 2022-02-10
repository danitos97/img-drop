<?php 
    $images = $_FILES["images"];
    $nImgs = count($images["name"]);
    $time = time();
    for($i = 0; $i < $nImgs; ++$i){
        $tmp = $images["tmp_name"][$i];
        $name = $time."-".rand().".jpg";
        move_uploaded_file($tmp, "images/$name");
    }
?>