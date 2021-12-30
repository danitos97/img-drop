$(document).ready(function(){

$.getScript("summernote/summernote-lite.min.js",function(){
    
    $.getScript("summernote/lang/summernote-es-ES.js",function(){

    $('#summernote').summernote({
        placeholder: 'Texto de la nota',
        tabsize: 2,
        height: 300,
        lang: 'es-ES',
        disableDragAndDrop: true,
    });
  
    var cambiosGuardados, imgPrincipal, imgCargadas, nImgs,
        btnBorrador = document.getElementById("btn-borrador"),
        btnPublicar = document.getElementById("btn-publicar"),
        spinner = document.getElementById("spinner-guardando"),
        span    = document.getElementById("msg-guardado"),
        btnBorradoresResponsivo = document.getElementById("btn-borradores"),
        principalNuevaNota  = document.getElementById("principal-nueva-nota"),
        btnDividirColumnas  = document.getElementById("btn-dividir-columnas"),
        inputNumeroColumnas = document.getElementById("numero-columnas"),
        divLinks            = document.getElementById("links"),
        spanLinkDirecto     = document.getElementById("link-directo"),
        spanLinkRecortado   = document.getElementById("link-recortado"),
        contenedorEnEdicion = document.getElementById("estado-edicion"),
        nEdicion            = document.getElementById("nEdicion");


    const checkSitioPrincipal = document.getElementById("check-sitio-principal"),
        checkEspecial = document.getElementById("check-especial"),
        inputEspecial = document.getElementById("fecha-especial"),
        divFechEspecial=document.getElementById("div-fecha-especial"),
        comboCategoria =document.getElementById("combo-categoria"),
        spanGenerandoLinks = document.getElementById("msg-generando-links"),
        cuadro     = document.querySelector(".modal .cuadro"),
        cuadroCopy = document.getElementById("cuadro-copy"),
        btnMover   = document.getElementById("btn-mover"),
        noDisponible = document.getElementById("no-disponible");

    let imgPrePercent = false;
       
    let imgCharging = false;

    var borradorResponsivo = false;

    btnBorradoresResponsivo.addEventListener("click",function(){
        $('#contenido > aside').animate({width: 'toggle'});
        $("#contenido > div").toggleClass("opaco");
        borradorResponsivo = !borradorResponsivo;
        if(borradorResponsivo)
            principalNuevaNota.addEventListener("click",closeBorradores);
        else
            principalNuevaNota.removeEventListener("click",closeBorradores);
        
    });
    const closeBorradores = (e) => {
        e.preventDefault();
        e.stopPropagation();
        btnBorradoresResponsivo.click();
    }

    btnBorrador.style.display = "none";
    btnPublicar.style.display = "none";
    span.style.display = "none";
   
    var random = Math.floor(Math.random() * (200000 - 100000) + 100000);
    //esta variable evita que las imagenes sean tomadas de la memoria cache

    function setCambios(guardados){
        if(cambiosGuardados == false && guardados == false) return;
        btnPublicar.style.display = "inline-block";
        if(guardados){
            btnBorrador.style.display = "none";
            span.style.display = "inline-block";
        }else{
            btnBorrador.style.display = "inline-block";
            span.style.display = "none";
        }
        cambiosGuardados = guardados;
    }

    $("#summernote").on("summernote.change", function () { 
        setCambios(false);
    });

    var summernoteInitialText =  $('#summernote').summernote("code");

    
    btnDividirColumnas.addEventListener("click",function(){
        var nCol = inputNumeroColumnas.value;

        if(nCol > 4 || nCol < 1){
            alert("Solo se pueden hasta 4 columnas");
            return;
        }
        if($("#summernote").summernote("code") != "<p><br></p>")
            if(!confirm("Se reemplazara el texto que tengas en la nota ¿Continuar?"))
                return;
        var columns = '<div class="custom">';
        for(var i = 1; i <= nCol; i++ )
            columns += '<div><p>Columna ' + i + '</p></div>';
        columns += '</div><style>.custom > div{display:inline-block;width:calc(100% / '+ nCol +
            ');vertical-align:top;padding:12px}@media screen and (max-width:720px){.custom > div{width:100%;}}</style>';
        $('#summernote').summernote("code",columns);
    });
    function inicializarVariables(){
        cambiosGuardados = true;
        imgPrincipal = null;
        imgCargadas = [];
        nImgs = 0;
        cuadroCopy.style.display = "none";
        btnMover.style.display = "none";
        noDisponible.style.display = "none";
        imgPreSelected = false;
        checkSitioPrincipal.checked = false;
    }

    inicializarVariables();

    var idNota = null;
    var titulo = document.getElementById('titulo'); 
    titulo.addEventListener('input', resizeInput);
    titulo.addEventListener('input', function(){
        setCambios(false);
    });
    resizeInput.call(titulo);
    
    function resizeInput() {
        this.style.width = (this.value.length * 1.15) + "ch";
    }
    
    var target = document.documentElement;
    target.addEventListener('dragover', (e) => {
        e.preventDefault();
        let cursor = "none";
        if(e.target.id === "subir-imagen" || e.target.id === "img-cargadas")
            cursor = "move";
        e.dataTransfer.dropEffect = cursor;
    });

    var imgInput  = document.getElementById("img-input"),
        dropArea  = document.getElementById("subir-imagen"),
        dropArea2 = document.getElementById("img-cargadas");
        
    document.addEventListener("dragover",function(e){
        e.preventDefault();
        e.stopPropagation();
    });
    document.addEventListener("drop",function(e){
        e.preventDefault();
        e.stopPropagation();
    });
    dropArea.addEventListener("dragover",function(e){
        e.preventDefault();
        e.stopPropagation();
    });
    dropArea.addEventListener("drop",function(e){
        e.preventDefault();
        e.stopPropagation();
        imgInput.files = e.dataTransfer.files;
        cargarImgs();
    });
    dropArea2.addEventListener("dragover",function(e){
        e.preventDefault();
        e.stopPropagation();
    });
    dropArea2.addEventListener("drop",function(e){
        e.preventDefault();
        e.stopPropagation();
        var filesDrop = e.dataTransfer.files;
        if(filesDrop.length > 0){
            imgInput.files = filesDrop;
            cargarImgs();
        }
    });

    imgInput.addEventListener("change",function(){ cargarImgs()},false);

    function cargarImgs(){
        setCambios(false);
        if(dropArea2.innerHTML == "<h4>No hay imagenes cargadas</h4>")
            dropArea2.innerHTML = "";
        comprimir(0);
    }
    
    function comprimir(i){
        const reader = new FileReader();
        reader.onload = function(){
            var callback = null;
            if(i < imgInput.files.length - 1){
                var next = i + 1;
                callback = function(){comprimir(next)}
            }
            crearCanvas(reader.result, .75, false, callback);
        }
        reader.readAsDataURL(imgInput.files[i]);
    }

    function crearBorrador(datos){
        var borrador = document.createElement("div");
        borrador.setAttribute("class","borrador");
        borrador.setAttribute("idBorrador",datos.id);

        var img = datos.img? datos.img.replace(".jpg","-peque.jpg") : "../img/vertical-peque.png";

        borrador.innerHTML = '<div class="miniatura">'+
            '<img  src ="'+img+'?'+Math.random()+'">'+
            '</div><div class="borrador-2">' +
            '<div class ="titulo">'+datos.titulo+'</div>'+
            '<div class ="fecha">'+datos.fecha+' &nbsp;&nbsp;&nbsp;&nbsp; ' + datos.hora +
            '</div><div class ="eliminar"><img src = "../img/delete.png"></div></div></div>';

        borrador.addEventListener("click", cargarBorrador);

        // if($("#borradores .borrador").length == 0)
        //     borradores.innerHTML = "";
        
        contenedorEnEdicion.prepend(borrador);
        $(borrador).addClass("seleccionado");
        if(idNota != null)
            $(borrador).siblings('[idBorrador = "'+datos.id+'"]').remove();
        else  nEdicion.innerHTML = parseInt(nEdicion.innerHTML) + 1;
        idNota = datos.id;
        $("#nuevo-borrador img").show();
        var btnEliminar = $(borrador).children(".borrador-2").children(".eliminar").children("img");
        btnEliminar.click(eliminarBorrador);
       

    }
    $(".estado").click(function(){
        $(this).next().slideToggle();
    });
    $(".borrador").click(cargarBorrador);
    $(".borrador .eliminar img").click(eliminarBorrador);

    function eliminarBorrador(e){
        e.stopPropagation();
        if(confirm("¿Eliminar Borrador Permanentemente?")){
            var borrador = $(this).parent().parent().parent();
            var id = borrador.attr("idBorrador");
            $.ajax({
                url:  '../php/ajax.php',
                type: "POST",
                data: {
                    'opcion' : 'eliminarNota',
                    'idNota' : id,
                },
                success: function (datos) {
                    borrador.remove();
                    nEdicion.innerHTML = parseInt(nEdicion.innerHTML) - 1;
                    if(id == idNota){
                        inicializarTodo();
                        $("#nuevo-borrador img").hide();
                    }
                }
            });
        }  
    }
    function cargarBorrador(){
        if($(this).hasClass("seleccionado") || imgCharging) return;

        if(!cambiosGuardados)
            if(!confirm("Tienes cambios sin guardar en el borrador actual ¿quieres descartar estos cambios?")){
                btnBorrador.blur();
                btnBorrador.focus();
                return;
            }

        imgCargadas = true;
        $(".borrador").removeClass("seleccionado");
        $(this).addClass("seleccionado");
        idNota = $(this).attr("idBorrador");
        $.ajax({
            url:  '../php/ajax.php',
            type: "POST",
            dataType: "json",
            data: {
                'opcion' : 'getNota',
                'idNota' : idNota,
            },
            success: function (datos) {
                console.log(datos);
                inicializarVariables();
                titulo.value = datos.titulo;
                resizeInput.call(titulo);
                $("#summernote").summernote('code', datos.texto);
                comboCategoria.value = datos.categoria;
                
                console.log("sitio"+datos.sitioPrincipal);

                if(datos.sitioPrincipal){
                   checkSitioPrincipal.checked = true;
                   imgPrePercent = -1;
                    cuadroCopy.innerHTML = "";
                    cuadroCopy.append(cuadro.cloneNode(true));
                    cuadroCopy.style.display = "inline-block";
                    btnMover.style.display = "inline-block";
                    const img = document.querySelector("#cuadro-copy .img img");
                    img.src = "../img/notas/"+datos.principal.replace(".jpg","-large.jpg");
                    img.style.marginTop = "0";
                }


                //Si tiene la opcion habilitada poner Previzualizacion no disponible
                var fecha = datos.fechaEspecial;
                const tieneFecha = (fecha != "1000-01-01 00:00:00" && fecha != "0000-00-00 00:00:00");
                checkEspecial.checked = tieneFecha;
                inputEspecial.value = tieneFecha? fecha.replace(" ","T").substring(0,fecha.length-3) : "";
                verificarCheckEspecial();
                var totalImgs = datos.imagenes.length;
                if(totalImgs > 0){
                    imgCharging = true;
                    dropArea2.innerHTML = "";
                    var rutasImg = [];
                    var nPrincipal = null;
                    for(var i = 0; i < totalImgs; i++){
                        var ruta = "../img/notas/" + datos.imagenes[i];
                        if(datos.imagenes[i] === datos.principal)
                            nPrincipal = i;
                        rutasImg.push(ruta); 
                    }    
                    multiCanvas(rutasImg,0,nPrincipal);
                }
                else dropArea2.innerHTML = "<h4>No hay imagenes cargadas</h4>";
                $("#nuevo-borrador img").show();
                setCambios(true);
                if(borradorResponsivo)
                    btnBorradoresResponsivo.click();

                divLinks.style.display = "inline-block";
                spanLinkDirecto.innerHTML = "https://www.tepatitlan.gob.mx/comunicacion/nota.php?idNota="+idNota;
                spanLinkRecortado.innerHTML = datos.url;
                eventCopy();
                
            },
            error: function(e, r){
                console.log(e);
                console.log(r);
            }
        }); 
    }

    function multiCanvas(array,i,nPrincipal){
        var callback = null;
        if(i < array.length - 1)
            callback = function(){multiCanvas(array, i + 1, nPrincipal)};
        var esPrincipal = i == nPrincipal;
        var src = array[i] +"?"+ random;
        crearCanvas(src, .75, esPrincipal, callback);
    }
    function crearCanvas(src, compresion, esPrincipal, callback){
        const img = new Image();
        
        img.onload = function(){
            const div = document.createElement("div"); 
            div.setAttribute("id-img",nImgs);
            const canvas = document.createElement("canvas");
            const estrella = new Image();
            estrella.src = "../img/estrella.png";
            estrella.className += " estrella";
            const cancelar = new Image();
            cancelar.src = "../img/cancelar.png";
            cancelar.className += " cancelar";
            var idImg = nImgs;
            cancelar.addEventListener("click",function(e){
                if(div.classList.contains("principal")){
                    var sibling = div.nextElementSibling;
                    if(!sibling) sibling = div.previousElementSibling;
                    if(!sibling) {
                        dropArea2.innerHTML = "<h4>No hay imagenes cargadas</h4>";
                        imgPrincipal = null;
                    }
                    if(sibling){
                        sibling.classList.add("principal");
                        imgPrincipal = sibling;
                    } 
                }
                div.remove();
                imgCargadas[idImg] = false;
                e.stopPropagation();
                setCambios(false);
            });
            
            div.appendChild(cancelar);
            div.appendChild(estrella);
            if(esPrincipal == true) {
                if(imgPrincipal !== null){
                    imgPrincipal.classList.remove("principal");
                }
                div.classList.add("principal");
                imgPrincipal = div;
            }

            if(imgPrincipal === null){
                div.classList.add("principal");
                imgPrincipal = div;
            }
            div.addEventListener("click",function(){
                if(div !== imgPrincipal){
                    div.classList.add("principal");
                    imgPrincipal.classList.remove("principal");
                    imgPrincipal = div;
                    setCambios(false);
                    imgPreSelected = false;
                    if(checkSitioPrincipal.checked) 
                        modalMover();
                }
            });
            var tam = img.width > img.height? 1920 : 1368;
            tam = 1920;
            canvas.width = tam;
            canvas.height = tam * img.height / img.width;
            
            const context = canvas.getContext("2d");
            context.drawImage(img, 0, 0, img.width   , img.height,     
                                   0, 0, canvas.width, canvas.height);
            
            canvas.toBlob(function(file){
                imgCargadas.push(file);
                nImgs++;
                tam = img.width > img.height? 220 : 150;
                canvas.width = tam;
                canvas.height = tam * img.height / img.width;
                context.drawImage(img, 0, 0, img.width, img.height,     
                                       0, 0, canvas.width, canvas.height);
                div.appendChild(canvas);
                dropArea2.appendChild(div);
                if(callback) callback();
                else 
                    imgCharging = false;
                
            },"image/jpeg",compresion);
        }
        img.src = src;
    }
    function inicializarTodo(){
        idNota = null;
        titulo.value = "";
        $("#summernote").summernote("code",summernoteInitialText);
        comboCategoria.value = "0";
        checkSitioPrincipal.checked = false;
        checkEspecial.checked = false;
        inputEspecial.value = "0000-00-00T00:00";
        divFechEspecial.style.display = "none";
        dropArea2.innerHTML = "<h4>No hay imagenes cargadas</h4>";
        btnBorrador.style.display = "none";
        btnPublicar.style.display = "none";
        span.style.display = "none";
        inicializarVariables();
        titulo.blur();
        titulo.focus();
        divLinks.style.display = "none";
    }

    $("#nuevo-borrador img").click(function(e){
        if(!cambiosGuardados)
            if(!confirm("Tienes cambios sin guardar en el borrador actual ¿quieres descartar estos cambios?")){
                btnBorrador.blur();
                btnBorrador.focus();
                return;
            }
        $('.borrador[idBorrador = "'+idNota+'"]').removeClass("seleccionado");
        inicializarTodo();
        $(this).hide();
        if(borradorResponsivo)
            btnBorradoresResponsivo.click();
    });



  


  

    checkEspecial.addEventListener('change', () => {
        verificarCheckEspecial();
        setCambios(false);
    });
    const rangeOffset = document.getElementById("img-offset");
    const imgPrePrincipal = document.querySelector(".modal .cuadro .img img");
    let imgH;

    function modalMover(){
        $("#a").css("display","block");
        $("#b").css("display","block");
        cargarImgPre(imgPrePrincipal);
    }
    function cargarImgPre(img,callback = false){
        const imgSelected = imgCargadas[imgPrincipal.getAttribute("id-img")];
        var reader = new FileReader();
        reader.addEventListener("loadend", function() {
            
            img.onload = function(){
                
                imgH = (img.clientHeight - cuadro.clientHeight) * 2;
                rangeOffset.style.display = imgH > 0? "inline-block" : "none";
                const margin = (rangeOffset.value * imgH / 100) / 2;
                img.style.marginTop = `-${margin}px`;
                // if(callback) callback()
            }
            img.src = reader.result;
         
        });
        reader.readAsDataURL(imgSelected);
    }
    checkSitioPrincipal.addEventListener('change', function(e) {
       
        if(checkSitioPrincipal.checked){
            if(imgPrincipal == null){
                alert("Debes tener imagenes cargadas para habilitar esta opcion");
                checkSitioPrincipal.checked = false;
            }
            else{
                setCambios(false);
                if(imgPreSelected){
                    cuadroCopy.style.display = "inline-block";
                    btnMover.style.display = "inline-block";
                }
                else{
                   modalMover();
                }            
            }
        }
        else {
            setCambios(false);
            cuadroCopy.style.display="none";
            btnMover.style.display="none";
        };
        
    });
    
    $(".modal .cancel").click(function(){
        if(cuadroCopy.style.display == "none"){
            checkSitioPrincipal.checked = false;
        }
        $("#a").fadeOut();
        $("#b").fadeOut();
        if(!imgPreSelected) {
            checkSitioPrincipal.checked = false;
            cuadroCopy.style.display="none";
            btnMover.style.display="none";
        }
    });

    $(".modal .aceptar").click(function(){
        cuadroCopy.innerHTML = "";
        cuadroCopy.append(cuadro.cloneNode(true));
        cuadroCopy.style.display="inline-block";
        btnMover.style.display="inline-block";
        noDisponible.style.display = "none";
        imgPreSelected = true;
        const imgPreCopy = document.querySelector("#cuadro-copy .img img");
        let margin = parseInt(imgPrePrincipal.style.marginTop,10);
        let tam = imgPrePrincipal.clientHeight;
        imgPrePercent = (margin * (-1)) * 100 / tam;
        imgPrePercent = Math.round((imgPrePercent + Number.EPSILON) * 10000) / 10000;
        console.log("tam: " + tam);
        console.log("margin: "+margin);
        console.log(imgPrePercent + "%");
        margin = (margin / 1.52) + "px";
        imgPreCopy.style.marginTop = margin;
        $("#a").fadeOut();
        $("#b").fadeOut();
        setCambios(false);
    });

    btnMover.addEventListener("click",function(){
        modalMover();
    });
    
    rangeOffset.addEventListener("change", () =>{
        const margin = (rangeOffset.value * imgH / 100) / 2;
        imgPrePrincipal.style.marginTop = `-${margin}px`;
    });







  
    inputEspecial.addEventListener('change', () => {
        setCambios(false);
    });
    comboCategoria.addEventListener('change', () => {
        setCambios(false);
    });


    verificarCheckEspecial();

    function verificarCheckEspecial(){
        if(checkEspecial.checked)
            divFechEspecial.style.display = "inline-block";
        else divFechEspecial.style.display = "none";
    }
    
    btnBorrador.addEventListener("click",function(){
        guardar(false);
    },false);

    btnPublicar.addEventListener("click",function(){
        guardar(true);
    },false);
    
    function guardar(publicar){

        if(btnBorrador.classList.contains("desactivado") ||
           btnPublicar.classList.contains("desactivado") ) 
                return;

        if(titulo.value == ""){
            alert("Ponle un titulo a la nota");
            titulo.focus();
            return;
        }
        var textoNota = $("#summernote").summernote('code');
        var sitioPrincipal = checkSitioPrincipal.checked;
        var fechaEspecial = checkEspecial.checked? inputEspecial.value : "";
        var feria = comboCategoria.value == "1";
        if(publicar){
            if(textoNota == "<p><br></p>" && imgCargadas.length === 0){
                alert("Debes poner algun texto o imagen antes de avanzar");
                return;
            }   
            if(comboCategoria.value == "0"){
                alert("Debes seleccionar una categoria antes de avanzar");
                return;
            } 
            if(checkEspecial.checked && fechaEspecial == ""){
                alert("Coloca una fecha o deshabilita la opcion Publcar con fecha especial");
                return;
            }

            if(textoNota == "<p><br></p>")
                if(!confirm("La nota no tiene texto ¿Avanzar de todos modos?"))
                    return;
            
            if(imgCargadas.length === 0)
                if(!confirm('La nota no tiene imagenes ¿Avanzar de todos modos?'))
                    return;

        
            if(cambiosGuardados && idNota != null){
                location.href = "../nota.php?idNota="+idNota+(feria?"&feria":"");
                return;
            }
            
        }
    
      
        btnBorrador.style.display = "none";
        spinner.classList.add("lds-dual-ring");
        spinner.classList.add("nuevaNota");
        btnBorrador.classList.add("desactivado");
        btnPublicar.classList.add("desactivado");
        if(idNota == null)
            spanGenerandoLinks.style.display = "inline";
            
        var form = new FormData();
        form.append("opcion",'subirNota');
        form.append("titulo", titulo.value);
        form.append("texto" , textoNota);
        form.append("categoria",comboCategoria.value);
        form.append("fechaEspecial",fechaEspecial);
        form.append("idNota", idNota);
        form.append("sitioPrincipal",sitioPrincipal);
        form.append("imgPrePercent",imgPrePercent);

        for(var i = 0; i < imgCargadas.length; i++)
            if(imgCargadas[i])
                form.append('imagen[]',imgCargadas[i],"img"+i+".jpg");
        
        if(imgPrincipal != null){
            var id = imgPrincipal.getAttribute("id-img");
            form.append("imgPrincipal","img"+id+".jpg");
        }
        const xhr = new  XMLHttpRequest();
        xhr.open('POST','../php/ajax.php',true);
        xhr.onreadystatechange = function (aEvt) {
            if (xhr.readyState == 4) {
                if(xhr.status == 200){
                    btnBorrador.classList.remove("desactivado");
                    btnPublicar.classList.remove("desactivado");
                    var datos = JSON.parse(xhr.responseText);
                    console.log(datos);
                    if(publicar) {
                        cambiosGuardados = true;
                        location.href = "../nota.php?idNota="+datos.id+(feria?"&feria":"");
                    }
                    else {
                        spinner.classList.remove("lds-dual-ring");
                        spinner.classList.remove("nuevaNota");
                        spanGenerandoLinks.style.display = "none";
                        setCambios(true);
                        crearBorrador(datos);
                        random = Math.floor(Math.random() * (200000 - 100000) + 100000);
                        //cambia la variable que evita tomar imagenes de la cache
                        if(datos.url != ""){
                            divLinks.style.display = "inline-block";
                            spanLinkDirecto.innerHTML = "https://www.tepatitlan.gob.mx/comunicacion/nota.php?idNota="+datos.id;
                            spanLinkRecortado.innerHTML = datos.url;
                            eventCopy();
                        }
                    }
                }
                else alert("Revisa tu conexión a internet");
            }
        };
        xhr.send(form);
    }


    

    function eventCopy(){
        let urls = document.querySelectorAll("#contenido #links span:not(.tooltiptext)");
        const tam = urls.length;
        for(let i = 0; i < tam; i++){
            urls[i].addEventListener("click",function(e){
                e.preventDefault();
                let textTip = $(this).siblings("span");
                textTip.html("Copiado!");
                Clipboard_CopyTo(this.innerHTML);
                $(this).mouseout(function(){
                    console.log("out");
                    textTip.html("Haz clic para copiar");
                    $(this).off("mouseout");
                });
            });
        }
    }

    function Clipboard_CopyTo(value) {
        var tempInput = document.createElement("input");
        tempInput.value = value;
        document.body.appendChild(tempInput);
        tempInput.select();
        document.execCommand("copy");
        document.body.removeChild(tempInput);
    }


    window.onbeforeunload = function() {
        if(!cambiosGuardados){ 
            btnBorrador.blur();
            btnBorrador.focus();
            return false;
        }
    }

    var editar = getUrlParameter("editar");
    var focus = true;
    if(editar != undefined){
        $('.borrador[idBorrador="'+editar+'"]').click();
        focus = false;
    }
    $("#contenido").fadeIn(window.peticion? 300:0,function () {
        if(focus)titulo.focus();
    });

})})});