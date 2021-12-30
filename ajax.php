<?php 

if(!isset($_POST["opcion"])) exit;

session_start();

require_once "config.php";

$linkCS = conectar("cs_nuevo");

switch($_POST["opcion"]){
    case "login": 

        if(!isset($_POST["user"]) || !isset($_POST["pass"])) exit;

        $user = c($_POST["user"]);
        $pass = c($_POST["pass"]);
        $sql = "SELECT * from usuarios where usuario = '$user'";
        $res = $linkCS -> query($sql);
        if($res -> num_rows == 0)
            echo "Usuario incorrecto";
        else{
            $res = $res -> fetch_assoc();
            if(password_verify($pass,$res["contra"])){
                $_SESSION["cs_id_user"] = $res["id"];
                $extra = explode(' ',$res["nombre"])[0]. " inició sesión";
                registrar($linkCS,1,$res["id"],0,$extra);
                echo "correcto";
            }
            else echo "Contraseña incorrecta";
            
        }
        break;


    case "subirNota":

        if(!isset($_POST["titulo"]) || !isset($_POST["texto"])) exit;
        

        $imagen = isset($_FILES["imagen"])? $_FILES["imagen"] : false; 
        
        $timestamp = date("Y-m-d H:i:s");
        $ruta = "../img/notas/";
        $rutaInicial = $ruta;

        $idNota = $_POST["idNota"];
        $titulo = str_replace("'","''",$_POST["titulo"]);
        $contenido = str_replace("'","''",$_POST["texto"]);
        $categoria = $_POST["categoria"];
        $fechaEspecial = $_POST["fechaEspecial"];
        $imgPrePercent = $_POST["imgPrePercent"];
        $sitioPrincipal = $_POST["sitioPrincipal"] == "true"? 1 : 0;
        if($fechaEspecial == "")
            $fechaPublicacion = "1000-01-01 00:00:00";
        else $fechaPublicacion = str_replace("T"," ",$fechaEspecial).":00";
        if(isset($_SESSION["cs_id_user"]))
            $idUser = $_SESSION["cs_id_user"];
        else $idUser = 0;
        $url = "";
        if($idNota == "null"){
            $year = date("Y");
            $mes = date("m");
            $dia = date("d");
            $fechaCreacion = $timestamp;
           
            $sql = "INSERT INTO `notas`(`titulo`,`contenido`,`estado`,`creadaPor`,`fechaCreacion`,
                `fechaPublicacion`,`ultimaEdicion`,`categoria`,`sitioPrincipal`) values ('$titulo','$contenido',
                'borrador',$idUser,'$fechaCreacion','$fechaPublicacion','$timestamp',$categoria,$sitioPrincipal)"; 
            // echo $sql;
            $linkCS -> query($sql);
            // echo $linkCS->error;
            $idNota = $linkCS -> insert_id;

            $key = "2bff3d36e91a7c1ff937d3b30020777c95619";

            $url = "https://www.tepatitlan.gob.mx/comunicacion/nota.php?idNota=".$idNota;
            

            $url = urlencode($url);

            $json = curl_get_contents("https://cutt.ly/api/api.php?key=$key&short=$url&name=");
            //$json = file_get_contents("https://cutt.ly/api/api.php?key=$key&short=$url&name=");
            $json = json_decode($json, true);
            //$url = json_encode($json);
            if($json["url"]["status"] == 7){
                //Doble Salto
                // $redirect = "https://tepaemprende.com/redirect/?u=";
                // $url = urlencode($redirect.$json["url"]["shortLink"]);

                // $json = file_get_contents("https://cutt.ly/api/api.php?key=$key&short=$url&name=");
                // $json = json_decode($json, true);
                // if($json["url"]["status"] == 7){

                    $url = $json["url"]["shortLink"];
                    $sql = "UPDATE `notas` SET  `urlRecortado` = '$url' WHERE id = $idNota";
                    $linkCS -> query($sql);
                // }
                // else $url = $json["url"]["status"];
            }

            $extra = "Se creó un borrador con el titulo: $titulo";
            registrar($linkCS, 2, $idUser, $idNota, $extra);

        }
        else{
            
            $sql = "SELECT fechaCreacion from notas where id = $idNota";
            $res = $linkCS -> query($sql);
            $fecha = $res -> fetch_assoc();
            $fechaCreacion = $fecha["fechaCreacion"];
            $fechaCreacion = explode(" ",$fechaCreacion)[0];
            $rutaCarpeta = "../img/notas/".str_replace("-","/",$fechaCreacion)."/$idNota";
            
            if(is_dir($rutaCarpeta)){
                $files = glob($rutaCarpeta.'/*'); 
                foreach($files as $file) 
                    if(is_file($file)){
                        if(strpos($file,"large") !== false && $imgPrePercent == "-1"){}
                        else{ unlink($file); }
                    }            
            }
            
            $segFecha = explode("-",$fechaCreacion);
            $year = $segFecha[0];
            $mes =  $segFecha[1];
            $dia =  $segFecha[2];
            $sql = "UPDATE `notas` SET `titulo` = '$titulo', `contenido` = '$contenido', `estado` = 'borrador',
                `creadaPor` = $idUser, `fechaPublicacion` = '$fechaPublicacion', `ultimaEdicion` = '$timestamp',
                `categoria` = $categoria, `sitioPrincipal` = $sitioPrincipal WHERE id = $idNota";
            $extra = $sql;
            $linkCS -> query($sql);

            $sql = "UPDATE `imagenes` SET `estado` = 'eliminada' where idNota = $idNota";
            $linkCS -> query($sql);

            $extra = "Se edito un borrador con el titulo: $titulo";
            registrar($linkCS, 3, $idUser, $idNota, $extra);

        }
        if($imagen){
            $imgPrincipal = $_POST["imgPrincipal"];
            
            $ruta .= $year."/";
            crearCarpeta($ruta);
            $ruta .= $mes."/";
            crearCarpeta($ruta);
            $ruta .= $dia."/";
            crearCarpeta($ruta);
            $ruta .= $idNota."/";
            crearCarpeta($ruta);
            
            for($i = 0; $i < count($imagen["name"]); $i++){
                $nombre = $idNota.'-'.($i + 1).'.jpg';
                $rutaVariable = str_replace($rutaInicial,"",$ruta).$nombre;

                if($imagen["name"][$i] == $imgPrincipal){
                    $imgPrincipal = $ruta.$nombre;
                    $estado = "principal";
                }
                else $estado = "activa";
                $sql = "INSERT INTO `imagenes`(`idNota`, `ruta`, `estado`) VALUES ($idNota,'$rutaVariable','$estado')";
                $linkCS -> query($sql);
                $move = $ruta.$nombre;
                $temporal  =  $imagen['tmp_name'][$i];
                move_uploaded_file($temporal, $move);

               
                if($estado == "principal"){
                     //Generar Miniatura
                    $original = imagecreatefromjpeg($move); 
                    $size = getimagesize($move);
    
                    $sizeMiniW = $size[0] / 8;
                    $sizeMiniH = $size[1] / 8;
                    $resized = imagecreatetruecolor($sizeMiniW, $sizeMiniH);
    
                    imagecopyresampled($resized, $original, 0, 0, 0, 0, $sizeMiniW, $sizeMiniH , $size[0], $size[1]);
    
                    imagejpeg($resized, $ruta.$idNota.'-'.($i + 1).'-peque.jpg');

                    if($imgPrePercent != "false" && $imgPrePercent != "-1"){
                        
                        $cropH = $size[0] / (8 / 3);
                        $top = $imgPrePercent * $size[1] / 100;
                        $imgCrop = imagecrop($original,['x' => 0 ,'y' => $top,'width' => $size[0], 'height' => $cropH]);
                        $panoramica = imagecreatetruecolor(1920, 720);
                        imagecopyresampled($panoramica, $imgCrop, 0, 0, 0, 0, 1920, 720 , $size[0], $cropH);
                        imagejpeg($panoramica, $ruta.$idNota.'-'.($i + 1).'-large.jpg');
                    
                    }
                    //panoramica

                }
               
            }
        }
        else $imgPrincipal = false;

        $partesFecha = explode(" ",$timestamp);
        $datos = [
            "id"     => $idNota,
            "titulo" => str_replace("''","'",$titulo),
            "img"    => $imgPrincipal,
            "fecha"  => formatoFecha($partesFecha[0]),
            "hora"   => formatoHora($partesFecha[1]),
            "extra"  => $extra,
            "url"    => $url,
            "sitioPrincipal" => $sitioPrincipal,
            "imgPrePercent" => $imgPrePercent
        ];
        echo json_encode($datos);
        
        break;

    case "getNota": 

        if(!isset($_POST["idNota"])) exit;

        $idNota = $_POST["idNota"];

        $sql = "SELECT * from notas where id = $idNota";
        $res = $linkCS -> query($sql);
        $nota = $res -> fetch_assoc();

        $sql = "SELECT ruta, estado from imagenes where idNota = $idNota AND estado != 'eliminada'";
        $res = $linkCS -> query($sql);
        $imgs = array();
        $imgPrincipal = "";
        while($img = $res -> fetch_assoc()){
            array_push($imgs,$img["ruta"]);
            if($img["estado"] == 'principal')
                $imgPrincipal = $img["ruta"];
        }
        // $config = str_pad($nota["config"],"0",STR_PAD_LEFT);
        $json = [
            "titulo"    => $nota["titulo"],
            "texto"     => $nota["contenido"],
            "categoria" => $nota["categoria"],
            "ultima"    => $nota["ultimaEdicion"],
            "principal" => $imgPrincipal,
            "imagenes"  => $imgs,
            "fechaEspecial" => $nota["fechaPublicacion"],
            "url"       => $nota["urlRecortado"],
            "sitioPrincipal" => $nota["sitioPrincipal"] == "1",
        ];
        echo json_encode($json);
        break;
    
    case "eliminarNota":

        if(!isset($_POST["idNota"])) exit;

        if(!isset($_SESSION["cs_id_user"])) {
            echo "sesion caducada";
            exit;
        }

        $idNota = $_POST["idNota"];
        $idUser = $_SESSION["cs_id_user"];

        $sql = "UPDATE `notas` SET `estado`= 'eliminada' WHERE id = $idNota";
        $linkCS -> query($sql);

        $sql = "UPDATE `imagenes` SET `estado`= 'eliminada' WHERE idNota = $idNota";
        $linkCS -> query($sql);

        $sql = "SELECT fechaCreacion from notas where id = $idNota";

        $res = $linkCS -> query($sql);

        $fechaCreacion = $res -> fetch_assoc()["fechaCreacion"];

        $fecha = explode(" ",$fechaCreacion)[0];
        $fecha = str_replace("-","/",$fecha);
        $carpetaImgs = "../img/notas/".$fecha."/".$idNota."/";

        if(is_dir($carpetaImgs)){
            $files = glob($carpetaImgs.'*'); 
            foreach($files as $file) 
                if(is_file($file)) 
                    unlink($file);
            rmdir($carpetaImgs);
        }

        registrar($linkCS,7,$idUser,$idNota,"Se elimino una nota");
        break;


    case "revisar":
        if(!isset($_SESSION["cs_id_user"]) || !isset($_POST["idNota"])) exit;
        $idNota = $_POST["idNota"];
        $idUser = $_SESSION["cs_id_user"];
        $sql = "UPDATE `notas` SET `estado` = 'revisada' where id = $idNota";
        $linkCS -> query($sql);
        $msg = "Se ha marcado la nota como revisada";

        registrar($linkCS,21,$idUser,$idNota,$msg);
        echo $msg;
        break;


    case "publicar":
        
        if(!isset($_SESSION["cs_id_user"]) || !isset($_POST["idNota"])) {
            echo "sesion caducada";
            exit;
        }
        $idNota = $_POST["idNota"];
        $idUser = $_SESSION["cs_id_user"];
        
        $sql = "SELECT fechaPublicacion from notas where id = $idNota";

        $res = $linkCS -> query($sql);
        $res = $res -> fetch_assoc();
        $fechaPublicacion = $res["fechaPublicacion"];
        $fijada = $_POST["fijada"] == "true";
        
        
        $timestamp = date("Y-m-d H:i:s");
        $extra = "Se publico una nota";
        $tipo = 4;
        $estado = "publicada";
        if($fechaPublicacion == "1000-01-01 00:00:00"){
            $fechaPublicacion = $timestamp;
        }
        else if($fechaPublicacion > $timestamp){
            $estado = "pendiente";
            $extra = "Se programo una nota para ser publicada el $fechaPublicacion";
            $tipo = 5;
        }
        
        if($estado == "publicada" && $fijada){ //6 es la posicion de la opcion de nota fijada 
            //Remover la nota fijada anterior si se quiere fijar una nueva
            $sql = "UPDATE globals SET valor = '$idNota' where variable = 'notaFijada'";
            $linkCS -> query($sql);
            $extra .= " y se fijo como nota destacada";
        }
        $sql = "UPDATE `notas` SET `estado` = '$estado', `creadaPor` = $idUser,  
            `fechaPublicacion` = '$fechaPublicacion' WHERE id = $idNota";
        
        $linkCS -> query($sql);

        $partesFecha = explode(" ",$fechaPublicacion);
        $fecha = formatoFecha($partesFecha[0]);
        $hora = formatoHora($partesFecha[1]);
        if($linkCS -> affected_rows == 1){
            if($estado == "publicada") echo "Publicado con exito";
            else echo 'Esta nota se publicara el '.$fecha.' a las '.$hora.'.
                Puedes editar esta nota <a href="admin/?editar='.$idNota.'#nueva-nota">aqui</a>';
        }
        else echo "No se publico, recarga la pagina e intentalo de nuevo";
        
        registrar($linkCS,$tipo,$idUser,$idNota,$extra);

        break;
    
    case "actualizarCuenta":
        if(!isset($_SESSION["cs_id_user"]) || !isset($_POST["nombre"]) || !isset($_POST["correo"])) exit;
        $id = $_SESSION["cs_id_user"];
        $nombre = $_POST["nombre"];
        $correo = $_POST["correo"];
        $sql = "UPDATE `usuarios` SET `nombre` = '$nombre', `correo` = '$correo' WHERE id = $id";
        $linkCS -> query($sql);
        echo "correcto";
      
        break;
    
    case "cambiarPass":
        if(!isset($_SESSION["cs_id_user"]) || !isset($_POST["oldPass"]) || !isset($_POST["newPass"])) exit;
        $id = $_SESSION["cs_id_user"];
        $oldPass = $_POST["oldPass"];
        $newPass = $_POST["newPass"];

        $sql = "SELECT contra from usuarios where id = $id";
        $res = $linkCS -> query($sql);
        $pass = $res -> fetch_assoc()["contra"];
        if(password_verify($oldPass,$pass)){
            $pass = password_hash($newPass, PASSWORD_DEFAULT);
            $sql = "UPDATE `usuarios` SET `contra` = '$pass' WHERE id = $id";
            $linkCS -> query($sql);
            echo "correcto";
            registrar($linkCS,17,$id,0,"Se cambio la contraseña");
        }
        else{
            echo "Contraseña Actual Incorrecta";
        }
        break;

    case "guardarCategoria":
        if(!isset($_SESSION["cs_id_user"]) || !isset($_POST["idCategoria"]) || 
           !isset($_POST["categoria"])  ||  !isset($_POST["color"])) exit;

        $idUser = $_SESSION["cs_id_user"];
        $idCategoria = $_POST["idCategoria"];
        $categoria = $_POST["categoria"];
        $color = $_POST["color"];
        if($idCategoria == 0){
            $sql = "INSERT INTO `categorias`(`categoria`, `color`) VALUES ('$categoria','$color')";
            $tipo = 8;
            $extra = "Se creo la categoria: $categoria";
            $linkCS -> query($sql);
            $idCategoria = $linkCS -> insert_id;
        }else{
            $sql = "UPDATE `categorias` SET `categoria`='$categoria',`color`='$color' WHERE id=$idCategoria";
            $tipo = 9;
            $extra = "Se modifico una categoria: $categoria";
            $linkCS -> query($sql);
        }
        
        registrar($linkCS,$tipo,$idUser,$idCategoria,$extra);
        break;
    
    case "eliminarCategoria":
        if(!isset($_SESSION["cs_id_user"]) || !isset($_POST["idCategoria"]) || !isset($_POST["herencia"])) exit;

        $idUser = $_SESSION["cs_id_user"];
        $idCategoria = $_POST["idCategoria"];
        $herencia = $_POST["herencia"];

        $sql = "DELETE FROM `categorias` WHERE id = $idCategoria";
        $linkCS -> query($sql);

        $sql = "UPDATE `notas` SET `categoria`=$herencia WHERE `categoria` = $idCategoria";
        $linkCS -> query($sql);

        registrar($linkCS,10,$idUser,$idCategoria,"Se elimino una categoria");
        break;
    
    case "guardarEnlace":
        if(!isset($_SESSION["cs_id_user"]) || !isset($_POST["idEnlace"]) || 
            !isset($_POST["texto"])  ||  !isset($_POST["link"])) exit;

        $idUser = $_SESSION["cs_id_user"];
        $idEnlace = $_POST["idEnlace"];
        $texto = $_POST["texto"];
        $link = $_POST["link"];

        if($idEnlace == 0){
            $sql = "INSERT INTO `enlaces`(`texto`, `link`) VALUES ('$texto','$link')";
            $tipo = 11;
            $extra = "Se creo un enlace: $texto";
            $linkCS -> query($sql);
            $idEnlace = $linkCS -> insert_id;
        }else{
            $sql = "UPDATE `enlaces` SET `texto`='$texto',`link`='$link' WHERE id=$idEnlace";
            $linkCS -> query($sql);
            $tipo = 12;
            $extra = "Se modifico un enlace: $texto";
        }

        registrar($linkCS,$tipo,$idUser,$idEnlace,$extra);
        
        break;

    case "eliminarEnlace":
        if(!isset($_SESSION["cs_id_user"]) || !isset($_POST["idEnlace"])) exit;

        $idUser = $_SESSION["cs_id_user"];
        $idEnlace = $_POST["idEnlace"];
        $sql = "DELETE FROM `enlaces` WHERE id = $idEnlace";
        $linkCS -> query($sql);
        registrar($linkCS,13,$idUser,$idEnlace,"Se elimino un enlace");
        break;

    case "guardarUsuario":
        if(!isset($_SESSION["cs_id_user"]) || !isset($_POST["idUsuario"]) ||  !isset($_POST["usuario"])  
             ||  !isset($_POST["nombre"])  || !isset($_POST["correo"])) exit;

        $idAdmin = $_SESSION["cs_id_user"];

        $idUsuario = $_POST["idUsuario"];
        $usuario = $_POST["usuario"];
        $nombre = $_POST["nombre"];
        $correo = $_POST["correo"];

        if($idUsuario == 0){
            $pass = '$2y$10$LttgdLJ.uJB.2Aki8m8.1OXtJJuN9K0Uq6p9Xpc.tZgWH5cb8HFi6';
            $sql = "INSERT INTO `usuarios`(`usuario`,`contra`,`nombre`,`correo`,`tipo`) VALUES ('$usuario','$pass','$nombre','$correo','editor')";
            $linkCS -> query($sql);
            $tipo = 14;
            $idUsuario = $linkCS -> insert_id;
            $extra = "Se creo un usuario: $usuario";
        }else{
            $sql = "UPDATE `usuarios` SET `usuario`='$usuario',`nombre`='$nombre', `correo`='$correo'WHERE id=$idUsuario";
            $linkCS -> query($sql);
            $tipo = 15;
            $extra = "Se modifico un usuario: $usuario";
        
        }

        registrar($linkCS,$tipo,$idAdmin, $idUsuario,$extra);
        
        break;

    case "eliminarUsuario":
        
        if(!isset($_SESSION["cs_id_user"]) || !isset($_POST["idUsuario"]) || !isset($_POST["herencia"])) exit;

        $idAdmin = $_SESSION["cs_id_user"];
        $idUsuario = $_POST["idUsuario"];
        $herencia = $_POST["herencia"];
        $sql = "DELETE FROM `usuarios` WHERE id = $idUsuario";
        $linkCS -> query($sql);
        $sql = "UPDATE `notas` SET `creadaPor`=$herencia WHERE `creadaPor` = $idUsuario";
        $linkCS -> query($sql);

        registrar($linkCS,16,$idAdmin,$idUsuario,"Se elimino a un usuario");
        break;

    case "traerRegistros":
        if(!isset($_SESSION["cs_id_user"]) || !isset($_POST["idNota"])) exit;

        $idNota = $_POST["idNota"];

        $sql = "SELECT logs.fechaHora as fecha, logs.tipo, u.nombre from logs,usuarios as u where 
            u.id = logs.idUsuario and logs.idNota = $idNota and (logs.tipo = 2 OR logs.tipo = 3 OR logs.tipo = 4)
            ORDER BY fecha ASC";

        $res = $linkCS -> query($sql);
        $acciones = ["creó","editó","publicó"];
        if($res -> num_rows > 0){
            while($row = $res -> fetch_assoc()){
                $fecha = explode(" ",$row["fecha"]);
              
                $fecha = formatoFecha($fecha[0])." ".formatoHora($fecha[1]); 
                $nombre = explode(" ",$row["nombre"])[0];
                $accion = $acciones[$row["tipo"] - 2];
                echo "<p>$fecha - $nombre $accion esta nota</p>";
            }
        }
        else {
            $sql = "SELECT n.fechaCreacion,u.nombre from notas as n, usuarios as u 
                where n.id = $idNota and n.creadaPor = u.id";
            $res = $linkCS -> query($sql);
            $row = $res -> fetch_assoc();

            $fecha = explode(" ",$row["fechaCreacion"]);
            $fechaCreacion = formatoFecha($fecha[0])." ".formatoHora($fecha[1]); 

            $nombre = explode(" ",$row["nombre"])[0];

            echo "<p>$fechaCreacion - $nombre creó esta nota</p>";
        }
        break;
    
    case "subirBoletin": 
        if(!isset($_POST["edicion"]) || !isset($_SESSION["cs_id_user"]) || !isset($_POST["fecha"]) || !isset($_FILES["archivo"])) exit;
        $edicion = $_POST["edicion"];
        $fecha = $_POST["fecha"];
        $idAdmin = $_SESSION["cs_id_user"];
        $boletin = $_FILES["archivo"];
        $imagen = isset($_FILES["imagen"])? $_FILES["imagen"] : false;
        $sql = "INSERT INTO `boletines`(`edicion`, `fecha`)  VALUE ('$edicion','$fecha')";
        $linkCS -> query($sql);
        $idBoletin = $linkCS -> insert_id;
        registrar($linkCS,18,$idAdmin,$idBoletin,"Se añadio un boletin");
        $ruta = "../docs/boletines/".$idBoletin;
        crearCarpeta($ruta);
        $move = $ruta."/".$idBoletin."-boletin.pdf";
        $temporal  =  $boletin['tmp_name'];
        move_uploaded_file($temporal, $move);
        if($imagen){
            $move = $ruta."/".$idBoletin."-portada.jpg";
            $temporal  =  $imagen['tmp_name'];
            move_uploaded_file($temporal, $move);
        }
        break;

}

function crearCarpeta($ruta){
    if(!is_dir($ruta)){
        mkdir($ruta);
        chmod($ruta,0775);
        chgrp($ruta,"creadores");
    }
}

/*
    logs tipo

    1 = login

    2 = crear nota
    3 = editar nota
    4 = publicar nota
    5 = programar una publicacion
    6 = regresar publicacion a borrador
    7 = eliminar nota

    8 = crear una categoria
    9 = modificar categoria
    10 = eliminar categoria

    11 = crear un enlace
    12 = modificar un enlace
    13 = eliminar un enlace

    14 = crear un usuario
    15 = modificar un usuario
    16 = eliminar un usuario

    17 = cambiar contraseña

    18 = agregar boletin
    19 = editar boletin
    20 = elimintar boletin

    21 = Revisar nota
*/

function registrar($link, $tipo, $idUsuario,$idNota, $extra){
    $sql = "INSERT INTO `logs`
        (`tipo`, `idUsuario`, `idNota`, `fechaHora`, `extra`) VALUES
        ( $tipo, $idUsuario , $idNota ,   now()    ,'$extra')";
                    
    $link -> query($sql);

}


function curl_get_contents($url){
    $ch = curl_init();

    curl_setopt($ch, CURLOPT_HEADER, 0);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
    curl_setopt($ch, CURLOPT_URL, $url);

    $data = curl_exec($ch);
    curl_close($ch);

    return $data;
}

function c($parametro){
    return str_replace("'","\'",$parametro);
}
?>