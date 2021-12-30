

// const $=id=>{const e=document.querySelectorAll(id);return e.length==1?e[0]:e.length==0?null:[...e]}
// EventTarget.prototype.on = EventTarget.prototype.addEventListener;
// EventTarget.prototype.forEach = function(f){f(this)};
// Array.prototype.on = function(ev,f){this.forEach(e=>{e.on(ev,f)})}
// const create = tag=>document.createElement(tag);

class ImgDrop{

    constructor(div){

        const dropArea = document.createElement('div')
        dropArea.classList.add('drop-area','droppable')
        dropArea.addEventListener('click',()=> console.log('click drop'))
        
        const dropH2 = document.createElement('h2')
        dropH2.innerHTML = 'Arrastra aquí las imagenes'
        dropH2.classList.add('droppable')
        dropArea.appendChild(dropH2);

        const dropH3 = document.createElement('h3')
        dropH3.innerHTML = 'También puedes seleccionarlas'
        dropH3.classList.add('droppable')
        dropArea.appendChild(dropH3)

        const input = document.createElement('input')
        input.type = 'file'
        input.setAttribute('multiple','')
        input.classList.add('droppable')
        dropArea.appendChild(input)
        
        div.appendChild(dropArea)
        

        const previewArea = document.createElement('div')
        previewArea.classList.add('img-preview','droppable')
        previewArea.innerHTML = '<h4 class="droppable">No hay imagenes cargadas</h4>'
        previewArea.addEventListener('click', ()=> console.log('click pre'))
        div.append(previewArea)
    

        document.documentElement.addEventListener('dragover', e=>{
            e.preventDefault();
            let cursor = "none";
            if(e.target.classList.contains("droppable"))
                cursor = "move";
            e.dataTransfer.dropEffect = cursor;
        });
        document.addEventListener("dragover",function(e){
            e.preventDefault();
            e.stopPropagation();
        });
        document.addEventListener("drop",function(e){
            e.preventDefault();
            e.stopPropagation();
        });

    }
    

}
// const dropArea
// $('.drag-drop').innerHTML = `
//     <section id="subir-imagen">
//     <h2>Arrastra aquí las imagenes de la nota.</h2><br>
//     <h3>Tambien puedes seleccionarlas.</h3>
//     <input type="file" id="img-input" name="img-input" multiple>
//     </section><br><br>
//     <h3 class="trapecio">Imagenes</h3><br>
//     <section id="img-cargadas"><h4>No hay imagenes cargadas</h4></section>`
