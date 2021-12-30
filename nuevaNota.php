<?php 
session_start();
if(!isset($_SESSION["cs_id_user"]))
	header("Location: ../acceder.php");
?>
<link rel="stylesheet" href="cssAdmin/nuevaNota.css?8">
<link href="summernote/summernote-lite.min.css" rel="stylesheet">
<aside class = "color-secundario">
	<h2>Borradores</h2><div id="nuevo-borrador"><img src="../img/new.png"></div>
	<div id="borradores">
		
	<?php 
		function borrador($row,$rand){
			$idNota = $row["idNota"];
			$img    = $row["img"];
			$titulo = $row["titulo"];
			$fecha  = $row["ultimaEdicion"];
			$dia    = formatoFecha(explode(" ",$fecha)[0]);
			$hora   = formatoHora(explode(" ",$fecha)[1]);
			return 
				"<div class = 'borrador' idBorrador = '$idNota' >
					<div class='miniatura'>
						<img  src ='../img/notas/$img?$rand'>
					</div><div class='borrador-2'>
						<div class ='titulo'>$titulo</div>
						<div class ='fecha'>$dia&nbsp;&nbsp;&nbsp;&nbsp;$hora
						</div><div class ='eliminar'><img src = '../img/delete.png'></div>
					</div>
				</div>";
		}
		require "../../php/config.php";
		$linkCS = conectar("cs_nuevo");
		$editar = null;
		$extra = "";
		if(isset($_GET["editar"]))
		 	$extra = " OR (id =".$_GET["editar"]." AND estado != 'eliminada')";
		//con esta consulta, la nota debera tener obligatoiramente imagen principal
		// $sql = "SELECT n.titulo as titulo, n.ultimaEdicion as fecha, i.ruta  as ruta from notas as n, imagenes as i 
		// 	where n.estado = 'borrador' and n.id = i.idNota and i.estado = 'principal'";
		$sql = "SELECT id, titulo, ultimaEdicion, estado from notas where 
			estado = 'revisada' OR estado = 'pendiente' OR estado = 'borrador'".
			$extra." ORDER BY estado ASC, ultimaEdicion DESC";

		$borradores = $linkCS -> query($sql);
		$notas = [
			"borrador" => array(),
			"revisada" => array(),
			"pendiente" => array()
		];
		$rand = rand(100000,200000);
		if($borradores -> num_rows > 0){
			
			while($borrador = $borradores -> fetch_assoc()){ 
				$idNota = $borrador["id"];
				$sql = "SELECT ruta from imagenes where idNota = $idNota AND estado = 'principal'";
				$img = $linkCS -> query($sql);
				if($img -> num_rows > 0){
					$img = $img -> fetch_assoc()["ruta"];
					$img = str_replace('.jpg','-peque.jpg',$img);
				}
				else $img = "../vertical-peque.png";
				$row = [
					"idNota" => $idNota,
					"img" => $img,
					"titulo" => $borrador["titulo"],
					"ultimaEdicion" => $borrador["ultimaEdicion"]
				];
				$estado = $borrador["estado"];
				if($estado != "publicada")
					array_push($notas[$estado],$row);
				else $editar = $row;
			}
		}
		$nBorradores = count($notas["borrador"]);
		$nRevisadas = count($notas["revisada"]);
		$nPendientes = count($notas["pendiente"]);

		$sql = "SELECT count(*) as total from notas where estado = 'publicada'";
		$res = $linkCS -> query($sql); 
		$nPublicadas = $res -> fetch_assoc()["total"];
		if($editar != null)
			echo borrador($editar,$rand);
	?>
				

	 	<div class="estado">
			<h3>En edición (<span id="nEdicion"><?php echo $nBorradores;?></span>) <i class="arrow down"></i></h3>
		</div>
		<div id="estado-edicion"><?php 
			for($i = 0; $i < $nBorradores; $i++)
				echo borrador($notas["borrador"][$i],$rand);?>
		</div>

		<div class="estado">
			<h3>Revisadas (<?php echo $nRevisadas;?>) <i class="arrow down"></i></h3>
		</div>
		<div><?php 
			for($i = 0; $i < $nRevisadas; $i++)
				echo borrador($notas["revisada"][$i],$rand);?>
		</div>

		<div class="estado">
			<h3>Programadas (<?php echo $nPendientes;?>) <i class="arrow down"></i></h3>
		</div>
		<div><?php 
			for($i = 0; $i < $nPendientes; $i++)
				echo borrador($notas["pendiente"][$i],$rand);?>
		</div>

		<a href="./#editar-nota">
			<div class="estado">
				<h3>Publicadas (<?php echo $nPublicadas;?>)</h3>
			</div>
		</a>
	</div>
</aside><div id ="principal-nueva-nota">
	<b>(Beta)</b><br><br>
	<h1>Titulo</h1>

	<input id = "titulo" type="text" placeholder="Ingresa el titulo aquí">
	<br><br><br>
	<section id="subir-imagen">
		<h2>Arrastra aquí las imagenes de la nota.</h2><br>
		<h3>También puedes seleccionarlas.</h3>
		<input type="file" id="img-input" name="img-input" multiple>
	</section><br><br>
	<h3 class="trapecio">Imagenes</h3><br>
	<section id="img-cargadas"><h4>No hay imagenes cargadas</h4></section>
	<br><br><br>
	
	<input value = "1" min ="1" max ="4" type = "number" id="numero-columnas" name = "numero-columnas">
	<label for="numero-columnas">Columnas</label>
	<div id ="btn-dividir-columnas" class="boton-secundario">Dividir</div>
	<br><br>
	<div id="summernote"></div>
	<br><br>
	<select name="combo-categorias" id="combo-categoria">
		<option value="0">Selecciona una categoría</option>
		<?php 
			$sql = "SELECT * from categorias where id != 0";
			$res = $linkCS -> query($sql);
			while($cat = $res -> fetch_assoc())
				echo '<option value = "'.$cat["id"].'">'.$cat["categoria"].'</option>';
		?>
	</select>
	<div></div>
	<br><br>

	<div id="opciones-especiales">
		<label><input type= "checkbox" id="check-sitio-principal"> 
			Publicar en carrucel <b>tepatitlan.gob.mx</b>
		</label>
		<br>
		<p id="no-disponible"> Previsualización no disponible</p>
		<div id="cuadro-copy"></div>
		<button id="btn-mover" class="boton-secundario">Mover</button>
		<br>
	
		<label><input type= "checkbox" id="check-especial"> 
			Publicar con fecha especial (Chrome recomendado)
		</label>
		<br>	
		<div id="div-fecha-especial">
			<input type= "datetime-local" id="fecha-especial" placeholder="Ingresa una fecha Anterior">
			<p> <b>Nota:</b> si colocas una fecha y hora posterior a la actual, la nota 
				se publicara en automatico una vez alcanzado el plazo</p>
		</div>
	</div>
	<br><br><br>
	<div id="linea-botones">
		<div id="msg-guardado"><img src ="../img/success.png"><span>Datos Guardados</span>
		</div><button id="btn-borrador">Guardar Borrador
		</button><div id="spinner-guardando"></div><button id="btn-publicar">Vista Previa</button>
		
	</div>
	<span id="msg-generando-links" style="display:none"><small><b>Generando links...</b></small></span>
	<div id = "links">
		<h4>Link Directo</h4>
		<div class="tooltip">
            <span class="tooltiptext">Haz clic para copiar</span>
			<span id="link-directo"></span>
		</div>
		<br><br>
		<h4>Link Recortado</h4>
		<div class="tooltip">
            <span class="tooltiptext">Haz clic para copiar</span>
			<span id="link-recortado"></span>
			
		</div>
		<br><br>
		<small>*Se puede publicar en Facebook</small>
	</div>
	<br><br><br>
</div>
<section id ="btn-borradores">
	<div class="linea"></div>
    <div class="linea"></div>
    <div class="linea"></div>
</section>
<div class="shadow" id="a">

</div>
<div class="modal" id="b">
	<div class="content">
		<p>Ajusta la imagen moviendo la barra lateral</p>
		<br>
		<div class="cuadro">
			<div class="logo"><img src="../img/logo-mini.jpg" alt=""></div>
			<div class="img">
				<img src="" alt="">
				<!-- <img src="https://www.tepatitlan.gob.mx/archivo-nuevo/images/index-header/1.jpg" alt=""> -->
			</div>
			<div class="apartados"><div class="low"></div><div class="blue"></div><div class="red"></div></div>
		</div><div class="contenedor-range">
			<input type="range" min="0" max="100" id="img-offset" value="50">
		</div>
		<br><br>
		<div class="botones-modal">
		
			<button class="boton-secundario cancel">Cerrar</button>
			<button class="boton-principal aceptar">Aceptar</button>
		</div>
		
	</div>
</div> 
